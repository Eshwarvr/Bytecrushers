import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarPlus, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="flex gap-4 flex-wrap mt-8">
      <Button onClick={() => navigate('/assets/register')} className="gap-2">
        <PlusCircle className="h-4 w-4" />
        Register Asset
      </Button>
      <Button variant="secondary" onClick={() => navigate('/bookings/new')} className="gap-2">
        <CalendarPlus className="h-4 w-4" />
        Book Resource
      </Button>
      <Button variant="outline" onClick={() => navigate('/maintenance/raise')} className="gap-2">
        <Wrench className="h-4 w-4" />
        Raise Request
      </Button>
    </div>
  );
}
