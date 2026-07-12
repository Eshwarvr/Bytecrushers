import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';
export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const { data, error } = await supabaseAdmin.from('notifications').select('*').eq('user_id', req.employee?.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function markRead(req: AuthenticatedRequest, res: Response) {
  try {
    const { error } = await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
