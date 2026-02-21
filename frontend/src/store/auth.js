import { create } from 'zustand';
import authService from '../services/auth.service';

const user = JSON.parse(localStorage.getItem('user'));

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
