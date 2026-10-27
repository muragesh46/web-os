import React, { useState, useEffect } from "react";
import withWindow from "@hoc/WindowWrapper.jsx";
import WindowControls from "@components/common/WindowControl.jsx";
import LandingPage from "@features/videocall/landing.jsx";
import VideoMeetComponent from "@features/videocall/video.jsx";
import useAuthStore from "@store/auth";
import usewindowstore from "@store/window.js";
import LockScreen from "@components/common/LockScreen.jsx";

function VideoCall() {
    const { user } = useAuthStore();
    const { window: windowState, closewindow, clearWindowData } = usewindowstore();
    const winData = windowState?.videocall?.data;

    const [inMeeting, setInMeeting] = useState(false);
    const [meetingId, setMeetingId] = useState("");

    // Auto-join meeting if meetingId is passed from another app (like Chat or IncomingCall)
    useEffect(() => {
        if (winData?.meetingId) {
            setMeetingId(winData.meetingId);
            setInMeeting(true);
        }
    }, [winData?.meetingId]);

    const handleJoinMeeting = (id) => {
        if (!id) return;
        setMeetingId(id);
        setInMeeting(true);
    };

    const handleLeaveMeeting = () => {
        setInMeeting(false);
        setMeetingId("");
        clearWindowData('videocall');
        closewindow('videocall');
    };

    if (!user) {
        return (
            <div className="flex flex-col h-[600px] w-[900px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700 relative overflow-hidden">
                <div id="window-header" className="z-[1000000]">
                    <div id="window-controls">
                        <WindowControls target="videocall" />
                    </div>
                </div>
                <div className="flex-grow relative">
                    <LockScreen />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] w-[900px] overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 font-sans">
            {/* Window Header */}
            <div id="window-header" className="flex items-center px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0 relative">
                <div id="window-controls">
                    <WindowControls target="videocall" />
                </div>
                <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {inMeeting ? `Video Call (${meetingId})` : 'Video Call'}
                </h2>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-grow overflow-auto relative bg-white dark:bg-gray-900">
                    {inMeeting && meetingId ? (
                        <VideoMeetComponent onLeave={handleLeaveMeeting} meetingId={meetingId} user={user} />
                    ) : (
                        <LandingPage onJoin={handleJoinMeeting} user={user} />
                    )}
                </div>
            </div>
        </div>
    );
}

const VideoCallWindow = withWindow(VideoCall, "videocall");

export default VideoCallWindow;
