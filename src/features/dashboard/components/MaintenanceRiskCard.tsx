import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateMaintenanceRiskScore, getMaintenanceRiskExplanation } from '@/lib/ai';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import type { Asset, MaintenanceRequest } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MaintenanceRiskCardProps {
  asset: Asset;
  maintenanceHistory: MaintenanceRequest[];
}

export function MaintenanceRiskCard({ asset, maintenanceHistory }: MaintenanceRiskCardProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const score = calculateMaintenanceRiskScore(asset, maintenanceHistory);
  
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    getMaintenanceRiskExplanation(asset, score)
      .then(result => {
        if (mounted) {
          setExplanation(result);
          setIsLoading(false);
        }
      });
      
    return () => { mounted = false; };
  }, [asset, score]);

  const colorClass = score < 30 ? "text-emerald-500" : score < 70 ? "text-amber-500" : "text-destructive";

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-b from-background to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center justify-center min-w-24">
            <span className={cn("text-4xl font-bold tracking-tighter", colorClass)}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Risk Score</span>
          </div>
          <div className="flex-1 border-l border-border pl-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">{explanation}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
