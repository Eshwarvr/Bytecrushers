import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';
import { logActivity, createNotification } from '../lib/activity.service';

export async function createBooking(req: AuthenticatedRequest, res: Response) {
  const { asset_id, start_time, end_time } = req.body;
  if (!asset_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'asset_id, start_time, and end_time are required' });
  }

  const start = new Date(start_time);
  const end = new Date(end_time);

  if (start >= end) {
    return res.status(400).json({ error: 'start_time must be before end_time' });
  }

  try {
    // Check overlap: new_start < existing_end AND new_end > existing_start
    const { data: overlapping, error: overlapError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('asset_id', asset_id)
      .lt('start_time', end.toISOString())
      .gt('end_time', start.toISOString());

    if (overlapError) throw overlapError;
    if (overlapping && overlapping.length > 0) {
      return res.status(400).json({ error: 'Booking time overlaps with an existing booking' });
    }

    const { data: asset } = await supabaseAdmin.from('assets').select('name').eq('id', asset_id).single();

    const { data: booking, error: insertError } = await supabaseAdmin
      .from('bookings')
      .insert([{
        asset_id,
        employee_id: req.employee?.id,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    
    await logActivity({ actor: req.employee?.name || 'System', actorId: req.employee?.id!, action: 'Booked Resource', entityType: 'Booking', entityId: booking.id, entityName: asset?.name || 'Resource', category: 'Bookings' });
    await createNotification({ type: 'BOOKING_CONFIRMED', title: 'Booking Confirmed', message: `Your booking for ${asset?.name} is confirmed`, entityType: 'Booking', entityId: booking.id, userId: req.employee?.id });

    return res.status(201).json(booking);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function listBookings(req: AuthenticatedRequest, res: Response) {
  try {
    let query = supabaseAdmin.from('bookings').select(`
      *,
      asset:assets(*),
      employee:employees(*)
    `);

    if (req.employee?.role !== 'Admin' && req.employee?.role !== 'AssetManager') {
      query = query.eq('employee_id', req.employee?.id);
    }

    const { data: bookings, error } = await query;
    if (error) throw error;
    return res.status(200).json(bookings);
  } catch (error: any) {
    console.error('List bookings error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list bookings' });
  }
}

export async function deleteBooking(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('employee_id')
      .eq('id', id)
      .single();

    if (fetchError || !booking) throw fetchError || new Error('Booking not found');

    if (booking.employee_id !== req.employee?.id && req.employee?.role !== 'Admin' && req.employee?.role !== 'AssetManager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error: any) {
    console.error('Delete booking error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete booking' });
  }
}
