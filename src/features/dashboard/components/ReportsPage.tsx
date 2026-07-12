import { UtilizationChart } from './charts/UtilizationChart';
import { MaintenanceFrequencyChart } from './charts/MaintenanceFrequencyChart';
import { ExportButton } from './ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Data insights and summaries for assets and resources
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton type="csv" />
          <ExportButton type="pdf" />
        </div>
      </div>

      <div className="flex gap-4 items-center bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="w-48">
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="it">IT Infrastructure</SelectItem>
              <SelectItem value="ops">Field Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select defaultValue="30d">
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UtilizationChart />
        <MaintenanceFrequencyChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Used Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm font-medium">
              <li>Ford Transit Van (14 bookings)</li>
              <li>Conference Projector (12 bookings)</li>
              <li>Sony A7IV Camera (8 bookings)</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Idle Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Toyota Hilux (0 bookings, 48 days)</li>
              <li>Portable Generator (0 bookings, 30 days)</li>
              <li>Spare Monitor (0 bookings, 15 days)</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Maintenance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-destructive/90">
              <li>Dell XPS 15 (Battery swelling)</li>
              <li>Toyota Hilux (50k service)</li>
              <li>HVAC Unit B (Overheating)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
      <div className="pt-8 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">Detailed Reports</h2>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Allocation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground p-8 text-center bg-muted/10 border border-dashed rounded-lg">
                <p>Department Allocation Table Visualization (Interactive Grid)</p>
                <p className="text-xs mt-2">Drill-down view of asset distribution across sub-departments and cost centers.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resource Booking Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground p-8 text-center bg-muted/10 border border-dashed rounded-lg">
                <p>Booking Density Heatmap (Calendar View)</p>
                <p className="text-xs mt-2">Identify peak utilization times and plan resource availability.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expanded Maintenance Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground p-8 text-center bg-muted/10 border border-dashed rounded-lg">
                <p>Upcoming Maintenance Schedule (Gantt Chart)</p>
                <p className="text-xs mt-2">Detailed timeline of preventative maintenance tasks.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
