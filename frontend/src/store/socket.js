import { create } from 'zustand';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

const useSocketStore = create((set, get) => ({
    chatSocket: null,
    videoSocket: null,
    incomingCall: null,
    onlineUsers: [],

    initSocket: (token) => {
        if (!token || get().chatSocket) return;

        console.log("🔌 Initializing background sockets...");

        // Chat namespace for signaling and presence
        const chatSocket = io(`${API_BASE_URL}/chat`, {
            auth: { token },
        });

        // Root namespace for video signaling (mesh)
        const videoSocket = io(`${API_BASE_URL}`, {
            auth: { token },
        });

        chatSocket.on('incoming-call', (data) => {
            console.log("📞 Incoming call received:", data);
            set({ incomingCall: data });
        });

        chatSocket.on('online-users', (ids) => {
            set({ onlineUsers: ids });
        });

        set({ chatSocket, videoSocket });
    },

    disconnectSockets: () => {
        const { chatSocket, videoSocket } = get();
        if (chatSocket) chatSocket.disconnect();
        if (videoSocket) videoSocket.disconnect();
        set({ chatSocket: null, videoSocket: null, incomingCall: null, onlineUsers: [] });
    },

    acceptCall: () => {
        set({ incomingCall: null });
    },

    rejectCall: () => {
        set({ incomingCall: null });
    }
}));

export default useSocketStore;
