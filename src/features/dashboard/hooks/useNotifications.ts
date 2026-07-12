import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markNotificationRead } from '@/lib/api';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.filter(n => !n.isRead).length || 0;
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
