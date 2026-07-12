import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';

export async function createTransferRequest(req: AuthenticatedRequest, res: Response) {
  const { asset_id, to_employee_id } = req.body;
  if (!asset_id || !to_employee_id) {
    return res.status(400).json({ error: 'asset_id and to_employee_id are required' });
  }

  try {
    // Only current holder can create a transfer request for their asset
    const { data: allocation, error: allocError } = await supabaseAdmin
      .from('allocations')
      .select('employee_id')
      .eq('asset_id', asset_id)
      .is('returned_at', null)
      .single();
    
    if (allocError || !allocation) {
      return res.status(400).json({ error: 'Asset is not currently allocated' });
    }

    if (allocation.employee_id !== req.employee?.id && req.employee?.role !== 'Admin') {
      return res.status(403).json({ error: 'Only the current holder can request a transfer' });
    }

    const { data: request, error: reqError } = await supabaseAdmin
      .from('transfer_requests')
      .insert([{
        asset_id,
        from_employee_id: allocation.employee_id,
        to_employee_id,
        status: 'pending'
      }])
      .select()
      .single();

    if (reqError) throw reqError;
    return res.status(201).json(request);
  } catch (error: any) {
    console.error('Create transfer request error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create transfer request' });
  }
}

export async function processTransferRequest(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'reject'

  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'Invalid action. Must be approve or reject.' });
  }

  try {
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('transfer_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !request) throw fetchError || new Error('Request not found');
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request is not pending' });

    // Only AssetManager or Admin can approve/reject
    if (req.employee?.role !== 'Admin' && req.employee?.role !== 'AssetManager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { error: updateReqError } = await supabaseAdmin
      .from('transfer_requests')
      .update({ status: newStatus })
      .eq('id', id);
    if (updateReqError) throw updateReqError;

    if (action === 'approve') {
      // 1. Close current allocation
      await supabaseAdmin
        .from('allocations')
        .update({ returned_at: new Date().toISOString() })
        .eq('asset_id', request.asset_id)
        .is('returned_at', null);

      // 2. Create new allocation
      await supabaseAdmin
        .from('allocations')
        .insert([{
          asset_id: request.asset_id,
          employee_id: request.to_employee_id
        }]);
    }

    return res.status(200).json({ message: `Transfer request ${newStatus}` });
  } catch (error: any) {
    console.error('Process transfer error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process transfer request' });
  }
}

export async function listTransferRequests(req: AuthenticatedRequest, res: Response) {
  try {
    let query = supabaseAdmin.from('transfer_requests').select(`
      *,
      asset:assets(*),
      from_employee:employees!from_employee_id(*),
      to_employee:employees!to_employee_id(*)
    `);

    if (req.employee?.role !== 'Admin' && req.employee?.role !== 'AssetManager') {
      query = query.or(`from_employee_id.eq.${req.employee?.id},to_employee_id.eq.${req.employee?.id}`);
    }

    const { data: requests, error } = await query;
    if (error) throw error;
    return res.status(200).json(requests);
  } catch (error: any) {
    console.error('List transfers error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list transfer requests' });
  }
}
