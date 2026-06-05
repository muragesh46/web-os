import { create } from 'zustand';
import authService from '../services/auth.service';

const base64Decode = (str) => {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    if (typeof atob === 'function') {
        try {
            return atob(base64);
        } catch (e) {
            // fallback
        }
    }
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(base64, 'base64').toString('utf-8');
    }
    return '';
};

const getInitialUser = () => {
    try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return null;
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.token) {
            const token = parsed.token;
            const parts = token.split('.');
            if (parts.length === 3) {
                const payloadStr = base64Decode(parts[1]);
                if (payloadStr) {
                    const payload = JSON.parse(payloadStr);
                    if (payload && typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
                        localStorage.removeItem('user');
                        return null;
                    }
                }
            }
            return parsed;
        }
    } catch (e) {
        console.error("Error reading initial user token:", e);
    }
    return null;
};

const user = getInitialUser();

const useAuthStore = create((set) => ({
    user: user ? user : null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',

    register: async (user) => {
        set({ isLoading: true });
        try {
            const data = await authService.register(user);
            set({ user: data, isSuccess: true, isLoading: false, isError: false, message: '' });
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            set({ isError: true, message, isLoading: false, user: null });
        }
    },

    login: async (user) => {
        set({ isLoading: true });
        try {
            const data = await authService.login(user);
            set({ user: data, isSuccess: true, isLoading: false, isError: false, message: '' });
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            set({ isError: true, message, isLoading: false, user: null });
        }
    },

    logout: () => {
        authService.logout();
        set({ user: null });
    },

    reset: () => set({ isError: false, isSuccess: false, isLoading: false, message: '' })
}));

export default useAuthStore;
