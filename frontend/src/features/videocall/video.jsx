import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, X, Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, UserPlus } from 'lucide-react';
import useSocketStore from '@store/socket';
import chatService from '@services/chat.service.js';

export default function VideoMeetComponent({ onLeave, meetingId, user }) {
    const { videoSocket: socket, chatSocket } = useSocketStore();

    const localVideoRef = useRef(null);
    const streamRef = useRef(null);
    const peersRef = useRef({}); // { socketId: RTCPeerConnection }
    const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }

    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [participantNames, setParticipantNames] = useState({});
    const [mediaReady, setMediaReady] = useState(false); // New state to track if media is ready
    const [showInvite, setShowInvite] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [invitingMsg, setInvitingMsg] = useState({});
    const timerRef = useRef(null);

    // Initialize local stream
    useEffect(() => {
        const startMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setMediaReady(true); // Signal that media is ready

                // Join room once media is ready
                if (socket && meetingId) {
                    socket.emit('join-call', { path: meetingId, userName: user?.displayName || 'Guest' });
                }
            } catch (err) {
                console.error('Media access failed:', err);
            }
        };

        startMedia();
        timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (timerRef.current) clearInterval(timerRef.current);
            // Clean up connections
            Object.values(peersRef.current).forEach(peer => peer.close());
            setMediaReady(false);
        };
    }, [socket, meetingId]);

    // Mesh WebRTC Logic
    useEffect(() => {
        if (!socket || !mediaReady || !streamRef.current) return;

        const createPeer = (targetSocketId) => {
            const peer = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            // Add local tracks
            streamRef.current.getTracks().forEach(track => {
                peer.addTrack(track, streamRef.current);
            });

            peer.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit('signal', targetSocketId, { candidate: e.candidate });
                }
            };

            peer.ontrack = (e) => {
                setRemoteStreams(prev => {
                    const existingStream = prev[targetSocketId];
                    if (existingStream) {
                        // If we already have the stream, just make sure this track is in it
                        if (!existingStream.getTracks().find(t => t.id === e.track.id)) {
                            existingStream.addTrack(e.track);
                        }
                        return { ...prev };
                    }
                    return {
                        ...prev,
                        [targetSocketId]: e.streams[0]
                    };
                });
            };

            return peer;
        };

        const handleUserJoined = async (newUserId, userName) => {
            if (newUserId === socket.id) return;

            setParticipantNames(prev => ({ ...prev, [newUserId]: userName }));

            // We are the existing participant, create an offer
            const peer = createPeer(newUserId);
            peersRef.current[newUserId] = peer;

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit('signal', newUserId, { sdp: offer });
        };

        const handleRoomUsers = (users) => {
            const names = {};
            users.forEach(u => names[u.id] = u.name);
            setParticipantNames(prev => ({ ...prev, ...names }));
        };

        const handleSignal = async (fromId, data) => {
            let peer = peersRef.current[fromId];

            if (!peer) {
                peer = createPeer(fromId);
                peersRef.current[fromId] = peer;
            }

            if (data.sdp) {
                await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
                if (data.sdp.type === 'offer') {
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);
                    socket.emit('signal', fromId, { sdp: answer });
                }
            } else if (data.candidate) {
                await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };

        const handleUserLeft = (socketId) => {
            if (peersRef.current[socketId]) {
                peersRef.current[socketId].close();
                delete peersRef.current[socketId];
            }
            setRemoteStreams(prev => {
                const next = { ...prev };
                delete next[socketId];
                return next;
            });
            setParticipantNames(prev => {
                const next = { ...prev };
                delete next[socketId];
                return next;
            });
        };

        const handleChatMessage = (text, sender, socketId) => {
            setMessages(prev => [...prev, { sender, text, socketId }]);
        };

        socket.on('user-joined', handleUserJoined);
        socket.on('room-users', handleRoomUsers);
        socket.on('signal', handleSignal);
        socket.on('user-left', handleUserLeft);
        socket.on('chat-message', handleChatMessage);

        return () => {
            socket.off('user-joined', handleUserJoined);
            socket.off('room-users', handleRoomUsers);
            socket.off('signal', handleSignal);
            socket.off('user-left', handleUserLeft);
            socket.off('chat-message', handleChatMessage);
        };
    }, [socket, mediaReady]);

    const toggleCamera = () => {
        if (streamRef.current) {
            const track = streamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setCameraOn(track.enabled);
            }
        }
    };

    const toggleMic = () => {
        if (streamRef.current) {
            const track = streamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setMicOn(track.enabled);
            }
        }
    };

    const sendMessage = () => {
        if (!message.trim() || !socket) return;
        const senderName = user?.displayName || user?.fullName || user?.email || 'Anonymous';
        socket.emit('chat-message', message, senderName);
        setMessage('');
    };

    const openInvite = async () => {
        setShowInvite(true);
        try {
            const data = await chatService.getUsers();
            setContacts(data);
        } catch (err) {
            console.error('Failed to get contacts', err);
        }
    };

    const inviteParticipant = (contact) => {
        if (!chatSocket) return;

        chatSocket.emit('call-user', {
            receiverId: contact._id,
            meetingId
        });

        chatSocket.emit('send-message', {
            receiverId: contact._id,
            text: `📞 I've invited you to an ongoing multi-user video call. Join at meeting ID: ${meetingId}`,
        });

        setInvitingMsg(prev => ({ ...prev, [contact._id]: 'Invited!' }));
        setTimeout(() => {
            setInvitingMsg(prev => ({ ...prev, [contact._id]: '' }));
        }, 3000);
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const participantsCount = Object.keys(remoteStreams).length + 1;

    return (
        <div className="flex h-full w-full bg-[#0B0C10] relative overflow-hidden font-sans">
            {/* Main Video Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden transition-all duration-500 pb-28">
                {/* Video Grid for Remote Participants */}
                <div className={`flex-1 p-6 grid gap-6 place-items-center w-full h-full max-w-7xl mx-auto
                    ${Object.keys(remoteStreams).length === 0 ? 'grid-cols-1 max-w-4xl' :
                        Object.keys(remoteStreams).length === 1 ? 'grid-cols-1 lg:max-w-4xl' :
                            Object.keys(remoteStreams).length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                                Object.keys(remoteStreams).length <= 4 ? 'grid-cols-1 sm:grid-cols-2' :
                                    Object.keys(remoteStreams).length <= 6 ? 'grid-cols-2 md:grid-cols-3' :
                                        'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}
                `}>
                    {/* Empty Room Placeholder */}
                    {Object.keys(remoteStreams).length === 0 && (
                        <div className="flex flex-col items-center justify-center text-gray-500 gap-4 animate-pulse">
                            <div className="w-32 h-32 rounded-full bg-gray-900 flex items-center justify-center border border-white/5">
                                <Video size={48} className="opacity-20" />
                            </div>
                            <p className="text-sm font-medium tracking-widest uppercase">Waiting for others to join...</p>
                        </div>
                    )}

                    {/* Remote Videos */}
                    {Object.entries(remoteStreams).map(([id, stream]) => (
                        <RemoteVideo key={id} name={participantNames[id] || 'Participant'} stream={stream} />
                    ))}
                </div>

                {/* Local Video Overlay (Small Screen) */}
                <div className="absolute top-6 right-6 w-48 aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-2xl border border-white/20 z-20 group transition-all hover:scale-105 hover:border-blue-500/50">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-white text-[10px] font-medium">You</span>
                    </div>
                    {!cameraOn && (
                        <div className="absolute inset-0 bg-[#12131C] flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[#1A1C29] flex items-center justify-center shadow-inner border border-white/5">
                                <span className="text-lg font-bold text-gray-500">
                                    {(user?.displayName || user?.fullName || user?.email || 'Y').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}
                    {!micOn && (
                        <div className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full shadow-lg">
                            <MicOff size={12} className="text-white" />
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="absolute top-6 left-6 flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-lg border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-white text-xs font-mono font-bold tracking-wider">{formatTime(elapsed)}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-lg border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-tighter">
                        Room: {meetingId}
                    </div>
                </div>

                {/* Control Bar - Floating */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-30">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl p-3.5 rounded-full border border-white/20 shadow-2xl ring-1 ring-black/5 hover:bg-white-[0.15] transition-all duration-300">
                        <ControlBtn
                            active={micOn}
                            onClick={toggleMic}
                            icon={micOn ? Mic : MicOff}
                            danger={!micOn}
                        />
                        <ControlBtn
                            active={cameraOn}
                            onClick={toggleCamera}
                            icon={cameraOn ? Video : VideoOff}
                            danger={!cameraOn}
                        />
                        <ControlBtn
                            active={showInvite}
                            onClick={openInvite}
                            icon={UserPlus}
                        />
                        <button
                            onClick={() => onLeave?.()}
                            className="w-14 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30 mx-2"
                        >
                            <PhoneOff size={24} />
                        </button>
                        <ControlBtn
                            active={showChat}
                            onClick={() => setShowChat(!showChat)}
                            icon={MessageSquare}
                        />
                    </div>
                </div>
            </div>

            {/* In-Call Chat Sidebar */}
            {showChat && (
                <div className="w-80 bg-white border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">Room Chat</h3>
                        <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-2">
                                <MessageSquare size={40} />
                                <p className="text-xs font-medium">No messages yet</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.socketId === socket.id ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">{msg.sender}</span>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] shadow-sm ${msg.socketId === socket.id
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 text-gray-700 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-gray-50/50">
                        <div className="flex bg-white rounded-xl border border-gray-200 p-1.5 focus-within:border-blue-400 transition-colors shadow-sm">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Type something..."
                                className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                            />
                            <button
                                onClick={sendMessage}
                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal Overlay */}
            {showInvite && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-[90%] max-w-sm bg-[#12131C] border border-white/10 rounded-3xl shadow-2xl flex flex-col p-6 animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold text-lg">Invite Participants</h3>
                            <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {contacts.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No contacts found or loading...</p>
                            ) : (
                                contacts.map(c => (
                                    <div key={c._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs ring-1 ring-blue-500/50">
                                                {(c.displayName || c.fullName || c.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-semibold">{c.displayName || c.fullName || c.email}</p>
                                                <p className={`text-[10px] ${c.isOnline ? 'text-green-400' : 'text-gray-500'}`}>{c.isOnline ? 'Online' : 'Offline'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => inviteParticipant(c)}
                                            disabled={invitingMsg[c._id]}
                                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 min-w-16"
                                        >
                                            {invitingMsg[c._id] || 'Invite'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RemoteVideo({ stream, name }) {
    const videoRef = useRef();
    const [hasVideo, setHasVideo] = useState(true);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }

        // Simple heuristic: if video track is disabled or missing
        const checkVideo = () => {
            if (stream) {
                const videoTracks = stream.getVideoTracks();
                setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled);
            }
        };

        checkVideo();
        const interval = setInterval(checkVideo, 1000);
        return () => clearInterval(interval);
    }, [stream]);

    return (
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-[#12131C] shadow-2xl border border-white/5 group shadow-black/40 min-h-[250px] transition-all hover:border-white/10">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${hasVideo ? 'opacity-100' : 'opacity-0'}`}
            />

            {!hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-[#1A1C29] flex items-center justify-center shadow-inner border border-white/5">
                        <span className="text-3xl font-bold text-gray-500">
                            {name?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 opacity-80 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium truncate max-w-[150px] drop-shadow-md">
                    {name}
                </span>
            </div>
        </div>
    );
}

function ControlBtn({ active, onClick, icon: Icon, danger }) {
    return (
        <button
            onClick={onClick}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 ${danger
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20'
                : active
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-transparent hover:border-white/10 shadow-sm'
                    : 'bg-black/40 text-white/50 hover:bg-black/60 border border-transparent shadow-inner backdrop-blur-sm'
                }`}
        >
            <Icon size={20} className={!active && !danger ? 'opacity-70' : ''} />
        </button>
    );
}