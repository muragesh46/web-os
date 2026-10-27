import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Video, UserPlus, X, MessageSquare, Check, CheckCheck } from 'lucide-react';
import withWindow from '@hoc/WindowWrapper.jsx';
import WindowControls from '@components/common/WindowControl.jsx';
import useAuthStore from '@store/auth';
import usewindowstore from '@store/window.js';
import useSocketStore from '@store/socket';
import chatService from '@services/chat.service.js';
import LockScreen from '@components/common/LockScreen.jsx';

function Chat() {
    const { user } = useAuthStore();
    const { window: windowState, openwindow } = usewindowstore();
    const { chatSocket: socket, onlineUsers } = useSocketStore();
    const isOpen = windowState?.chat?.isOpen;

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const selectedUserRef = useRef(null);
    selectedUserRef.current = selectedUser;

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

    useEffect(() => {
        scrollToBottom();
    }, [messages, typing, scrollToBottom]);

    // Initial load of contacts & unread counts
    const refreshContacts = useCallback(() => {
        chatService.getUsers().then(setUsers).catch(console.error);
        chatService.getUnreadCounts().then(setUnread).catch(console.error);
    }, []);

    useEffect(() => {
        if (!user) return;
        refreshContacts();
    }, [user, refreshContacts]);

    // Stable socket listener lifecycle
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg) => {
            const currentSelected = selectedUserRef.current;
            const senderId = msg.sender?._id || msg.sender;
            const receiverId = msg.receiver?._id || msg.receiver;
            const currentId = currentSelected?._id;

            const isCurrentConversation =
                senderId?.toString() === currentId?.toString() ||
                receiverId?.toString() === currentId?.toString();

            if (isCurrentConversation) {
                setMessages((prev) => {
                    // Filter out optimistic message if it matches text
                    const filtered = prev.filter(m => !m._isPending || m.text !== msg.text);
                    if (filtered.some(m => m._id && m._id === msg._id)) return filtered;
                    return [...filtered, msg];
                });

                // Clear unread if we are actively viewing this user
                if (senderId?.toString() === currentId?.toString()) {
                    chatService.getMessages(currentId).catch(() => {});
                }
            } else {
                // Increment unread count for the sender
                setUnread((prev) => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1,
                }));
            }

            // Refresh contact list ordering
            chatService.getUsers().then(setUsers).catch(console.error);
        };

        const handleMessageSent = (msg) => {
            const currentSelected = selectedUserRef.current;
            const receiverId = msg.receiver?._id || msg.receiver;

            if (receiverId?.toString() === currentSelected?._id?.toString()) {
                setMessages((prev) => {
                    // Replace temporary optimistic message with confirmed server message
                    const filtered = prev.filter(m => !m._isPending || m.text !== msg.text);
                    if (filtered.some(m => m._id && m._id === msg._id)) return filtered;
                    return [...filtered, msg];
                });
            }
        };

        const handleTyping = (userId) => {
            if (userId?.toString() === selectedUserRef.current?._id?.toString()) {
                setTyping(userId);
            }
        };

        const handleStopTyping = () => {
            setTyping(null);
        };

        const handleMessageError = (err) => {
            console.error('Socket message error:', err);
        };

        socket.on('new-message', handleNewMessage);
        socket.on('message-sent', handleMessageSent);
        socket.on('user-typing', handleTyping);
        socket.on('user-stop-typing', handleStopTyping);
        socket.on('message-error', handleMessageError);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('message-sent', handleMessageSent);
            socket.off('user-typing', handleTyping);
            socket.off('user-stop-typing', handleStopTyping);
            socket.off('message-error', handleMessageError);
        };
    }, [socket]);

    // Load messages when user is selected
    const selectUser = async (u) => {
        if (!u) return;
        setSelectedUser(u);
        setLoading(true);
        setMessages([]);
        setTyping(null);
        try {
            const msgs = await chatService.getMessages(u._id);
            setMessages(msgs || []);
            setUnread((prev) => {
                const next = { ...prev };
                delete next[u._id];
                return next;
            });
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = () => {
        const text = input.trim();
        if (!text || !selectedUser || !socket) return;

        // Optimistic UI update: instantly show message
        const optimisticMsg = {
            _id: `temp-${Date.now()}`,
            text,
            sender: user,
            receiver: selectedUser,
            createdAt: new Date().toISOString(),
            _isPending: true,
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        setInput('');

        socket.emit('send-message', {
            receiverId: selectedUser._id,
            text,
        });

        socket.emit('stop-typing', selectedUser._id);
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

    // Open search overlay and load initial suggestions
    const openSearch = async () => {
        setIsSearchOpen(true);
        setSearchQuery('');
        setIsSearching(true);
        try {
            const results = await chatService.searchUsers('');
            setSearchResults(results || []);
        } catch (err) {
            console.error('Initial user search error:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

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
                if (prev.some(usr => usr._id === addedUser._id)) return prev;
                return [addedUser, ...prev];
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
        const meetingId = `chat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

        // Open Video Call window with meetingId
        openwindow('videocall', { meetingId, autoJoin: true });

        // Signaling through chat socket
        console.log(`📞 SIGNALING: initiate call to ${selectedUser.displayName}`);
        socket.emit('call-user', {
            receiverId: selectedUser._id,
            meetingId
        });

        // Add informative chat notification
        const inviteText = `📞 I started a Video Call. Join meeting: ${meetingId}`;
        const optimisticMsg = {
            _id: `temp-${Date.now()}`,
            text: inviteText,
            sender: user,
            receiver: selectedUser,
            createdAt: new Date().toISOString(),
            _isPending: true,
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        socket.emit('send-message', {
            receiverId: selectedUser._id,
            text: inviteText,
        });
    };

    const isOnline = (userId) => {
        if (!userId) return false;
        return onlineUsers.includes(userId.toString());
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getUserName = (u) => {
        if (!u) return 'Unknown';
        return u.displayName || u.fullName || u.email || 'Anonymous';
    };

    if (!user) {
        return (
            <div className="flex flex-col h-[550px] w-[750px] bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                <div id="window-header" className="flex items-center px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 z-[1000000]">
                    <div id="window-controls">
                        <WindowControls target="chat" />
                    </div>
                    <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 dark:text-gray-200">Messages</h2>
                </div>
                <div className="flex-1 relative">
                    <LockScreen />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[550px] w-[750px] bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 font-sans shadow-2xl">
            {/* Header */}
            <div id="window-header" className="flex items-center px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0 relative">
                <div id="window-controls">
                    <WindowControls target="chat" />
                </div>
                <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 dark:text-gray-200">Messages</h2>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* ── Contacts Sidebar ── */}
                <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50/70 dark:bg-gray-900/60 shrink-0">
                    <div className="p-3.5 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conversations</p>
                        <button
                            onClick={openSearch}
                            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                            title="New Conversation"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 gap-2.5">
                                <MessageSquare size={26} className="opacity-40" />
                                <p className="text-xs font-medium">No contacts yet</p>
                                <button
                                    onClick={openSearch}
                                    className="text-xs text-blue-600 font-semibold hover:underline"
                                >
                                    + Start a conversation
                                </button>
                            </div>
                        ) : (
                            users.map((u) => {
                                const online = isOnline(u._id);
                                const isSelected = selectedUser?._id === u._id;
                                const unreadCount = unread[u._id] || 0;

                                return (
                                    <button
                                        key={u._id}
                                        onClick={() => selectUser(u)}
                                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all ${
                                            isSelected
                                                ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 border-r-4 border-transparent'
                                        }`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                {(u.displayName || u.fullName || u.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                {u.displayName || u.fullName || u.email}
                                            </p>
                                            <p className={`text-[10px] ${online ? 'text-green-500' : 'text-gray-400'}`}>
                                                {online ? 'Active now' : 'Offline'}
                                            </p>
                                        </div>

                                        {unreadCount > 0 && (
                                            <span className="bg-blue-600 text-white text-[10px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center font-bold shadow-sm">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Message Area ── */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                    {!selectedUser ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 p-8 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-400">
                                <MessageSquare size={32} className="opacity-40" />
                            </div>
                            <div>
                                <h3 className="text-gray-800 dark:text-gray-200 font-semibold text-sm">Your Messages</h3>
                                <p className="text-xs text-gray-400 mt-1">Select a contact or start a new chat</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-150 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                            {(selectedUser.displayName || selectedUser.fullName || selectedUser.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${isOnline(selectedUser._id) ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-100">
                                            {selectedUser.displayName || selectedUser.fullName || selectedUser.email}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {typing === selectedUser._id ? (
                                                <span className="text-blue-500 font-semibold animate-pulse">typing...</span>
                                            ) : isOnline(selectedUser._id) ? 'Active now' : 'Offline'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={startVideoCall}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow active:scale-95 transition-all"
                                        title="Start Video Call with this contact"
                                    >
                                        <Video size={14} />
                                        <span>Video Call</span>
                                    </button>
                                </div>
                            </div>

                            {/* Message Bubble Feed */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                                {loading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                                        <p className="text-xs">No messages yet. Send a greeting!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const senderId = msg.sender?._id || msg.sender;
                                        const isMine = senderId === user._id;

                                        return (
                                            <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className="flex flex-col gap-0.5 max-w-[75%]">
                                                    {!isMine && (
                                                        <span className="text-[10px] font-semibold text-gray-400 px-1">
                                                            {getUserName(msg.sender)}
                                                        </span>
                                                    )}
                                                    <div className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                                                        isMine
                                                            ? 'bg-blue-600 text-white rounded-br-none'
                                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none'
                                                    } ${msg._isPending ? 'opacity-70' : ''}`}>
                                                        <p className="break-words select-text">{msg.text}</p>
                                                        <div className={`flex items-center gap-1 text-[9px] mt-1 ${isMine ? 'justify-end text-blue-100' : 'text-gray-400'}`}>
                                                            <span>{formatTime(msg.createdAt)}</span>
                                                            {isMine && (
                                                                msg._isPending ? (
                                                                    <span className="opacity-70">…</span>
                                                                ) : (
                                                                    <Check size={11} className="opacity-90" />
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Bar */}
                            <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-150 dark:border-gray-800 shrink-0">
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-1.5 border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 transition-all">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder={`Message ${selectedUser.displayName || selectedUser.fullName}...`}
                                        className="flex-1 bg-transparent text-xs outline-none text-gray-800 dark:text-gray-100"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!input.trim()}
                                        className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all shadow-sm active:scale-95"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Search Contacts Modal ── */}
                {isSearchOpen && (
                    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-8">
                        <div className="w-[85%] max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col animate-in zoom-in duration-200">
                            <div className="p-3.5 border-b border-gray-150 dark:border-gray-700 flex items-center gap-2.5">
                                <Search className="text-gray-400" size={16} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="flex-1 outline-none text-xs text-gray-800 dark:text-gray-100 bg-transparent"
                                />
                                <button
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchResults([]);
                                        setSearchQuery('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-750">
                                {isSearching ? (
                                    <div className="p-6 flex justify-center">
                                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <p className="p-6 text-center text-xs text-gray-400">
                                        No new users found
                                    </p>
                                ) : (
                                    <div className="p-2 space-y-1">
                                        <p className="px-2 pt-1 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            {searchQuery ? 'Search Results' : 'Suggestions'}
                                        </p>
                                        {searchResults.map((u) => (
                                            <button
                                                key={u._id}
                                                onClick={() => addContact(u)}
                                                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left group"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-bold">
                                                        {(u.displayName || u.fullName || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                                                            {u.displayName || u.fullName}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">{u.email}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 group-hover:underline">
                                                    <UserPlus size={14} /> Add
                                                </span>
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
