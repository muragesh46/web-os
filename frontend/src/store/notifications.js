import { create } from 'zustand';

let idCounter = 0;

const useNotificationStore = create((set, get) => ({
    notifications: [],
    bannerQueue: [], // currently shown banners

    addNotification: (title, message, type = 'info', icon = null) => {
        const id = ++idCounter;
        const notification = {
            id,
            title,
            message,
            type, // 'info' | 'success' | 'warning' | 'error'
            icon,
            timestamp: new Date(),
            read: false,
        };

        set((state) => ({
            notifications: [notification, ...state.notifications],
            bannerQueue: [notification, ...state.bannerQueue],
        }));

        // Auto-remove from banner queue after 4 seconds
        setTimeout(() => {
            set((state) => ({
                bannerQueue: state.bannerQueue.filter((n) => n.id !== id),
            }));
        }, 4000);
    },

    markRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
        })),

    markAllRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

    clearAll: () => set({ notifications: [], bannerQueue: [] }),

    dismissBanner: (id) =>
        set((state) => ({
            bannerQueue: state.bannerQueue.filter((n) => n.id !== id),
        })),

    get unreadCount() {
        return get().notifications.filter((n) => !n.read).length;
    },
}));

export default useNotificationStore;
