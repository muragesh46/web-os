import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import usewindowstore from "@store/window.js";
import useFinderStore from "@store/finder.js";

gsap.registerPlugin(Draggable);

const Home = () => {
    const { openwindow } = usewindowstore();
    const { navigateTo } = useFinderStore();
    const [desktopItems, setDesktopItems] = useState([]);

    useEffect(() => {
        const fetchDesktopItems = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                const headers = { Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}` };

                // Fetch root folders
                const rootRes = await fetch(`${API_BASE_URL}/finder?parentId=root`, { headers });
                const rootData = await rootRes.json();

                const workFolder = rootData.find(f => f.name === 'Work');
                if (workFolder) {
                    const projRes = await fetch(`${API_BASE_URL}/finder?parentId=${workFolder._id}`, { headers });
                    const projData = await projRes.json();
                    const marnani = projData.find(f => f.name === 'Marnani - Airbnb Clone');
                    if (marnani) {
                        setDesktopItems([marnani]);
                    }
                }
            } catch (err) {
                console.error("Failed to load desktop items", err);
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

    return (
        <section id="home" className="w-full h-full relative">
            <ul>
                {desktopItems.map((project) => (
                    <li
                        key={project._id}
                        className={clsx("group folder absolute cursor-pointer flex flex-col items-center gap-1", "top-[15vh] left-7")}
                        onClick={() => openProjectFinder(project)}
                        title={project.name}
                    >
                        <img src="/images/folder.png" className="w-16 h-16 object-contain drop-shadow-sm mb-1 pointer-events-none" alt={project.name} />
                        <p className="text-white text-xs text-center drop-shadow-md bg-black/20 px-1 rounded">{project.name}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default Home;