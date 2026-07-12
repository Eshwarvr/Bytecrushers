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
