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

const ACCENT_COLORS = [
    { id: 'blue',   value: '#3b82f6', label: 'Blue' },
    { id: 'purple', value: '#8b5cf6', label: 'Purple' },
    { id: 'pink',   value: '#ec4899', label: 'Pink' },
    { id: 'red',    value: '#ef4444', label: 'Red' },
    { id: 'orange', value: '#f97316', label: 'Orange' },
    { id: 'green',  value: '#22c55e', label: 'Green' },
    { id: 'teal',   value: '#14b8a6', label: 'Teal' },
    { id: 'slate',  value: '#64748b', label: 'Graphite' },
];

const applyThemeClass = (theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

const useSettingsStore = create(
    persist(
        (set, get) => ({
            wallpaper: '/images/wallpaper1.jpg',
            theme: 'dark',
            notificationsEnabled: true,
            soundEffectsEnabled: true,
            doNotDisturb: false,
            displayName: '',
            displayBrightness: 85,
            soundVolume: 60,
            wifiEnabled: true,
            bluetoothEnabled: true,
            reduceMotion: false,
            accentColor: '#3b82f6',
            autoTheme: false,
            wallpapers,

            setWallpaper: (wallpaper) => set({ wallpaper }),
            setTheme: (theme) => {
                applyThemeClass(theme);
                set({ theme, autoTheme: false });
            },
            toggleTheme: () => {
                const newTheme = get().theme === 'dark' ? 'light' : 'dark';
                applyThemeClass(newTheme);
                set({ theme: newTheme, autoTheme: false });
            },
            setAutoTheme: (auto) => {
                if (auto) {
                    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
                    const newTheme = prefersDark ? 'dark' : 'light';
                    applyThemeClass(newTheme);
                    set({ autoTheme: true, theme: newTheme });
                } else {
                    set({ autoTheme: false });
                }
            },
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
            setSoundEffectsEnabled: (enabled) => set({ soundEffectsEnabled: enabled }),
            setDoNotDisturb: (enabled) => set({ doNotDisturb: enabled }),
            toggleDoNotDisturb: () => set((s) => ({ doNotDisturb: !s.doNotDisturb })),
            setDisplayName: (displayName) => set({ displayName }),
            setDisplayBrightness: (displayBrightness) =>
                set({ displayBrightness: Math.min(100, Math.max(0, displayBrightness)) }),
            setSoundVolume: (soundVolume) =>
                set({ soundVolume: Math.min(100, Math.max(0, soundVolume)) }),
            setWifiEnabled: (wifiEnabled) => set({ wifiEnabled }),
            setBluetoothEnabled: (bluetoothEnabled) => set({ bluetoothEnabled }),
            setReduceMotion: (reduceMotion) => set({ reduceMotion }),
            setAccentColor: (accentColor) => set({ accentColor }),

            clearAllData: () => {
                localStorage.removeItem('webos-settings');
                set({
                    wallpaper: '/images/wallpaper1.jpg',
                    theme: 'dark',
                    notificationsEnabled: true,
                    soundEffectsEnabled: true,
                    doNotDisturb: false,
                    displayName: '',
                    displayBrightness: 85,
                    soundVolume: 60,
                    wifiEnabled: true,
                    bluetoothEnabled: true,
                    reduceMotion: false,
                    accentColor: '#3b82f6',
                    autoTheme: false,
                });
                applyThemeClass('dark');
            },

            /** True when banner/toast notifications should show */
            canShowNotifications: () => {
                const s = get();
                return s.notificationsEnabled && !s.doNotDisturb;
            },
        }),
        {
            name: 'webos-settings',
            onRehydrateStorage: () => (state) => {
                if (state?.theme) applyThemeClass(state.theme);
            },
        }
    )
);

export default useSettingsStore;
export { wallpapers, ACCENT_COLORS };
