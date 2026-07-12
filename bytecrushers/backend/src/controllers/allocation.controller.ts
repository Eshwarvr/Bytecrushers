import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';
import { logActivity, createNotification } from '../lib/activity.service';

export async function createAllocation(req: AuthenticatedRequest, res: Response) {
  const { asset_id, employee_id, expected_return_date } = req.body;
  if (!asset_id || !employee_id) {
    return res.status(400).json({ error: 'asset_id and employee_id are required' });
  }

  try {
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('status, name')
      .eq('id', asset_id)
      .single();

    if (assetError) throw assetError;
    
    // Check if asset is already allocated
    if (asset?.status === 'Allocated') {
      const { data: currentAlloc } = await supabaseAdmin
        .from('allocations')
        .select('held_by_id, employees:held_by_id(name)')
        .eq('asset_id', asset_id)
        .eq('status', 'Active')
        .single();
      
      const heldByName = currentAlloc?.employees?.[0]?.name || 'Unknown';
      return res.status(409).json({ 
        error: \`Asset is currently held by \${heldByName}. Please submit a Transfer Request instead.\`,
        actionRequired: 'TRANSFER_REQUEST'
      });
    }
    
    if (asset?.status !== 'Available') {
      return res.status(400).json({ error: 'Asset is not available for allocation' });
    }

    const { data: allocation, error: allocError } = await supabaseAdmin
      .from('allocations')
      .insert([{ 
        asset_id, 
        held_by_type: 'employee', 
        held_by_id: employee_id,
        expected_return_date: expected_return_date || null
      }])
      .select()
      .single();
    if (allocError) throw allocError;

    const { error: updateError } = await supabaseAdmin
      .from('assets')
      .update({ status: 'Allocated' })
      .eq('id', asset_id);
    if (updateError) throw updateError;

    await createNotification({ type: 'ASSET_ASSIGNED', title: 'Asset Assigned', message: \`You have been allocated \${asset.name}\`, entityType: 'Asset', entityId: asset_id, userId: employee_id });
    await logActivity({ actor: req.employee?.name || 'System', actorId: req.employee?.id!, action: 'Allocated Asset', entityType: 'Asset', entityId: asset_id, entityName: asset.name, category: 'Approvals' });

    return res.status(201).json(allocation);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function returnAllocation(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { asset_condition } = req.body;

  try {
    const { data: allocation, error: allocCheckError } = await supabaseAdmin
      .from('allocations')
      .select('asset_id, returned_date, assets(name)')
      .eq('id', id)
      .single();

    if (allocCheckError) throw allocCheckError;
    if (allocation.returned_date) {
      return res.status(400).json({ error: 'Allocation is already returned' });
    }

    await supabaseAdmin
      .from('allocations')
      .update({ returned_date: new Date().toISOString(), status: 'Returned' })
      .eq('id', id);

    await supabaseAdmin
      .from('assets')
      .update({ status: 'Available', condition: asset_condition || 'Good' })
      .eq('id', allocation.asset_id);
      
    await logActivity({ actor: req.employee?.name || 'System', actorId: req.employee?.id!, action: 'Returned Asset', entityType: 'Asset', entityId: allocation.asset_id, entityName: allocation.assets?.[0]?.name || 'Asset', category: 'Approvals' });

    return res.status(200).json({ message: 'Asset returned successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function listAllocations(req: AuthenticatedRequest, res: Response) {
  try {
    let query = supabaseAdmin.from('allocations').select(\`
      *,
      asset:assets(*),
      employee:employees(*)
    \`);

    if (req.employee?.role !== 'Admin' && req.employee?.role !== 'AssetManager') {
      query = query.eq('held_by_id', req.employee?.id);
    }

    const { data: allocations, error } = await query;
    if (error) throw error;
    return res.status(200).json(allocations);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
