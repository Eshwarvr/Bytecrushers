import { KPICard } from './KPICard';
import { OverdueReturnsAlert } from './OverdueReturnsAlert';
import { QuickActions } from './QuickActions';
import { ReportReadyPanel } from './ReportReadyPanel';
import { useDashboardKPIs, useRecentActivity } from '../hooks/useDashboardData';
import { Box, Wrench, Calendar, Repeat, Activity, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export function DashboardPage() {
  const { data: kpis, isLoading: kpiLoading } = useDashboardKPIs();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of enterprise assets and resources
          </p>
        </div>
      </div>

      <OverdueReturnsAlert />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Available Assets" value={kpis?.available} icon={<Box className="h-4 w-4" />} isLoading={kpiLoading} />
        <KPICard title="Allocated" value={kpis?.allocated} icon={<HardDrive className="h-4 w-4" />} isLoading={kpiLoading} />
        <KPICard title="In Maintenance" value={kpis?.inMaintenance} icon={<Wrench className="h-4 w-4 text-destructive" />} isLoading={kpiLoading} />
        <KPICard title="Active Bookings" value={kpis?.activeBookings} icon={<Calendar className="h-4 w-4" />} isLoading={kpiLoading} />
        <KPICard title="Pending Transfers" value={kpis?.pendingTransfers} icon={<Repeat className="h-4 w-4" />} isLoading={kpiLoading} />
        <KPICard title="Upcoming Returns" value={kpis?.upcomingReturns} icon={<Activity className="h-4 w-4" />} isLoading={kpiLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity?.map(log => (
                  <div key={log.id} className="flex items-start gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {log.actor} <span className="font-normal text-muted-foreground">{log.action}</span> {log.entityName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.details}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                ))}
                {recentActivity?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-1">
          <ReportReadyPanel />
        </div>
      </div>

      <QuickActions />
    </div>
  );
}
