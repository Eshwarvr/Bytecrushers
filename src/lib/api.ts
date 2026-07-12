import { generateAssets, generateAllocations, generateBookings, generateMaintenanceRequests, generateNotifications, generateActivityLogs, generateAuditItems } from '@/features/dashboard/mock/generators';
import type { Asset, Allocation, Booking, MaintenanceRequest, Notification, ActivityLog, AuditItem } from '@/lib/types';

// SWAP POINT: Replace mock imports with Supabase client calls

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchAssets(): Promise<Asset[]> {
  await delay(500);
  return generateAssets();
}

export async function fetchAllocations(): Promise<Allocation[]> {
  await delay(500);
  return generateAllocations();
}

export async function fetchBookings(): Promise<Booking[]> {
  await delay(500);
  return generateBookings();
}

export async function fetchMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  await delay(500);
  return generateMaintenanceRequests();
}

export async function fetchNotifications(): Promise<Notification[]> {
  await delay(500);
  return generateNotifications();
}

export async function fetchActivityLogs(filters?: { category?: string; dateRange?: { from: Date; to: Date } }): Promise<ActivityLog[]> {
  await delay(600);
  let logs = generateActivityLogs();
  
  if (filters?.category && filters.category !== 'All') {
    logs = logs.filter(log => log.category === filters.category);
  }
  
  // Date filtering logic could be added here if needed
  
  return logs;
}

export async function fetchDashboardKPIs() {
  await delay(700);
  const assets = generateAssets();
  const allocations = generateAllocations();
  const maintenance = generateMaintenanceRequests();
  const bookings = generateBookings();

  const available = assets.filter(a => a.status === 'Available').length;
  const allocated = assets.filter(a => a.status === 'Allocated').length;
  const inMaintenance = maintenance.filter(m => m.status === 'InProgress').length;
  const activeBookings = bookings.filter(b => b.status === 'Ongoing').length;
  const pendingTransfers = 0; // Stub for now
  const upcomingReturns = allocations.filter(a => a.status === 'Active' && a.expectedReturnDate != null).length;

  return {
    available,
    allocated,
    inMaintenance,
    activeBookings,
    pendingTransfers,
    upcomingReturns
  };
}

export async function fetchAuditItems(): Promise<AuditItem[]> {
  await delay(500);
  return generateAuditItems();
}

export async function markNotificationRead(id: string): Promise<void> {
  await delay(300);
  // MOCK: Update state locally or do nothing since we use mock generators directly
  console.log(`Notification ${id} marked as read`);
}
