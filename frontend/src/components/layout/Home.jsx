import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import usewindowstore from "@store/window.js";
import useFinderStore from "@store/finder.js";
import useSettingsStore from "@store/settings.js";

gsap.registerPlugin(Draggable);

const Home = () => {
    const { openwindow } = usewindowstore();
    const { navigateTo } = useFinderStore();
    const { wallpaper, displayBrightness } = useSettingsStore();
    const defaultItems = [
        { _id: 'default-marnani', name: 'Marnani - Airbnb Clone' },
    ];
    const [desktopItems, setDesktopItems] = useState(defaultItems);

    useEffect(() => {
        const fetchDesktopItems = async () => {
            let token = null;
            try {
                const stored = localStorage.getItem('user');
                if (stored) {
                    token = JSON.parse(stored)?.token;
                }
            } catch {
                // ignore
            }

            if (!token) return;

            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch root folders
                const rootRes = await fetch(`${API_BASE_URL}/finder?parentId=root`, { headers });
                if (!rootRes.ok) return;
                const rootData = await rootRes.json();

                if (Array.isArray(rootData)) {
                    const workFolder = rootData.find(f => f.name === 'Work');
                    if (workFolder) {
                        const projRes = await fetch(`${API_BASE_URL}/finder?parentId=${workFolder._id}`, { headers });
                        if (projRes.ok) {
                            const projData = await projRes.json();
                            const marnani = projData.find(f => f.name === 'Marnani - Airbnb Clone');
                            if (marnani) {
                                setDesktopItems([marnani]);
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn("Using offline desktop items:", err);
            }
        };
        fetchDesktopItems();
    }, []);

    const openProjectFinder = (folder) => {
        navigateTo(folder._id);
        openwindow("finder");
    }

    useGSAP(() => {
        if (desktopItems.length > 0) {
            Draggable.create(".folder", {
                bounds: window,
                inertia: true,
            });
        }
    }, [desktopItems]);

    const brightness = Math.min(100, Math.max(20, displayBrightness)) / 100;

    return (
        <section
            id="home"
            className="w-full h-full absolute inset-0 z-0 select-none overflow-hidden pointer-events-auto"
            style={{
                backgroundImage: `url(${wallpaper})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                transition: 'background-image 0.6s ease, filter 0.2s ease',
                filter: `brightness(${brightness})`,
            }}
        >
            <ul>
                {desktopItems.map((project, idx) => (
                    <li
                        key={project._id}
                        className="group folder absolute cursor-pointer flex flex-col items-center gap-1"
                        style={{
                            top: `${14 + idx * 13}vh`,
                            left: '1.75rem',
                        }}
                        onClick={() => openProjectFinder(project)}
                        title={project.name}
                    >
                        <img src="/images/folder.png" className="w-16 h-16 object-contain drop-shadow-sm mb-1 pointer-events-none" alt={project.name} />
                        <p className="text-white text-xs text-center drop-shadow-md bg-black/30 px-1.5 py-0.5 rounded max-w-[120px] truncate">{project.name}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default Home;