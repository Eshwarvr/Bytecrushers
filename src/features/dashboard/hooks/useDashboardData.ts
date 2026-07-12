import { useQuery } from '@tanstack/react-query';
import { fetchDashboardKPIs, fetchAllocations, fetchActivityLogs } from '@/lib/api';

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboardKPIs'],
    queryFn: fetchDashboardKPIs,
    staleTime: 1000 * 60,
  });
}

export function useOverdueReturns() {
  return useQuery({
    queryKey: ['allocations', 'overdue'],
    queryFn: async () => {
      const all = await fetchAllocations();
      return all.filter(a => a.status === 'Overdue' || (a.expectedReturnDate && new Date(a.expectedReturnDate) < new Date() && !a.returnedDate));
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['activity', 'recent'],
    queryFn: async () => {
      const logs = await fetchActivityLogs();
      return logs.slice(0, 5);
    },
  });
}
