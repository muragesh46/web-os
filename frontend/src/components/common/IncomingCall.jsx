import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import useSocketStore from '@store/socket';
import usewindowstore from '@store/window';

export default function IncomingCall() {
    const { incomingCall, acceptCall, rejectCall } = useSocketStore();
    const { openwindow } = usewindowstore();

    if (!incomingCall) return null;

    const handleAccept = () => {
        const { meetingId } = incomingCall;
        acceptCall();
        openwindow('videocall', { meetingId, autoJoin: true });
    };

    const handleReject = () => {
        rejectCall();
    };

    return (
        <div className="fixed inset-0 z-[999999] flex items-start justify-center pt-12 pointer-events-none">
            {/* Background Overlay with subtle pulse */}
            <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />

            <div className="relative pointer-events-auto bg-white/90 backdrop-blur-2xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2rem] p-5 flex items-center gap-6 min-w-[380px] animate-in zoom-in slide-in-from-top-10 duration-500 ease-out">
                {/* Caller Avatar & Animated Rings */}
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-white/50">
                        {incomingCall.callerName?.charAt(0)?.toUpperCase()}
                    </div>
                    {/* Multi-layered Ringing Animation */}
                    <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-40" />
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping opacity-20 delay-300" />
                    <div className="absolute -inset-4 rounded-full border-2 border-blue-500/20 animate-pulse" />
                </div>

                {/* Call Info */}
                <div className="flex-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Incoming Call</p>
                    <h3 className="text-gray-900 font-black text-2xl leading-none tracking-tight mb-1">{incomingCall.callerName}</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-gray-500 text-xs font-bold flex items-center gap-1.5">
                            <Video size={12} className="text-blue-500" fill="currentColor" /> 
                            High Quality Video
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 ml-4">
                    <button
                        onClick={handleReject}
                        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-red-200 hover:scale-110 active:scale-90"
                        title="Decline"
                    >
                        <PhoneOff size={24} />
                    </button>
                    <button
                        onClick={handleAccept}
                        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600 shadow-[0_8px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_25px_rgba(34,197,94,0.4)] hover:scale-110 active:scale-95 transition-all duration-300"
                        title="Answer"
                    >
                        <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
                        <Phone size={24} fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>
    );
}
