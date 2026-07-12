import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markNotificationRead } from '@/lib/api';
import type { Notification } from '@/lib/types';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });
}

export function useUnreadCount() {
  const { data: notifications } = useNotifications();
  return notifications?.filter((n: Notification) => !n.isRead).length || 0;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (_, variables) => {
      queryClient.setQueryData(['notifications'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((n: any) => 
          n.id === variables ? { ...n, isRead: true } : n
        );
      });
    },
  });
}
