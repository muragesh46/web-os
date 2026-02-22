import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Plus, Search, Video, UserPlus, X, LogIn, MessageSquare } from 'lucide-react';
import withWindow from '@hoc/WindowWrapper.jsx';
import WindowControls from '@components/common/WindowControl.jsx';
import useAuthStore from '@store/auth';
import usewindowstore from '@store/window.js';
import useSocketStore from '@store/socket';
import chatService from '@services/chat.service.js';
import LockScreen from '@components/common/LockScreen.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

function Chat() {
    const { user } = useAuthStore();
    const { window: windowState, openwindow } = usewindowstore();
    const { chatSocket: socket, onlineUsers } = useSocketStore();
    const isOpen = windowState?.chat?.isOpen;

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [unread, setUnread] = useState({});
    const [typing, setTyping] = useState(null);
    const [loading, setLoading] = useState(false);

    // Search state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // Listen for socket events
    useEffect(() => {
        if (!isOpen || !socket) return;

        const handleNewMessage = (msg) => {
            setMessages((prev) => {
                if (
                    msg.sender._id === selectedUser?._id ||
                    msg.receiver._id === selectedUser?._id
                ) {
                    return [...prev, msg];
                }
                return prev;
            });
            if (msg.sender._id !== selectedUser?._id) {
                setUnread((prev) => ({
                    ...prev,
                    [msg.sender._id]: (prev[msg.sender._id] || 0) + 1,
                }));
            }
        };
        const handleMessageSent = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };
        const handleTyping = (userId) => setTyping(userId);
        const handleStopTyping = () => setTyping(null);

        socket.on('new-message', handleNewMessage);
        socket.on('message-sent', handleMessageSent);
        socket.on('user-typing', handleTyping);
        socket.on('user-stop-typing', handleStopTyping);

        // Fetch contacts
        chatService.getUsers().then(setUsers).catch(console.error);
        chatService.getUnreadCounts().then(setUnread).catch(console.error);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('message-sent', handleMessageSent);
            socket.off('user-typing', handleTyping);
            socket.off('user-stop-typing', handleStopTyping);
        };
    }, [isOpen, socket, selectedUser?._id]);

    // Load messages when user is selected
    const selectUser = async (u) => {
        setSelectedUser(u);
        setLoading(true);
        setMessages([]);
        setTyping(null);
        try {
            const msgs = await chatService.getMessages(u._id);
            setMessages(msgs);
            setUnread((prev) => {
                const next = { ...prev };
                delete next[u._id];
                return next;
            });
        } catch (err) {
            console.error('Failed to load messages:', err);
        }
        setLoading(false);
    };

    const sendMessage = () => {
        if (!input.trim() || !selectedUser || !socket) return;
        socket.emit('send-message', {
            receiverId: selectedUser._id,
            text: input.trim(),
        });
        socket.emit('stop-typing', selectedUser._id);
        setInput('');
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (!selectedUser || !socket) return;

        socket.emit('typing', selectedUser._id);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket?.emit('stop-typing', selectedUser._id);
        }, 1500);
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await chatService.searchUsers(query);
            setSearchResults(results || []);
        } catch (err) {
            console.error('Search failed:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const addContact = async (u) => {
        try {
            const addedUser = await chatService.addContact(u._id);
            setUsers((prev) => {
                // Avoid duplicates in state
                if (prev.some(user => user._id === addedUser._id)) return prev;
                return [...prev, addedUser];
            });
            setIsSearchOpen(false);
            setSearchQuery('');
            setSearchResults([]);
            selectUser(addedUser);
        } catch (err) {
            console.error('Failed to add contact:', err);
        }
    };

    const startVideoCall = () => {
        if (!selectedUser || !socket) return;
        const meetingId = `chat-${Date.now()}-${user._id.slice(-4)}`;

        // Open Video Call window with meetingId
        openwindow('videocall', { meetingId, autoJoin: true });

        // Signaling through chat socket
        console.log(`📞 SIGNALING: initiate call to ${selectedUser.displayName}`);
        socket.emit('call-user', {
            receiverId: selectedUser._id,
            meetingId
        });

        // Optional chat message
        socket.emit('send-message', {
            receiverId: selectedUser._id,
            text: `📞 I'm starting a video call. Join at meeting ID: ${meetingId}`,
        });
    };

    const isOnline = (userId) => onlineUsers.includes(userId);

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getUserName = (u) => {
        if (!u) return 'Unknown';
        return u.displayName || u.fullName || u.email || 'Anonymous';
    };

    if (!user) {
        return (
            <div className="flex flex-col h-[550px] w-[750px] bg-white rounded-lg overflow-hidden border border-gray-200 relative">
                <div id="window-header" className="flex items-center px-3 py-2 border-b border-gray-200 bg-gray-50 z-[1000000]">
                    <WindowControls target="chat" />
                    <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700">Messages</h2>
                </div>
                <div className="flex-1 relative">
                    <LockScreen />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[550px] w-[750px] bg-white rounded-lg overflow-hidden border border-gray-200 font-sans shadow-xl">
            {/* Header */}
            <div id="window-header" className="flex items-center px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0 relative">
                <WindowControls target="chat" />
                <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700">Messages</h2>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* ── Contacts Sidebar ── */}
                <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50/50 shrink-0">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contacts</p>
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 gap-2">
                                <MessageSquare size={24} className="opacity-50" />
                                <p className="text-xs">No contacts yet</p>
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="text-[10px] text-blue-500 font-semibold hover:underline"
                                >
                                    Add someone
                                </button>
                            </div>
                        ) : (
                            users.map((u) => (
                                <button
                                    key={u._id}
                                    onClick={() => selectUser(u)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${selectedUser?._id === u._id
                                        ? 'bg-blue-50 border-r-4 border-blue-500'
                                        : 'hover:bg-gray-100 border-r-4 border-transparent'
                                        }`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                            {(u.displayName || u.fullName || u.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline(u._id) ? 'bg-green-400' : 'bg-gray-300'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-700 truncate">{u.displayName || u.fullName || u.email}</p>
                                        <p className={`text-[10px] ${isOnline(u._id) ? 'text-green-500' : 'text-gray-400'}`}>
                                            {isOnline(u._id) ? 'Active now' : 'offline'}
                                        </p>
                                    </div>
                                    {unread[u._id] > 0 && (
                                        <span className="bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                            {unread[u._id]}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Message Area ── */}
                <div className="flex-1 flex flex-col bg-white">
                    {!selectedUser ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 p-10 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center">
                                <MessageSquare size={32} className="opacity-20" />
                            </div>
                            <div>
                                <h3 className="text-gray-800 font-semibold">Your Messages</h3>
                                <p className="text-sm mt-1">Select a contact to start talking</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                            {(selectedUser.displayName || selectedUser.fullName || selectedUser.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline(selectedUser._id) ? 'bg-green-400' : 'bg-gray-300'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{selectedUser.displayName || selectedUser.fullName || selectedUser.email}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">
                                            {typing === selectedUser._id ? (
                                                <span className="text-blue-500 animate-pulse">is typing...</span>
                                            ) : isOnline(selectedUser._id) ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 mr-4 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold border border-green-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        HD Enabled
                                    </div>
                                    <button
                                        onClick={startVideoCall}
                                        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all group shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 px-4 py-1.5"
                                        title="Start Video Call"
                                    >
                                        <Video size={16} fill="currentColor" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Call</span>
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                                {loading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center mt-20 opacity-30">
                                        <p className="text-sm">No messages yet. Send a greeting!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isMine = (msg.sender._id || msg.sender) === user._id;
                                        return (
                                            <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className="flex flex-col gap-1 max-w-[75%]">
                                                    {!isMine && (
                                                        <span className="text-[10px] font-bold text-gray-400 px-2 uppercase tracking-tight">
                                                            {getUserName(msg.sender)}
                                                        </span>
                                                    )}
                                                    <div className={`group relative px-4 py-2.5 rounded-2xl text-[13px] shadow-sm leading-relaxed ${isMine
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                                        }`}>
                                                        <p className="break-words">{msg.text}</p>
                                                        <p className={`text-[9px] mt-1 opacity-70 flex items-center gap-1 ${isMine ? 'justify-end' : ''}`}>
                                                            {formatTime(msg.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Bar */}
                            <div className="px-6 py-4 bg-white border-t border-gray-100 shrink-0">
                                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all shadow-inner">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder={`Message ${selectedUser.displayName || selectedUser.fullName || selectedUser.email}...`}
                                        className="flex-1 py-1.5 bg-transparent text-sm outline-none text-gray-700"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!input.trim()}
                                        className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white transition-all shadow-sm active:scale-95"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Search Contacts Overlay ── */}
                {isSearchOpen && (
                    <div className="absolute inset-0 z-[100] bg-black/5 flex items-start justify-center pt-10 backdrop-blur-[2px]">
                        <div className="w-[80%] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                                <Search className="text-gray-400" size={18} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search people by name or email..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="flex-1 outline-none text-sm text-gray-700"
                                />
                                <button onClick={() => { setIsSearchOpen(false); setSearchResults([]); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 max-h-[300px] overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-8 flex justify-center"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                                ) : searchResults.length === 0 ? (
                                    searchQuery.length >= 2 ? (
                                        <p className="p-8 text-center text-xs text-gray-400 italic">No users found matching "{searchQuery}"</p>
                                    ) : (
                                        <p className="p-8 text-center text-xs text-gray-400 italic">Start typing to find people...</p>
                                    )
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {searchResults.map((u) => (
                                            <button
                                                key={u._id}
                                                onClick={() => addContact(u)}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                                                        {(u.displayName || u.fullName || u.email || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">{u.displayName || u.fullName || u.email}</p>
                                                        <p className="text-[10px] text-gray-400">{u.email}</p>
                                                    </div>
                                                </div>
                                                <UserPlus size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const ChatWindow = withWindow(Chat, 'chat');
export default ChatWindow;
