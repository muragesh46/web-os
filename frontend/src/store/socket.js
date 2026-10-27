import { create } from 'zustand';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.PROD ? '' : 'http://localhost:3001');

let currentToken = null;

const useSocketStore = create((set, get) => ({
    chatSocket: null,
    videoSocket: null,
    incomingCall: null,
    onlineUsers: [],

    initSocket: (token) => {
        if (!token) return;

        const currentChat = get().chatSocket;
        if (currentChat && currentToken === token) {
            if (!currentChat.connected) {
                currentChat.connect();
            }
            const currentVideo = get().videoSocket;
            if (currentVideo && !currentVideo.connected) {
                currentVideo.connect();
            }
            return;
        }

        currentToken = token;

        // Disconnect existing before reinitializing
        const oldChat = get().chatSocket;
        const oldVideo = get().videoSocket;
        if (oldChat) oldChat.disconnect();
        if (oldVideo) oldVideo.disconnect();

        console.log("🔌 Initializing WebOS background sockets...");

        // Chat namespace for signaling and presence
        const chatSocket = io(`${API_BASE_URL}/chat`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });

        // Root namespace for video signaling (mesh)
        const videoSocket = io(`${API_BASE_URL}`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });

        chatSocket.on('connect', () => {
            console.log("✅ Chat socket connected:", chatSocket.id);
        });

        chatSocket.on('connect_error', (err) => {
            console.warn("⚠️ Chat socket connection error:", err.message);
        });

        videoSocket.on('connect', () => {
            console.log("✅ Video socket connected:", videoSocket.id);
        });

        videoSocket.on('connect_error', (err) => {
            console.warn("⚠️ Video socket connection error:", err.message);
        });

        chatSocket.on('incoming-call', (data) => {
            console.log("📞 Incoming call received:", data);
            set({ incomingCall: data });
        });

        chatSocket.on('call-cancelled', () => {
            console.log("📞 Incoming call was cancelled by caller");
            set({ incomingCall: null });
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
        currentToken = null;
        set({ chatSocket: null, videoSocket: null, incomingCall: null, onlineUsers: [] });
    },

    acceptCall: () => {
        set({ incomingCall: null });
    },

    rejectCall: () => {
        const { incomingCall, chatSocket } = get();
        if (incomingCall && chatSocket) {
            chatSocket.emit('reject-call', {
                callerId: incomingCall.callerId,
                meetingId: incomingCall.meetingId
            });
        }
        set({ incomingCall: null });
    }
}));

export default useSocketStore;
