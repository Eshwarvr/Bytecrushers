import axios from 'axios';
import { supabase } from './supabaseClient';
import type { Asset, Allocation, Booking, MaintenanceRequest, Notification, ActivityLog, AuditItem } from './types';
import { 
  generateAssets, 
  generateAllocations, 
  generateMaintenanceRequests, 
  generateBookings,
  generateNotifications, 
  generateActivityLogs 
} from '../features/dashboard/mock/generators';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to automatically add the current Supabase JWT token to the authorization header
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.error('Failed to attach auth token:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Phase 2 & 3 Integrated Endpoints ---

export async function fetchAssets(): Promise<Asset[]> {
  const res = await api.get('/api/assets');
  return res.data;
}

export async function fetchAllocations(): Promise<Allocation[]> {
  const res = await api.get('/api/allocations');
  return res.data;
}

export async function fetchBookings(): Promise<Booking[]> {
  const res = await api.get('/api/bookings');
  return res.data;
}

export async function fetchMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const res = await api.get('/api/maintenance');
  return res.data;
}

export async function fetchAuditItems(): Promise<AuditItem[]> {
  const res = await api.get('/api/audit');
  return res.data;
}

// --- Phase 4 Analytics & Dashboard Endpoints ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchNotifications(): Promise<Notification[]> {
  // TODO: swap to real backend endpoint once Phase 2/3 exposes /api/notifications
  await delay(500);
  return generateNotifications();
}

export async function fetchActivityLogs(filters?: { category?: string; dateRange?: { from: Date; to: Date } }): Promise<ActivityLog[]> {
  // TODO: swap to real backend endpoint once Phase 2/3 exposes /api/activity-logs
  await delay(600);
  let logs = generateActivityLogs();
  
  if (filters?.category && filters.category !== 'All') {
    logs = logs.filter(log => log.category === filters.category);
  }
  return logs;
}

export async function fetchDashboardKPIs() {
  // TODO: swap to real backend endpoint once Phase 2/3 exposes /api/dashboard-kpis
  await delay(700);
  const assets = generateAssets();
  const allocations = generateAllocations();
  const maintenance = generateMaintenanceRequests();
  const bookings = generateBookings();

  const available = assets.filter(a => a.status === 'Available').length;
  const allocated = assets.filter(a => a.status === 'Allocated').length;
  const inMaintenance = maintenance.filter(m => m.status === 'InProgress').length;
  const activeBookings = bookings.filter(b => b.status === 'Ongoing').length;
  
  // TODO: replace with real count from /api/transfers?status=Requested once Phase 2 exposes it
  const pendingTransfers = 0;
  
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

export async function markNotificationRead(id: string): Promise<void> {
  // TODO: swap to real backend endpoint once Phase 2/3 exposes /api/notifications/:id/read
  await delay(300);
  console.log(`Notification ${id} marked as read`);
}

export default api;
