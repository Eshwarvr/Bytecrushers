import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';
export async function getLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { category } = req.query;
    let q = supabaseAdmin.from('activity_logs').select('*').order('timestamp', { ascending: false });
    if (category && category !== 'All') q = q.eq('category', category);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
