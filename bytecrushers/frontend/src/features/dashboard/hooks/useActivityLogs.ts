import { useQuery } from '@tanstack/react-query';
import { fetchActivityLogs } from '@/lib/api';

export function useActivityLogs(filters: { category: string; dateRange?: { from: Date; to: Date } }) {
  return useQuery({
    queryKey: ['activity', filters],
    queryFn: () => fetchActivityLogs(filters),
  });
}
