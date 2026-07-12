import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ReportReadyPanel() {
  const navigate = useNavigate();
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Reports Ready
        </CardTitle>
        <CardDescription>Generated summaries for the current period</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
          <h4 className="font-medium text-sm">Monthly Asset Summary</h4>
          <p className="text-xs text-muted-foreground mt-1">Generated today at 08:00 AM</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
          <h4 className="font-medium text-sm">Maintenance Cost Analysis</h4>
          <p className="text-xs text-muted-foreground mt-1">Generated yesterday at 05:30 PM</p>
        </div>
        <div className="mt-auto pt-4">
          <Button variant="ghost" className="w-full justify-between" onClick={() => navigate('/reports')}>
            View All Reports
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
