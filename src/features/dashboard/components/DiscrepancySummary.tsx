import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getDiscrepancySummary } from '@/lib/ai';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, AlertTriangle } from 'lucide-react';
import type { AuditItem } from '@/lib/types';

export function DiscrepancySummary({ items }: { items: AuditItem[] }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    getDiscrepancySummary(items)
      .then(result => {
        if (mounted) {
          setSummary(result);
          setIsLoading(false);
        }
      });
      
    return () => { mounted = false; };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 mb-6">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="mt-1 bg-amber-500/20 p-2 rounded-full h-fit">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-amber-500 flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> AI Discrepancy Summary
            </h3>
            {isLoading ? (
              <div className="space-y-2 pt-1">
                <Skeleton className="h-4 w-full bg-amber-500/10" />
                <Skeleton className="h-4 w-5/6 bg-amber-500/10" />
              </div>
            ) : (
              <p className="text-sm text-amber-500/90 leading-relaxed">{summary}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
