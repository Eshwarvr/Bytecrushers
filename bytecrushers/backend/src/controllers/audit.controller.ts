import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';
import { logActivity } from '../lib/activity.service';

export async function listCycles(req: AuthenticatedRequest, res: Response) {
  try {
    const { data, error } = await supabaseAdmin.from('audit_cycles').select('*');
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function createCycle(req: AuthenticatedRequest, res: Response) {
  try {
    const { data, error } = await supabaseAdmin.from('audit_cycles').insert([req.body]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function listItems(req: AuthenticatedRequest, res: Response) {
  try {
    const { cycleId } = req.params;
    let query = supabaseAdmin.from('audit_items').select('*, asset:assets(*)');
    if (cycleId) query = query.eq('cycle_id', cycleId);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function addAuditItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { data, error } = await supabaseAdmin.from('audit_items').insert([{...req.body, verified_by: req.employee?.id}]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function closeCycle(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await supabaseAdmin.from('audit_cycles').update({ status: 'Closed' }).eq('id', id);
    
    // Cascade Lost status
    const { data: items } = await supabaseAdmin.from('audit_items').select('asset_id, verification_status').eq('cycle_id', id);
    if (items) {
      for (const item of items) {
        if (item.verification_status === 'Missing') {
          await supabaseAdmin.from('assets').update({ status: 'Lost' }).eq('id', item.asset_id);
          await logActivity({ actor: req.employee?.name || 'System', actorId: req.employee?.id!, action: 'Asset marked Lost from Audit', entityType: 'Asset', entityId: item.asset_id, entityName: 'Asset', category: 'Alerts' });
        }
      }
    }
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
