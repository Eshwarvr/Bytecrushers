import { supabaseAdmin } from './supabase';

export async function logActivity(params: {
  actor: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details?: string;
  category: 'Alerts' | 'Approvals' | 'Bookings' | 'All';
}) {
  try {
    const { error } = await supabaseAdmin.from('activity_logs').insert([{
      actor: params.actor,
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_name: params.entityName,
      details: params.details || '',
      category: params.category
    }]);
    if (error) console.error('Activity Log Error:', error);
  } catch (err) {
    console.error('Activity Log Exception:', err);
  }
}

export async function createNotification(params: {
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  userId?: string;
}) {
  try {
    const { error } = await supabaseAdmin.from('notifications').insert([{
      type: params.type,
      title: params.title,
      message: params.message,
      entity_type: params.entityType,
      entity_id: params.entityId,
      user_id: params.userId || null,
      is_read: false
    }]);
    if (error) console.error('Notification Error:', error);
  } catch (err) {
    console.error('Notification Exception:', err);
  }
}
