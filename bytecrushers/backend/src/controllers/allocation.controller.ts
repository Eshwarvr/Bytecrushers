import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';

// 2. Allocation Engine
export async function createAllocation(req: AuthenticatedRequest, res: Response) {
  const { asset_id, employee_id } = req.body;
  if (!asset_id || !employee_id) {
    return res.status(400).json({ error: 'asset_id and employee_id are required' });
  }

  try {
    // Check if asset is available
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('status')
      .eq('id', asset_id)
      .single();

    if (assetError) throw assetError;
    if (asset?.status !== 'available') {
      return res.status(400).json({ error: 'Asset is not available for allocation' });
    }

    // Use transaction-like behavior: insert allocation, update asset
    const { data: allocation, error: allocError } = await supabaseAdmin
      .from('allocations')
      .insert([{ asset_id, employee_id }])
      .select()
      .single();
    if (allocError) throw allocError;

    const { error: updateError } = await supabaseAdmin
      .from('assets')
      .update({ status: 'allocated' })
      .eq('id', asset_id);
    if (updateError) throw updateError;

    return res.status(201).json(allocation);
  } catch (error: any) {
    console.error('Create allocation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create allocation' });
  }
}

export async function returnAllocation(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { asset_condition } = req.body; // Phase 3 placeholder, not strictly needed but good

  try {
    const { data: allocation, error: allocCheckError } = await supabaseAdmin
      .from('allocations')
      .select('asset_id, returned_at')
      .eq('id', id)
      .single();

    if (allocCheckError) throw allocCheckError;
    if (allocation.returned_at) {
      return res.status(400).json({ error: 'Allocation is already returned' });
    }

    const { error: allocUpdateError } = await supabaseAdmin
      .from('allocations')
      .update({ returned_at: new Date().toISOString() })
      .eq('id', id);
    if (allocUpdateError) throw allocUpdateError;

    const { error: assetUpdateError } = await supabaseAdmin
      .from('assets')
      .update({ status: 'available' })
      .eq('id', allocation.asset_id);
    if (assetUpdateError) throw assetUpdateError;

    return res.status(200).json({ message: 'Asset returned successfully' });
  } catch (error: any) {
    console.error('Return allocation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to return allocation' });
  }
}

export async function listAllocations(req: AuthenticatedRequest, res: Response) {
  try {
    // If not Admin/AssetManager, only show own allocations
    let query = supabaseAdmin.from('allocations').select(`
      *,
      asset:assets(*),
      employee:employees(*)
    `);

    if (req.employee?.role !== 'Admin' && req.employee?.role !== 'AssetManager') {
      query = query.eq('employee_id', req.employee?.id);
    }

    const { data: allocations, error } = await query;
    if (error) throw error;
    return res.status(200).json(allocations);
  } catch (error: any) {
    console.error('List allocations error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list allocations' });
  }
}
