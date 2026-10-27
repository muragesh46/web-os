import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, X, Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, UserPlus, Copy, Check } from 'lucide-react';
import useSocketStore from '@store/socket';
import chatService from '@services/chat.service.js';

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:global.stun.twilio.com:3478' },
];

export default function VideoMeetComponent({ onLeave, meetingId, user }) {
    const { videoSocket: socket, chatSocket } = useSocketStore();

    const localVideoRef = useRef(null);
    const streamRef = useRef(null);
    const peersRef = useRef({}); // { socketId: RTCPeerConnection }
    const candidateQueues = useRef({}); // { socketId: RTCIceCandidateInit[] }

    const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [participantNames, setParticipantNames] = useState({});
    const [mediaReady, setMediaReady] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [invitingMsg, setInvitingMsg] = useState({});
    const [copied, setCopied] = useState(false);
    const [statusBanner, setStatusBanner] = useState('');
    const timerRef = useRef(null);

    // Initialize local media with robust fallback
    useEffect(() => {
        let isMounted = true;

        const startMedia = async () => {
            let stream = null;

            try {
                // Try video and audio first
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true
                });
            } catch (err1) {
                console.warn('Could not get video+audio, trying audio only:', err1);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: true
                    });
                    setCameraOn(false);
                    setStatusBanner('Camera unavailable; joined with audio only.');
                } catch (err2) {
                    console.warn('Could not get audio either, creating dummy stream:', err2);
                    // Create dummy canvas stream for environments without mic/cam (e.g. testing)
                    const canvas = document.createElement('canvas');
                    canvas.width = 640;
                    canvas.height = 480;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, 640, 480);
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 28px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(user?.displayName || 'WebOS Participant', 320, 240);
                    
                    const canvasStream = canvas.captureStream ? canvas.captureStream(10) : new MediaStream();
                    stream = canvasStream;
                    setCameraOn(false);
                    setMicOn(false);
                    setStatusBanner('Microphone & Camera not detected; joined in view-only mode.');
                }
            }

            if (!isMounted) {
                if (stream) stream.getTracks().forEach(t => t.stop());
                return;
            }

            streamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setMediaReady(true);

            if (socket && meetingId) {
                const displayName = user?.displayName || user?.fullName || 'Participant';
                console.log(`📹 Joining room: ${meetingId} as ${displayName}`);
                socket.emit('join-call', { path: meetingId, userName: displayName });
            }
        };

        startMedia();
        timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

        return () => {
            isMounted = false;
            if (socket) {
                socket.emit('leave-call');
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            if (timerRef.current) clearInterval(timerRef.current);
            Object.values(peersRef.current).forEach(peer => peer.close());
            peersRef.current = {};
            candidateQueues.current = {};
            setRemoteStreams({});
            setMediaReady(false);
        };
    }, [socket, meetingId, user]);

    // Handle Socket Reconnection: re-join call if socket reconnects
    useEffect(() => {
        if (!socket || !meetingId) return;

        const handleReconnect = () => {
            console.log(`🔄 Socket reconnected, re-joining meeting: ${meetingId}`);
            const displayName = user?.displayName || user?.fullName || 'Participant';
            socket.emit('join-call', { path: meetingId, userName: displayName });
        };

        socket.on('connect', handleReconnect);
        return () => {
            socket.off('connect', handleReconnect);
        };
    }, [socket, meetingId, user]);

    // Mesh WebRTC Peer Management
    useEffect(() => {
        if (!socket || !mediaReady || !streamRef.current) return;

        const createPeer = (targetSocketId) => {
            // Close old peer if already exists
            if (peersRef.current[targetSocketId]) {
                peersRef.current[targetSocketId].close();
            }

            const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

            // Attach local media tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    peer.addTrack(track, streamRef.current);
                });
            }

            peer.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit('signal', targetSocketId, { candidate: e.candidate });
                }
            };

            peer.ontrack = (e) => {
                console.log(`🎞️ Received remote track from ${targetSocketId}:`, e.track.kind);
                setRemoteStreams(prev => {
                    const existingStream = prev[targetSocketId];
                    let stream;
                    if (existingStream) {
                        const tracks = existingStream.getTracks().filter(t => t.id !== e.track.id);
                        tracks.push(e.track);
                        stream = new MediaStream(tracks);
                    } else {
                        stream = e.streams && e.streams[0] ? e.streams[0] : new MediaStream([e.track]);
                    }
                    return {
                        ...prev,
                        [targetSocketId]: stream
                    };
                });
            };

            peer.onconnectionstatechange = () => {
                console.log(`🔗 Peer ${targetSocketId} connection state:`, peer.connectionState);
                if (peer.connectionState === 'failed' || peer.connectionState === 'closed') {
                    // Cleanup failed peer
                }
            };

            return peer;
        };

        const handleUserJoined = async (newUserId, userName) => {
            console.log(`👤 User joined room: ${newUserId} (${userName})`);
            if (newUserId === socket.id) return;

            setParticipantNames(prev => ({ ...prev, [newUserId]: userName }));

            // We are the existing room participant; initiate connection with an offer
            const peer = createPeer(newUserId);
            peersRef.current[newUserId] = peer;

            try {
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.emit('signal', newUserId, { sdp: offer });
            } catch (err) {
                console.error(`Failed to create offer for ${newUserId}:`, err);
            }
        };

        const handleRoomUsers = (users) => {
            const names = {};
            users.forEach(u => {
                if (u.id !== socket.id) {
                    names[u.id] = u.name;
                }
            });
            setParticipantNames(prev => ({ ...prev, ...names }));
        };

        const handleSignal = async (fromId, data) => {
            if (fromId === socket.id) return;

            let peer = peersRef.current[fromId];
            if (!peer) {
                peer = createPeer(fromId);
                peersRef.current[fromId] = peer;
            }

            try {
                if (data.sdp) {
                    const isOffer = data.sdp.type === 'offer';
                    const isCollision = isOffer && peer.signalingState !== 'stable';

                    if (isCollision) {
                        // Polite peer pattern: socket with smaller id rolls back
                        if (socket.id > fromId) {
                            return; // Impolite peer ignores colliding offer
                        }
                        await peer.setRemoteDescription({ type: 'rollback' }).catch(() => {});
                    }

                    await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));

                    // Flush any queued ICE candidates that arrived before remote description was set
                    const queue = candidateQueues.current[fromId] || [];
                    for (const cand of queue) {
                        try {
                            await peer.addIceCandidate(new RTCIceCandidate(cand));
                        } catch (e) {
                            console.warn('Failed to add queued candidate:', e);
                        }
                    }
                    candidateQueues.current[fromId] = [];

                    if (isOffer) {
                        const answer = await peer.createAnswer();
                        await peer.setLocalDescription(answer);
                        socket.emit('signal', fromId, { sdp: answer });
                    }
                } else if (data.candidate) {
                    if (peer.remoteDescription && peer.remoteDescription.type) {
                        try {
                            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
                        } catch (err) {
                            console.warn('Could not add ICE candidate:', err);
                        }
                    } else {
                        // Queue candidate for when remote description is set
                        if (!candidateQueues.current[fromId]) {
                            candidateQueues.current[fromId] = [];
                        }
                        candidateQueues.current[fromId].push(data.candidate);
                    }
                }
            } catch (err) {
                console.error(`Signal handling error from ${fromId}:`, err);
            }
        };

        const handleUserLeft = (socketId) => {
            console.log(`👋 User left room: ${socketId}`);
            if (peersRef.current[socketId]) {
                peersRef.current[socketId].close();
                delete peersRef.current[socketId];
            }
            delete candidateQueues.current[socketId];

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

        const handleChatMessage = (text, sender, senderSocketId) => {
            console.log('📨 INCOMING CALL CHAT:', text, sender);
            setMessages(prev => [...prev, { sender, text, socketId: senderSocketId }]);
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

    // Handle Call Rejection Notification from Chat Socket
    useEffect(() => {
        if (!chatSocket) return;

        const handleCallRejected = (data) => {
            setStatusBanner(`${data.responderName || 'Participant'} declined the call.`);
            setTimeout(() => setStatusBanner(''), 4000);
        };

        chatSocket.on('call-rejected', handleCallRejected);
        return () => {
            chatSocket.off('call-rejected', handleCallRejected);
        };
    }, [chatSocket]);

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
        const senderName = user?.displayName || user?.fullName || 'Participant';
        socket.emit('chat-message', message.trim(), senderName, meetingId);
        setMessage('');
    };

    const openInvite = async () => {
        setShowInvite(true);
        try {
            const data = await chatService.getUsers();
            setContacts(data || []);
        } catch (err) {
            console.error('Failed to get contacts for invite:', err);
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
            text: `📞 I've invited you to an ongoing video call. Join room: ${meetingId}`,
        });

        setInvitingMsg(prev => ({ ...prev, [contact._id]: 'Invited!' }));
        setTimeout(() => {
            setInvitingMsg(prev => ({ ...prev, [contact._id]: '' }));
        }, 3000);
    };

    const copyMeetingId = () => {
        navigator.clipboard.writeText(meetingId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const remoteCount = Object.keys(remoteStreams).length;

    return (
        <div className="flex h-full w-full bg-[#0B0C10] relative overflow-hidden font-sans">
            {/* Status Alert Banner */}
            {statusBanner && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>{statusBanner}</span>
                    <button onClick={() => setStatusBanner('')} className="ml-2 text-gray-400 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Main Video Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden transition-all duration-500 pb-24">
                {/* Video Grid for Remote Participants */}
                <div className={`flex-1 p-6 grid gap-6 place-items-center w-full h-full max-w-7xl mx-auto
                    ${remoteCount === 0 ? 'grid-cols-1 max-w-4xl' :
                        remoteCount === 1 ? 'grid-cols-1 lg:max-w-4xl' :
                            remoteCount === 2 ? 'grid-cols-1 md:grid-cols-2' :
                                remoteCount <= 4 ? 'grid-cols-1 sm:grid-cols-2' :
                                    remoteCount <= 6 ? 'grid-cols-2 md:grid-cols-3' :
                                        'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}
                `}>
                    {/* Empty Room Placeholder */}
                    {remoteCount === 0 && (
                        <div className="flex flex-col items-center justify-center text-gray-400 gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 max-w-md w-full">
                            <div className="w-24 h-24 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <Video size={40} />
                            </div>
                            <div className="text-center">
                                <h4 className="text-white font-bold text-base">Waiting for others to join</h4>
                                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                                    Share the meeting ID or invite contacts below to start talking.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    onClick={copyMeetingId}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
                                >
                                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    <span>{copied ? 'Copied ID' : 'Copy ID'}</span>
                                </button>
                                <button
                                    onClick={openInvite}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
                                >
                                    <UserPlus size={14} />
                                    <span>Invite Contacts</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Remote Videos */}
                    {Object.entries(remoteStreams).map(([id, stream]) => (
                        <RemoteVideo key={id} name={participantNames[id] || 'Participant'} stream={stream} />
                    ))}
                </div>

                {/* Local Video Overlay (Small Screen) */}
                <div className="absolute top-6 right-6 w-44 md:w-52 aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-2xl border border-white/20 z-20 group transition-all hover:scale-105 hover:border-blue-500/50">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-white text-[10px] font-medium">You</span>
                    </div>
                    {!cameraOn && (
                        <div className="absolute inset-0 bg-[#12131C] flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[#1A1C29] flex items-center justify-center shadow-inner border border-white/5">
                                <span className="text-lg font-bold text-gray-400">
                                    {(user?.displayName || user?.fullName || 'Y').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}
                    {!micOn && (
                        <div className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full shadow-lg">
                            <MicOff size={11} className="text-white" />
                        </div>
                    )}
                </div>

                {/* Top Status Bar */}
                <div className="absolute top-6 left-6 flex items-center gap-2.5 z-20">
                    <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-lg border border-white/10 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-white text-xs font-mono font-bold tracking-wider">{formatTime(elapsed)}</span>
                    </div>

                    <button
                        onClick={copyMeetingId}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/15 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
                        title="Click to copy room code"
                    >
                        <span className="font-mono">{meetingId}</span>
                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400 group-hover:text-white" />}
                    </button>
                </div>

                {/* Bottom Control Bar */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center z-30">
                    <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-2xl p-2.5 px-4 rounded-full border border-white/15 shadow-2xl ring-1 ring-black/40">
                        <ControlBtn
                            active={micOn}
                            onClick={toggleMic}
                            icon={micOn ? Mic : MicOff}
                            danger={!micOn}
                            label={micOn ? 'Mute' : 'Unmute'}
                        />
                        <ControlBtn
                            active={cameraOn}
                            onClick={toggleCamera}
                            icon={cameraOn ? Video : VideoOff}
                            danger={!cameraOn}
                            label={cameraOn ? 'Turn Off Cam' : 'Turn On Cam'}
                        />
                        <ControlBtn
                            active={showInvite}
                            onClick={openInvite}
                            icon={UserPlus}
                            label="Invite"
                        />
                        <button
                            onClick={() => onLeave?.()}
                            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/40 mx-1"
                            title="End / Leave Call"
                        >
                            <PhoneOff size={20} />
                        </button>
                        <ControlBtn
                            active={showChat}
                            onClick={() => setShowChat(!showChat)}
                            icon={MessageSquare}
                            label="Room Chat"
                        />
                    </div>
                </div>
            </div>

            {/* In-Call Chat Sidebar */}
            {showChat && (
                <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col animate-in slide-in-from-right duration-300 z-30">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">Meeting Chat</h3>
                        <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 gap-2 text-gray-400">
                                <MessageSquare size={32} />
                                <p className="text-xs font-medium">No messages yet</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.socketId === socket?.id ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] font-semibold text-gray-400 mb-1">{msg.sender}</span>
                                    <div className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] shadow-sm ${msg.socketId === socket?.id
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 bg-gray-50/50 dark:bg-gray-950/50 border-t border-gray-150 dark:border-gray-800">
                        <div className="flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 focus-within:border-blue-400 transition-colors shadow-sm">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 px-2.5 py-1.5 text-xs outline-none bg-transparent text-gray-800 dark:text-gray-100"
                            />
                            <button
                                onClick={sendMessage}
                                className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Send size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal Overlay */}
            {showInvite && (
                <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col p-5 animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold text-base">Invite Participants</h3>
                            <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Meeting Code Banner */}
                        <div className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-semibold">Meeting Code</p>
                                <p className="text-sm font-mono font-bold text-blue-400">{meetingId}</p>
                            </div>
                            <button
                                onClick={copyMeetingId}
                                className="px-3 py-1 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-semibold flex items-center gap-1 transition-all"
                            >
                                {copied ? <Check size={13} /> : <Copy size={13} />}
                                <span>{copied ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>

                        <div className="flex-1 max-h-60 overflow-y-auto space-y-2 pr-1">
                            {contacts.length === 0 ? (
                                <p className="text-gray-500 text-xs text-center py-6">No contacts found</p>
                            ) : (
                                contacts.map(c => (
                                    <div key={c._id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                                                {(c.displayName || c.fullName || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white text-xs font-semibold">{c.displayName || c.fullName}</p>
                                                <p className="text-[10px] text-gray-400">{c.isOnline ? '🟢 Online' : 'Offline'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => inviteParticipant(c)}
                                            disabled={invitingMsg[c._id]}
                                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
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
            videoRef.current.play().catch(err => {
                console.log("Autoplay was prevented by browser policy:", err);
            });
        }

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
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-[#12131C] shadow-2xl border border-white/10 group min-h-[240px] flex items-center justify-center">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${hasVideo ? 'opacity-100' : 'opacity-0'}`}
            />

            {!hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                        <span className="text-2xl font-bold text-gray-300">
                            {name?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-white text-xs font-medium truncate max-w-[140px]">
                    {name}
                </span>
            </div>
        </div>
    );
}

function ControlBtn({ active, onClick, icon: Icon, danger, label }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${danger
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30'
                : active
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10 shadow-sm'
                    : 'bg-black/40 text-gray-400 hover:text-white hover:bg-black/60 border border-white/5'
                }`}
        >
            <Icon size={19} />
        </button>
    );
}