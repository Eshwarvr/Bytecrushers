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
  const res = await api.get('/api/notifications');
  return res.data;
}

export async function fetchActivityLogs(filters?: { category?: string; dateRange?: { from: Date; to: Date } }): Promise<ActivityLog[]> {
  let url = '/api/activity-logs';
  if (filters?.category && filters.category !== 'All') {
    url += \`?category=\${filters.category}\`;
  }
  const res = await api.get(url);
  return res.data;
}

export async function fetchDashboardKPIs() {
  const res = await api.get('/api/dashboard-kpis');
  return res.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(\`/api/notifications/\${id}/read\`);
}

export default api;
