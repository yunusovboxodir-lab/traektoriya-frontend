import { create } from 'zustand';
import { notificationsApi, type AppNotification } from '../api/notifications';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  // Actions
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetch: async () => {
    try {
      set({ loading: true });
      const res = await notificationsApi.list(30);
      set({
        notifications: res.data.items,
        unreadCount: res.data.unread_count,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  markRead: async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // ignore
    }
  },

  markAllRead: async () => {
    try {
      await notificationsApi.readAll();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch {
      // ignore
    }
  },

  remove: async (id: string) => {
    const prev = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: prev && !prev.is_read
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));
    try {
      await notificationsApi.remove(id);
    } catch {
      // restore on error
      if (prev) {
        set((state) => ({
          notifications: [prev, ...state.notifications],
          unreadCount: !prev.is_read ? state.unreadCount + 1 : state.unreadCount,
        }));
      }
    }
  },
}));
