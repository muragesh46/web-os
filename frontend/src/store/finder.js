import { create } from 'zustand';
import finderService from '../services/finder.service';

const useFinderStore = create((set, get) => ({
    files: [],
    currentFolder: null, // null means root
    history: [],
    historyIndex: -1,
    isLoading: false,
    isError: false,
    message: '',
    errorMessage: '',
    viewMode: 'grid',
    sortBy: 'name',
    searchQuery: '',

    // ─── Fetch files ────────────────────────────────────────────────────────
    fetchFiles: async (parentId = null, isTrash = false, search = '') => {
        set({ isLoading: true, isError: false, message: '' });
        try {
            const data = await finderService.getFiles(parentId, isTrash, search);
            set({ files: data, isLoading: false, errorMessage: '' });
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message || error.toString();
            set({ isError: true, message: msg, errorMessage: msg, isLoading: false });
        }
    },

    // ─── Navigate to a folder ────────────────────────────────────────────────
    navigateTo: (folderId) => {
        const { currentFolder, history, historyIndex } = get();
        // Truncate forward history when navigating to a new folder
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(currentFolder);

        set({
            currentFolder: folderId,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            searchQuery: '',
        });

        if (folderId === 'trash') {
            get().fetchFiles(null, true);
        } else {
            get().fetchFiles(folderId, false);
        }
    },

    // ─── Go Back ─────────────────────────────────────────────────────────────
    goBack: () => {
        const { history, historyIndex, currentFolder } = get();
        if (historyIndex >= 0) {
            const previousFolder = history[historyIndex];
            // Push current into the "forward" slot by preserving history as-is
            set({
                currentFolder: previousFolder,
                historyIndex: historyIndex - 1,
            });
            if (previousFolder === 'trash') {
                get().fetchFiles(null, true);
            } else {
                get().fetchFiles(previousFolder, false);
            }
        }
    },

    // ─── Go Forward ──────────────────────────────────────────────────────────
    goForward: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            const nextFolder = history[nextIndex];
            set({
                currentFolder: nextFolder,
                historyIndex: nextIndex,
            });
            if (nextFolder === 'trash') {
                get().fetchFiles(null, true);
            } else {
                get().fetchFiles(nextFolder, false);
            }
        }
    },

    // ─── Set folder directly (sidebar click) ─────────────────────────────────
    setFolderDirectly: (folderId) => {
        set({ currentFolder: folderId, searchQuery: '' });
        if (folderId === 'trash') {
            get().fetchFiles(null, true);
        } else {
            get().fetchFiles(folderId, false);
        }
    },

    // ─── Create file / folder ────────────────────────────────────────────────
    createItem: async (fileData) => {
        try {
            const newItem = await finderService.createFile(fileData);
            set((state) => ({ files: [...state.files, newItem], errorMessage: '' }));
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message;
            set({ isError: true, message: msg, errorMessage: msg });
            alert(`Error: ${msg}`);
        }
    },

    // ─── Rename ───────────────────────────────────────────────────────────────
    renameItem: async (id, newName) => {
        try {
            const updated = await finderService.updateFile(id, { name: newName });
            set((state) => ({
                files: state.files.map(f => f._id === id ? updated : f),
                errorMessage: '',
            }));
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message;
            set({ isError: true, message: msg, errorMessage: msg });
            alert(`Error: ${msg}`);
        }
    },

    // ─── Update File Content ─────────────────────────────────────────────────
    updateFileContent: async (id, content) => {
        try {
            const updated = await finderService.updateFile(id, { content });
            set((state) => ({
                files: state.files.map(f => f._id === id ? updated : f),
                errorMessage: '',
            }));
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message;
            set({ isError: true, message: msg, errorMessage: msg });
            alert(`Error: ${msg}`);
        }
    },

    // ─── Move (drag & drop) ───────────────────────────────────────────────────
    moveItem: async (id, newParentId) => {
        try {
            await finderService.updateFile(id, { parentId: newParentId });
            set((state) => ({ files: state.files.filter(f => f._id !== id) }));
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message;
            console.error('moveItem error:', msg);
            alert(`Error: ${msg}`);
        }
    },

    // ─── Move to Trash ────────────────────────────────────────────────────────
    moveItemToTrash: async (id) => {
        try {
            await finderService.updateFile(id, { isTrash: true });
            set((state) => ({ files: state.files.filter(f => f._id !== id) }));
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message;
            console.error('moveItemToTrash error:', msg);
            alert(`Error: ${msg}`);
        }
    },

    // ─── Restore from Trash ────────────────────────────────────────────────────
    restoreItem: async (id) => {
        try {
            await finderService.updateFile(id, { isTrash: false });
            set((state) => ({ files: state.files.filter(f => f._id !== id) }));
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message;
            console.error('restoreItem error:', msg);
            alert(`Error: ${msg}`);
        }
    },

    // ─── Permanently Delete ───────────────────────────────────────────────────
    permanentlyDelete: async (id) => {
        try {
            await finderService.deleteFile(id);
            set((state) => ({ files: state.files.filter(f => f._id !== id) }));
        } catch (error) {
            const msg = (error.response?.data?.message) || error.message;
            console.error('permanentlyDelete error:', msg);
            alert(`Error: ${msg}`);
        }
    },

    // ─── UI helpers ───────────────────────────────────────────────────────────
    setViewMode: (mode) => set({ viewMode: mode }),
    setSortBy: (sort) => set({ sortBy: sort }),
    setSearchQuery: (query) => {
        set({ searchQuery: query });
        const { currentFolder } = get();
        if (query) {
            // Search non-trash items globally (no parentId filter when searching)
            get().fetchFiles(null, false, query);
        } else {
            if (currentFolder === 'trash') {
                get().fetchFiles(null, true);
            } else {
                get().fetchFiles(currentFolder, false);
            }
        }
    },
}));

export default useFinderStore;
