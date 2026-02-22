import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return {};
    try {
        const user = JSON.parse(userStr);
        return { Authorization: `Bearer ${user.token}` };
    } catch (err) {
        return {};
    }
};

const chatService = {
    getUsers: async () => {
        const response = await axios.get(`${API_URL}/chat/users`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    searchUsers: async (query) => {
        const response = await axios.get(`${API_URL}/chat/search?query=${query}`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    addContact: async (userId) => {
        const response = await axios.post(`${API_URL}/chat/add-contact`, { userId }, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    getMessages: async (userId) => {
        const response = await axios.get(`${API_URL}/chat/messages/${userId}`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    getUnreadCounts: async () => {
        const response = await axios.get(`${API_URL}/chat/unread`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },
};

export default chatService;
