import { useNotifications, useMarkNotificationRead } from '../hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Info, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/lib/types';

export function NotificationPanel({ onClose }: { onClose?: () => void }) {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'Asset Assigned': return <Package className="h-4 w-4 text-blue-500" />;
      case 'Overdue Return Alert': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'Maintenance Approved': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleMarkAllRead = () => {
    notifications?.filter((n: Notification) => !n.isRead).forEach((n: Notification) => markAsRead.mutate(n.id));
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="font-semibold text-sm">Notifications</h3>
        <Button variant="ghost" size="sm" className="h-auto text-xs px-2 py-1" onClick={handleMarkAllRead}>
          Mark all as read
        </Button>
      </div>
      
      <ScrollArea className="h-[350px]">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : notifications?.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
            <Bell className="h-8 w-8 mb-2 opacity-20" />
            No new notifications
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications?.map((notification: Notification) => (
              <div 
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer",
                  !notification.isRead ? "bg-muted/20" : "opacity-70"
                )}
                onClick={() => {
                  if (!notification.isRead) markAsRead.mutate(notification.id);
                  // navigate to relevant entity
                }}
              >
                <div className="mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={cn("text-sm font-medium leading-none", !notification.isRead && "font-semibold")}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="p-2 border-t border-border/50">
        <Button 
          variant="ghost" 
          className="w-full text-sm justify-center"
          onClick={() => {
            navigate('/notifications');
            onClose?.();
          }}
        >
          View all notifications
        </Button>
      </div>
    </div>
  );
}
