import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUtilizationData } from '../../hooks/useReportsData';
import { Skeleton } from '@/components/ui/skeleton';

export function UtilizationChart() {
  const { data, isLoading } = useUtilizationData();

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Utilization by Department</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="available" name="Available" stackId="a" fill="var(--chart-4)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="allocated" name="Allocated" stackId="a" fill="var(--chart-2)" />
                <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
