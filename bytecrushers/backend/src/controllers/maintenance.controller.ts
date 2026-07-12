import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';
import { logActivity, createNotification } from '../lib/activity.service';

export async function listRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const { data, error } = await supabaseAdmin.from('maintenance_requests').select('*, asset:assets(*), raised_by_emp:employees!raised_by(*)');
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function createRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const { asset_id, issue_description, priority } = req.body;
    const { data: asset } = await supabaseAdmin.from('assets').select('*').eq('id', asset_id).single();
    const { data, error } = await supabaseAdmin.from('maintenance_requests').insert([{ asset_id, raised_by: req.employee?.id, issue_description, priority: priority || 'Medium' }]).select().single();
    if (error) throw error;
    
    await logActivity({ actor: req.employee?.name || 'System', actorId: req.employee?.id!, action: 'Raised Maintenance', entityType: 'Maintenance', entityId: data.id, entityName: asset?.name || 'Asset', category: 'Approvals' });
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function updateStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { status } = req.body;
    const { data: reqData } = await supabaseAdmin.from('maintenance_requests').select('asset_id, raised_by').eq('id', req.params.id).single();
    
    // Auto-Cascade Asset Status
    if (reqData && (status === 'Approved' || status === 'InProgress' || status === 'TechnicianAssigned')) {
      await supabaseAdmin.from('assets').update({ status: 'UnderMaintenance' }).eq('id', reqData.asset_id);
    } else if (reqData && (status === 'Resolved' || status === 'Rejected')) {
      await supabaseAdmin.from('assets').update({ status: 'Available' }).eq('id', reqData.asset_id);
    }

    const { data, error } = await supabaseAdmin.from('maintenance_requests').update({ status }).eq('id', req.params.id).select().single();
    if (error) throw error;

    if (reqData?.raised_by) {
      await createNotification({ type: 'MAINTENANCE_UPDATE', title: 'Maintenance ' + status, message: 'Maintenance status updated to ' + status, entityType: 'Maintenance', entityId: data.id, userId: reqData.raised_by });
    }
    await logActivity({ actor: req.employee?.name || 'System', actorId: req.employee?.id!, action: 'Updated Maintenance to ' + status, entityType: 'Maintenance', entityId: data.id, entityName: 'Maintenance Request', category: 'Approvals' });
    
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
