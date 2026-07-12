import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value?: number | string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  isLoading?: boolean;
  className?: string;
}

export function KPICard({ title, value, icon, trend, trendValue, isLoading, className }: KPICardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-[100px]" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {trendValue && !isLoading && (
          <p className={cn("text-xs mt-1", 
            trend === 'up' ? "text-destructive" : 
            trend === 'down' ? "text-emerald-500" : "text-muted-foreground"
          )}>
            {trend === 'up' && "↑ "}
            {trend === 'down' && "↓ "}
            {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
