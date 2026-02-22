import React from 'react';

export default function LandingPage({ onJoin, user }) {
    const handleGetStarted = () => {
        const id = Math.random().toString(36).substring(2, 9);
        onJoin(id);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 gap-6">
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 text-center">
                    Welcome, {user?.displayName || 'Guest'}
                </h1>
                <p className="text-gray-500 text-center max-w-sm text-sm leading-relaxed">
                    Connect face-to-face with anyone, anywhere. Start a video call with HD quality and crystal clear audio.
                </p>

                {/* Action Buttons removed - now helper only */}
                <div className="flex flex-col items-center gap-3 mt-2 w-full max-w-xs">
                    <p className="text-xs text-blue-600 font-semibold bg-blue-50 px-4 py-2 rounded-lg">
                        Use the Chat app to start or join calls
                    </p>
                </div>
            </div>

            {/* Footer Features */}
            <div className="flex justify-center gap-8 pb-6 px-6">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    HD Video
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    Crystal Audio
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                    Screen Share
                </div>
            </div>
        </div>
    );
}