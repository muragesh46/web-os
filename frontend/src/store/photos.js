import { create } from 'zustand';
import photosService from '../services/photos.service';

const usePhotosStore = create((set, get) => ({
    photos: [],
    isLoading: false,
    isError: false,
    message: '',

    // Fetch photos
    fetchPhotos: async () => {
        set({ isLoading: true, isError: false, message: '' });
        try {
            const data = await photosService.getPhotos();
            set({ photos: data, isLoading: false });
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message || error.toString();
            set({ isError: true, message: msg, isLoading: false });
        }
    },

    // Upload photo
    uploadPhoto: async (photoData) => {
        try {
            const newPhoto = await photosService.uploadPhoto(photoData);
            set((state) => ({ photos: [newPhoto, ...state.photos] }));
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message;
            alert(`Error: ${msg}`);
        }
    },

    // Delete photo
    deletePhoto: async (id) => {
        try {
            await photosService.deletePhoto(id);
            set((state) => ({ photos: state.photos.filter(p => p._id !== id) }));
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message;
            alert(`Error: ${msg}`);
        }
    },

    // Update photo (isFavorite, album)
    updatePhoto: async (id, updateData) => {
        try {
            const updated = await photosService.updatePhoto(id, updateData);
            set((state) => ({
                photos: state.photos.map(p => p._id === id ? updated : p)
            }));
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message;
            alert(`Error: ${msg}`);
        }
    }
}));

export default usePhotosStore;
