const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'bytecrushers/backend/src/controllers');
const routesDir = path.join(__dirname, 'bytecrushers/backend/src/routes');

// Helpers for file writing
const writeIfMissing = (dir, name, content) => {
  const file = path.join(dir, name);
  fs.writeFileSync(file, content.trim() + '\n');
};

// 1. DASHBOARD
writeIfMissing(controllersDir, 'dashboard.controller.ts', `
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';

export async function getDashboardKPIs(req: AuthenticatedRequest, res: Response) {
  try {
    const [{ count: available }, { count: allocated }, { count: inMaintenance }, { count: activeBookings }, { count: pendingTransfers }, { count: upcomingReturns }] = await Promise.all([
      supabaseAdmin.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'Available'),
      supabaseAdmin.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'Allocated'),
      supabaseAdmin.from('maintenance_requests').select('*', { count: 'exact', head: true }).in('status', ['Pending', 'Approved', 'TechnicianAssigned', 'InProgress']),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['Upcoming', 'Ongoing']),
      supabaseAdmin.from('transfers').select('*', { count: 'exact', head: true }).eq('status', 'Requested'),
      supabaseAdmin.from('allocations').select('*', { count: 'exact', head: true }).eq('status', 'Active').not('expected_return_date', 'is', null)
    ]);
    return res.json({ available: available || 0, allocated: allocated || 0, inMaintenance: inMaintenance || 0, activeBookings: activeBookings || 0, pendingTransfers: pendingTransfers || 0, upcomingReturns: upcomingReturns || 0 });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
`);
writeIfMissing(routesDir, 'dashboard.routes.ts', `
import { Router } from 'express';
import { getDashboardKPIs } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';
const router = Router();
router.get('/', requireAuth, getDashboardKPIs);
export default router;
`);

// 2. ACTIVITY & NOTIFICATIONS
writeIfMissing(controllersDir, 'activity.controller.ts', `
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
`);
writeIfMissing(routesDir, 'activity.routes.ts', `
import { Router } from 'express';
import { getLogs } from '../controllers/activity.controller';
import { requireAuth } from '../middleware/auth.middleware';
const router = Router();
router.get('/', requireAuth, getLogs);
export default router;
`);

writeIfMissing(controllersDir, 'notification.controller.ts', `
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
`);
writeIfMissing(routesDir, 'notification.routes.ts', `
import { Router } from 'express';
import { getNotifications, markRead } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';
const router = Router();
router.get('/', requireAuth, getNotifications);
router.post('/:id/read', requireAuth, markRead);
export default router;
`);

// 3. MAINTENANCE (Kanban)
writeIfMissing(controllersDir, 'maintenance.controller.ts', `
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
    if (status === 'Approved' || status === 'InProgress' || status === 'TechnicianAssigned') {
      await supabaseAdmin.from('assets').update({ status: 'UnderMaintenance' }).eq('id', reqData.asset_id);
    } else if (status === 'Resolved' || status === 'Rejected') {
      await supabaseAdmin.from('assets').update({ status: 'Available' }).eq('id', reqData.asset_id);
    }

    const { data, error } = await supabaseAdmin.from('maintenance_requests').update({ status }).eq('id', req.params.id).select().single();
    if (error) throw error;

    await createNotification({ type: 'MAINTENANCE_UPDATE', title: 'Maintenance ' + status, message: 'Maintenance status updated to ' + status, entityType: 'Maintenance', entityId: data.id, userId: reqData.raised_by });
    await logActivity({ actor: req.employee?.name || 'System', actorId: req.employee?.id!, action: 'Updated Maintenance to ' + status, entityType: 'Maintenance', entityId: data.id, entityName: 'Maintenance Request', category: 'Approvals' });
    
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
`);
writeIfMissing(routesDir, 'maintenance.routes.ts', `
import { Router } from 'express';
import { listRequests, createRequest, updateStatus } from '../controllers/maintenance.controller';
import { requireAuth } from '../middleware/auth.middleware';
const router = Router();
router.get('/', requireAuth, listRequests);
router.post('/', requireAuth, createRequest);
router.patch('/:id/status', requireAuth, updateStatus);
export default router;
`);

// 4. AUDIT
writeIfMissing(controllersDir, 'audit.controller.ts', `
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
`);
writeIfMissing(routesDir, 'audit.routes.ts', `
import { Router } from 'express';
import { listCycles, createCycle, listItems, addAuditItem, closeCycle } from '../controllers/audit.controller';
import { requireAuth } from '../middleware/auth.middleware';
const router = Router();
router.get('/', requireAuth, listCycles);
router.post('/', requireAuth, createCycle);
router.get('/items', requireAuth, listItems);
router.get('/:cycleId/items', requireAuth, listItems);
router.post('/items', requireAuth, addAuditItem);
router.post('/:id/close', requireAuth, closeCycle);
export default router;
`);

console.log("Done generating missing files.");
