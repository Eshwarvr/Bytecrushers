import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

class MockSocket {
  private listeners: Record<string, Function[]> = {};
  
  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  
  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  
  disconnect() {
    this.listeners = {};
  }
}

// Fallback to mock socket for Phase 4 standalone demo
let socket: Socket | MockSocket;
try {
  socket = new MockSocket(); // io(SOCKET_URL);
} catch {
  socket = new MockSocket();
}

export function useSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    };

    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('asset:updated', handleUpdate);
    socket.on('booking:created', handleUpdate);
    socket.on('maintenance:statusChanged', handleUpdate);
    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('asset:updated', handleUpdate);
      socket.off('booking:created', handleUpdate);
      socket.off('maintenance:statusChanged', handleUpdate);
      socket.off('notification:new', handleNotification);
    };
  }, [queryClient]);

  return socket;
}
