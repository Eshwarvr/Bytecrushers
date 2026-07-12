import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export function ExportButton({ type }: { type: 'csv' | 'pdf' }) {
  const handleExport = () => {
    if (type === 'pdf') {
      toast('PDF Export Coming Soon', {
        description: 'This feature will be available in the next release.'
      });
      return;
    }
    
    // Stub CSV export logic
    const csvContent = "data:text/csv;charset=utf-8,Name,Status,Department\nAsset1,Allocated,IT\nAsset2,Available,Operations";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV Exported Successfully');
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Export {type.toUpperCase()}
    </Button>
  );
}
