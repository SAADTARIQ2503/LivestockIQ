import { create } from 'zustand';

/**
 * Notification/Toast store
 * Manages app-wide notifications and toasts
 */
export const useNotificationStore = create((set) => ({
  // State
  notifications: [],
  
  // Actions
  addNotification: (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: notification.type || 'info', // success, error, warning, info
      title: notification.title,
      message: notification.message,
      duration: notification.duration || 5000,
      timestamp: new Date(),
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  // Helper methods
  success: (message, title = 'Success') => {
    return set((state) => {
      const id = state.addNotification({ type: 'success', title, message });
      return state;
    });
  },

  error: (message, title = 'Error') => {
    return set((state) => {
      const id = state.addNotification({ type: 'error', title, message, duration: 7000 });
      return state;
    });
  },

  warning: (message, title = 'Warning') => {
    return set((state) => {
      const id = state.addNotification({ type: 'warning', title, message });
      return state;
    });
  },

  info: (message, title = 'Info') => {
    return set((state) => {
      const id = state.addNotification({ type: 'info', title, message });
      return state;
    });
  },
}));
