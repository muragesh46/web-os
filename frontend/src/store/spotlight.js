import { create } from 'zustand';

const useSpotlightStore = create((set) => ({
    isOpen: false,
    query: '',

    openSpotlight: () => set({ isOpen: true, query: '' }),
    closeSpotlight: () => set({ isOpen: false, query: '' }),
    toggleSpotlight: () => set((state) => ({ isOpen: !state.isOpen, query: '' })),
    setQuery: (query) => set({ query }),
}));

export default useSpotlightStore;
