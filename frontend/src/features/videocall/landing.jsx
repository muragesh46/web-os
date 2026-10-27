import React, { useState, useEffect } from 'react';
import { Video, Plus, ArrowRight, Phone, Users, Sparkles, Copy, Check, ShieldCheck } from 'lucide-react';
import chatService from '@services/chat.service.js';
import useSocketStore from '@store/socket';

export default function LandingPage({ onJoin, user }) {
    const { chatSocket, onlineUsers } = useSocketStore();
    const [meetingCode, setMeetingCode] = useState('');
    const [contacts, setContacts] = useState([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [callingId, setCallingId] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setIsLoadingContacts(true);
        chatService.getUsers()
            .then(data => {
                if (isMounted) setContacts(data || []);
            })
            .catch(err => {
                console.warn('Could not fetch contacts for video call landing:', err);
            })
            .finally(() => {
                if (isMounted) setIsLoadingContacts(false);
            });
        return () => { isMounted = false; };
    }, []);

    const handleCreateInstantMeeting = () => {
        const id = `meet-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
        onJoin(id);
    };

    const handleJoinCode = (e) => {
        e?.preventDefault();
        const code = meetingCode.trim();
        if (!code) return;
        // Clean URL if pasted e.g. https://.../meet-xxx
        const cleaned = code.split('/').pop().replace(/[^a-zA-Z0-9-_]/g, '');
        if (cleaned) {
            onJoin(cleaned);
        }
    };

    const handleDirectCall = (contact) => {
        setCallingId(contact._id);
        const meetingId = `call-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

        // Ring user via socket
        if (chatSocket) {
            chatSocket.emit('call-user', {
                receiverId: contact._id,
                meetingId,
            });
            chatSocket.emit('send-message', {
                receiverId: contact._id,
                text: `📞 I'm calling you on Video Call. Join meeting: ${meetingId}`,
            });
        }

        onJoin(meetingId);
    };

    const isContactOnline = (id) => {
        return onlineUsers.includes(id?.toString());
    };

    return (
        <div className="flex flex-col h-full w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-white overflow-y-auto">
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto w-full px-6 py-8 flex flex-col items-center">
                {/* Badge */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-700/40 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6 shadow-sm">
                    <Sparkles size={13} className="animate-pulse" />
                    <span>HD Mesh Video & Encrypted Audio</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-center tracking-tight text-gray-900 dark:text-white">
                    Premium Video Calling
                </h1>
                <p className="mt-2.5 text-sm md:text-base text-gray-500 dark:text-gray-400 text-center max-w-md leading-relaxed">
                    Start an instant meeting, enter a code, or call your contacts with one click.
                </p>

                {/* Primary Actions: New Meeting & Join by Code */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
                    {/* Start Instant Meeting */}
                    <button
                        onClick={handleCreateInstantMeeting}
                        className="group flex flex-col items-start justify-between p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform">
                            <Video size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-snug flex items-center gap-2">
                                New Meeting
                                <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </h3>
                            <p className="text-xs text-blue-100 mt-1">Generate a secure room and start instantly</p>
                        </div>
                    </button>

                    {/* Join with Code */}
                    <form
                        onSubmit={handleJoinCode}
                        className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Join with a code</span>
                            <div className="mt-3 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={meetingCode}
                                    onChange={(e) => setMeetingCode(e.target.value)}
                                    placeholder="e.g. meet-abc-123"
                                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={!meetingCode.trim()}
                            className="mt-4 w-full py-2.5 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-xs tracking-wide hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Join Room
                        </button>
                    </form>
                </div>

                {/* Quick Call Contacts Section */}
                <div className="mt-10 w-full max-w-xl">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-gray-400" />
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Direct Call Contacts
                            </h3>
                        </div>
                        <span className="text-[11px] text-gray-400">
                            {contacts.filter(c => isContactOnline(c._id)).length} online
                        </span>
                    </div>

                    <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-750">
                        {isLoadingContacts ? (
                            <div className="p-6 text-center text-xs text-gray-400 animate-pulse">
                                Loading contacts…
                            </div>
                        ) : contacts.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-400">
                                No contacts yet. Search and add contacts in the Messages app to call them here!
                            </div>
                        ) : (
                            contacts.slice(0, 5).map(c => {
                                const online = isContactOnline(c._id);
                                return (
                                    <div
                                        key={c._id}
                                        className="p-3.5 px-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                                                    {(c.displayName || c.fullName || c.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                    {c.displayName || c.fullName || 'User'}
                                                </h4>
                                                <p className="text-[11px] text-gray-400">
                                                    {online ? 'Online now' : 'Offline'}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDirectCall(c)}
                                            disabled={callingId === c._id}
                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                        >
                                            <Phone size={13} />
                                            <span>{callingId === c._id ? 'Calling…' : 'Call'}</span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Features Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-800 flex items-center justify-center gap-6 text-[11px] text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-green-500" />
                        <span>Peer-to-Peer Encrypted</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Multi-user Grid</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Low Latency</span>
                    </div>
                </div>
            </div>
        </div>
    );
}