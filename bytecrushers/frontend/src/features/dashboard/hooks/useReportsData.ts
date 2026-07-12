import { useQuery } from '@tanstack/react-query';
import { fetchAssets } from '@/lib/api';
import type { Asset } from '@/lib/types';

export function useUtilizationData() {
  return useQuery({
    queryKey: ['reports', 'utilization'],
    queryFn: async () => {
      const assets = await fetchAssets();
      
      const departments: Record<string, { name: string; available: number; allocated: number; maintenance: number }> = {};
      
      assets.forEach((asset: Asset) => {
        const depId = asset.departmentId;
        if (!departments[depId]) {
          departments[depId] = { name: depId, available: 0, allocated: 0, maintenance: 0 };
        }
        
        if (asset.status === 'Available') departments[depId].available++;
        else if (asset.status === 'Allocated') departments[depId].allocated++;
        else if (asset.status === 'UnderMaintenance') departments[depId].maintenance++;
      });
      
      // Map department IDs to names (hardcoded mapping for mock purposes)
      const depNameMap: Record<string, string> = { 'd1': 'IT', 'd2': 'Facilities', 'd3': 'Operations' };
      
      return Object.values(departments).map(d => ({
        ...d,
        name: depNameMap[d.name] || d.name
      }));
    }
  });
}

export function useMaintenanceFrequency() {
  return useQuery({
    queryKey: ['reports', 'maintenance-freq'],
    queryFn: async () => {
      // Mock data for line chart
      return [
        { name: 'Jan', requests: 4, resolved: 3 },
        { name: 'Feb', requests: 7, resolved: 5 },
        { name: 'Mar', requests: 5, resolved: 6 },
        { name: 'Apr', requests: 2, resolved: 2 },
        { name: 'May', requests: 8, resolved: 7 },
        { name: 'Jun', requests: 5, resolved: 4 },
      ];
    }
  });
}
