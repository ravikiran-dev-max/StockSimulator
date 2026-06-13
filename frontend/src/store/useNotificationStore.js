import { create } from 'zustand';

const loadNotifications = () => {
  try {
    const saved = localStorage.getItem('notifications');
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
  return [
    {
      id: 'welcome',
      title: 'Welcome to StockSimulator!',
      message: 'Start trading virtual equities with your $10,000 balance.',
      read: false,
      createdAt: new Date().toISOString()
    }
  ];
};

const saveNotifications = (notifications) => {
  try {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
};

const useNotificationStore = create((set, get) => ({
  notifications: loadNotifications(),
  toasts: [],

  addNotification: (title, message, type = 'info') => {
    const newNotification = {
      id: Date.now().toString(),
      title,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    const updatedNotifications = [newNotification, ...get().notifications];
    saveNotifications(updatedNotifications);

    // Add a temporary screen toast
    const toastId = Date.now().toString() + Math.random().toString();
    const newToast = { id: toastId, title, message, type };

    set({
      notifications: updatedNotifications,
      toasts: [...get().toasts, newToast]
    });

    // Auto remove toast after 4 seconds
    setTimeout(() => {
      get().removeToast(toastId);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  markAllAsRead: () => {
    const updatedNotifications = get().notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updatedNotifications);
    set({ notifications: updatedNotifications });
  },

  clearNotifications: () => {
    saveNotifications([]);
    set({ notifications: [] });
  }
}));

export default useNotificationStore;
