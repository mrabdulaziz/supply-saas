import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: () => number;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  unreadCount: () => get().notifications.filter(n => !n.isRead).length,

  addNotification: (n) => {
    set(s => ({ notifications: [n, ...s.notifications].slice(0, 50) }));
    // Browser notification if permitted
    if (typeof window !== 'undefined' && Notification?.permission === 'granted') {
      new Notification(n.title, { body: n.body, icon: '/favicon.ico' });
    }
  },

  markRead: (id) =>
    set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) })),

  markAllRead: () =>
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })) })),

  clear: () => set({ notifications: [] }),
}));
