import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';
import { useNotificationStore } from '../stores/notification.store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function useSocket() {
  const { isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Connect
    socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    // Listen for all order events
    const orderEvents = [
      'ORDER_SUBMITTED', 'ORDER_CONFIRMED', 'ORDER_REJECTED',
      'ORDER_IN_TRANSIT', 'ORDER_DELIVERED',
    ];

    orderEvents.forEach(event => {
      socket!.on(event, (data: { orderId: string; title: string; body: string }) => {
        addNotification({
          id: `${event}-${data.orderId}-${Date.now()}`,
          title: data.title,
          body: data.body,
          type: event,
          entityId: data.orderId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [isAuthenticated]);

  return socket;
}
