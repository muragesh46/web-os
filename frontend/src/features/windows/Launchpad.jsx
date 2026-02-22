import React, { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import usewindowstore from "@store/window.js";
import { launchpadApps } from "@constants/data.js";

const Launchpad = () => {
    const { window: windowState, closewindow, openwindow } = usewindowstore();
    const isOpen = windowState?.launchpad?.isOpen;
    const ref = useRef(null);
    const [searchQuery, setSearchQuery] = useState("");

    useGSAP(() => {
        const el = ref.current;
        if (!el) return;

        if (isOpen) {
            el.style.display = "flex";
            gsap.fromTo(
                el,
                { opacity: 0, scale: 1.05 },
                { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
            );
        } else {
            gsap.to(el, {
                opacity: 0,
                scale: 1.05,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => {
                    el.style.display = "none";
                    setSearchQuery("");
                }
            });
        }
    }, [isOpen]);

    const handleBackgroundClick = (e) => {
        if (e.target === ref.current) {
            closewindow("launchpad");
        }
    };

    const handleAppClick = (windowKey) => {
        closewindow("launchpad");
        openwindow(windowKey);
    };

    const filtered = launchpadApps.filter((app) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div
            ref={ref}
            onClick={handleBackgroundClick}
            className="absolute inset-0 z-[9999] hidden flex-col items-center justify-start bg-black/50 backdrop-blur-3xl"
        >
            {/* Search Bar */}
            <div className="mt-14 mb-10 flex justify-center">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-72 pl-9 pr-4 py-2 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm text-center"
                    />
                </div>
            </div>

            {/* App Grid */}
            <div className="flex-1 w-full flex items-start justify-center px-20">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-10 gap-y-8">
                    {filtered.map((app) => (
                        <button
                            key={app.id}
                            onClick={() => handleAppClick(app.windowKey)}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                        >
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg transition-transform duration-150 group-hover:scale-110">
                                <img
                                    src={`/images/${app.icon}`}
                                    alt={app.name}
                                    className="w-full h-full object-cover"
                                    draggable={false}
                                />
                            </div>
                            <span className="text-white text-xs font-medium drop-shadow text-center w-20 truncate">
                                {app.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Launchpad;
