import axios from "axios";

// Using dynamic base URL for production and local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : "http://localhost:3001/api");
const API_URL = `${API_BASE_URL}/finder/`;

import { locations } from "../constants/data.js";

// Helper to get auth header safely
const authHeader = () => {
    try {
        const raw = localStorage.getItem("user");
        if (!raw) return {};
        const user = JSON.parse(raw);
        if (user && user.token) {
            return { Authorization: `Bearer ${user.token}` };
        }
    } catch {
        // ignore
    }
    return {};
};

// Fallback offline generator for guest/unauthenticated preview
const getOfflineFiles = (parentId) => {
    if (!parentId || parentId === 'root') {
        return [
            { _id: 'work', name: "Work", type: "folder", fileType: "folder", icon: "/icons/work.svg", parentId: null },
            { _id: 'about', name: "About me", type: "folder", fileType: "folder", icon: "/icons/info.svg", parentId: null },
            { _id: 'resume', name: "Resume", type: "folder", fileType: "folder", icon: "/icons/file.svg", parentId: null },
            { _id: 'trash', name: "Trash", type: "folder", fileType: "folder", icon: "/icons/trash.svg", parentId: null }
        ];
    }
    if (parentId === 'work') {
        return (locations.work?.children || []).map(c => ({
            _id: `work-${c.id}`,
            name: c.name,
            type: c.kind || 'folder',
            fileType: c.fileType || 'folder',
            icon: c.icon || '/images/folder.png',
            parentId: 'work'
        }));
    }
    return [];
};

// Get files/folders (can filter by parentId, isTrash, search, and type)
const getFiles = async (parentId = null, isTrash = false, search = '', type = '') => {
    const config = { headers: authHeader(), params: { isTrash } };
    if (type) config.params.type = type;
    if (search) {
        config.params.search = search;
    } else if (parentId || !type) {
        config.params.parentId = parentId || 'root';
    }

    try {
        const response = await axios.get(API_URL, config);
        if (Array.isArray(response.data) && response.data.length > 0) {
            return response.data;
        }
        // If logged in user has no files yet, or if empty, fallback to offline template
        return response.data?.length ? response.data : getOfflineFiles(parentId);
    } catch (err) {
        console.warn("Backend unavailable, using offline Finder files:", err.message);
        return getOfflineFiles(parentId);
    }
};

// Create a file or folder
const createFile = async (fileData) => {
    const response = await axios.post(API_URL, fileData, { headers: authHeader() });
    return response.data;
};

// Update file (rename, move, trash)
const updateFile = async (id, updateData) => {
    const response = await axios.put(API_URL + id, updateData, { headers: authHeader() });
    return response.data;
};

// Delete permanently
const deleteFile = async (id) => {
    const response = await axios.delete(API_URL + id, { headers: authHeader() });
    return response.data;
};

const finderService = {
    getFiles,
    createFile,
    updateFile,
    deleteFile,
};

export default finderService;
