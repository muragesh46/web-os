import React, { useState, useEffect } from "react";
import { Video, Search, MessageSquare, Phone } from "lucide-react";
import withWindow from "@hoc/WindowWrapper.jsx";
import WindowControls from "@components/common/WindowControl.jsx";
import LandingPage from "@features/videocall/landing.jsx";
import VideoMeetComponent from "@features/videocall/video.jsx";
import useAuthStore from "@store/auth";
import usewindowstore from "@store/window.js";
import useSocketStore from "@store/socket";
import chatService from "@services/chat.service.js";
import LockScreen from "@components/common/LockScreen.jsx";

function VideoCall() {
    const { user } = useAuthStore();
    const { window: windowState, openwindow, closewindow } = usewindowstore();
    const { chatSocket: socket } = useSocketStore();
    const winData = windowState?.videocall?.data;

    const [inMeeting, setInMeeting] = useState(false);
    const [meetingId, setMeetingId] = useState("");

    // Auto-join meeting if meetingId is passed from another app (like Chat)
    useEffect(() => {
        if (winData?.meetingId) {
            setMeetingId(winData.meetingId);
            if (winData.autoJoin) {
                setInMeeting(true);
            }
        }
    }, [winData]);

    const handleJoinMeeting = (id) => {
        setMeetingId(id);
        setInMeeting(true);
    };

    const handleLeaveMeeting = () => {
        setInMeeting(false);
        setMeetingId("");
        closewindow('videocall');
    };

    if (!user) {
        return (
            <div className="flex flex-col h-[600px] w-[900px] bg-white rounded-lg shadow-2xl border border-gray-300 relative overflow-hidden">
                <div id="window-header" className="z-[1000000]">
                    <WindowControls target="videocall" />
                </div>
                <div className="flex-grow relative">
                    <LockScreen />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] w-[900px] overflow-hidden bg-white rounded-lg shadow-2xl border border-gray-300 font-sans">
            {/* Window Header */}
            <div id="window-header" className="flex items-center px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0 relative">
                <WindowControls target="videocall" />
                <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700">Video Call</h2>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content */}
                <div className="flex-grow overflow-auto relative bg-white">
                    {inMeeting ? (
                        <VideoMeetComponent onLeave={handleLeaveMeeting} meetingId={meetingId} user={user} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-10">
                            <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <Video size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Ready for Video Calls</h3>
                                <p className="text-sm text-gray-500 max-w-xs mt-2">
                                    Start a call from any conversation in the <button onClick={() => openwindow('chat')} className="text-blue-600 font-semibold hover:underline">Chat app</button>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const VideoCallWindow = withWindow(VideoCall, "videocall");

export default VideoCallWindow;
