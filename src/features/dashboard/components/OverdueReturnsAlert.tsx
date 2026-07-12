import { AlertCircle } from 'lucide-react';
import { useOverdueReturns } from '../hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';

export function OverdueReturnsAlert() {
  const { data: overdue, isLoading } = useOverdueReturns();

  if (isLoading) {
    return <Skeleton className="h-12 w-full rounded-md" />;
  }

  if (!overdue || overdue.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-destructive/15 border border-destructive/30 rounded-lg text-destructive">
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
        </div>
        <AlertCircle className="h-5 w-5" />
        <span className="font-semibold">{overdue.length} Overdue Return{overdue.length > 1 ? 's' : ''} Requires Attention</span>
      </div>
      <a href="#" className="text-sm font-medium underline underline-offset-4 hover:text-destructive/80">
        View Details
      </a>
    </div>
  );
}
