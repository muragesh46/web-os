import axios from "axios";

// Using dynamic base URL for production and local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const API_URL = `${API_BASE_URL}/photos/`;

// Helper to get auth header
const authHeader = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

// Get photos
const getPhotos = async () => {
    const config = { headers: authHeader() };
    const response = await axios.get(API_URL, config);
    return response.data;
};

// Upload Photo
const uploadPhoto = async (photoData) => {
    const response = await axios.post(API_URL, photoData, { headers: authHeader() });
    return response.data;
};

// Delete Photo
const deletePhoto = async (id) => {
    const response = await axios.delete(API_URL + id, { headers: authHeader() });
    return response.data;
};

// Update Photo
const updatePhoto = async (id, updateData) => {
    const response = await axios.put(API_URL + id, updateData, { headers: authHeader() });
    return response.data;
};

const photosService = {
    getPhotos,
    uploadPhoto,
    deletePhoto,
    updatePhoto,
};

export default photosService;
