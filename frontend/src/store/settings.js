import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const wallpapers = [
    '/images/wallpaper1.jpg',
    '/images/wallpaper2.jpg',
    '/images/wallpaper3.jpg',
    '/images/wallpaper4.jpg',
    '/images/gal1.png',
    '/images/gal2.png',
    '/images/gal3.png',
    '/images/gal4.png',
];

const useSettingsStore = create(
    persist(
        (set) => ({
            wallpaper: '/images/wallpaper1.jpg',
            theme: 'dark', // 'light' | 'dark'
            notificationsEnabled: true,
            displayName: '',
            wallpapers,

            setWallpaper: (wallpaper) => set({ wallpaper }),
            setTheme: (theme) => {
                set({ theme });
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },
            toggleTheme: () =>
                set((state) => {
                    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
                    if (newTheme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                    return { theme: newTheme };
                }),
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
            setDisplayName: (displayName) => set({ displayName }),
        }),
        {
            name: 'webos-settings',
        }
    )
);

export default useSettingsStore;
export { wallpapers };
