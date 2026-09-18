import { create } from 'zustand';
import {
  getMyNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  type NotificationItem,
  clearAllNotificationsApi,
  deleteManyNotificationsApi,
  deleteNotificationApi,
} from '../api/notification.api';
import { getSocket } from '../api/socket';
import { useToastStore } from './useToastStore';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  deleteOne: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  deleteMany: (ids: string[]) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addSocketNotification: (notification: NotificationItem) => void;
  initSocketListeners: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await getMyNotificationsApi();
      const { notifications, unreadCount } = response.data;
      set({ notifications, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await markNotificationReadApi(id);
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        );
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        return { notifications, unreadCount };
      });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await markAllNotificationsReadApi();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  },
  deleteOne: async (id: string) => {
    try {
      await deleteNotificationApi(id);
      set((state) => {
        const notifications = state.notifications.filter((n) => n._id !== id);
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        return { notifications, unreadCount };
      });
    } catch (err) {
      console.error('Failed to delete notification', err);
      throw err;
    }
  },

  clearAll: async () => {
    try {
      await clearAllNotificationsApi();
      set({ notifications: [], unreadCount: 0 });
    } catch (err) {
      console.error('Failed to clear notifications', err);
      throw err;
    }
  },

  deleteMany: async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await deleteManyNotificationsApi(ids);
      set((state) => {
        const idSet = new Set(ids);
        const notifications = state.notifications.filter((n) => !idSet.has(n._id));
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        return { notifications, unreadCount };
      });
    } catch (err) {
      console.error('Failed to delete notifications', err);
      throw err;
    }
  },
  addSocketNotification: (newNotification: NotificationItem) => {
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Trigger instant Toast Alert on screen
    useToastStore.getState().showToast(
      `${newNotification.title}: ${newNotification.message}`,
      'info'
    );
  },

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('notification:new');
    socket.on('notification:new', (notification: NotificationItem) => {
      get().addSocketNotification(notification);
    });
  },
}));