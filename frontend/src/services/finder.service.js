import axios from "axios";

// Using dynamic base URL for production and local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const API_URL = `${API_BASE_URL}/finder/`;

// Helper to get auth header
const authHeader = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

// Get files/folders (can filter by parentId and isTrash)
const getFiles = async (parentId = null, isTrash = false, search = '') => {
    const config = { headers: authHeader(), params: { isTrash } };
    if (search) {
        config.params.search = search;
    } else {
        config.params.parentId = parentId || 'root';
    }

    const response = await axios.get(API_URL, config);
    return response.data;
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
