import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import usewindowstore from "@store/window.js";
import clsx from "clsx";

gsap.registerPlugin(Draggable);
/**
 * Higher-Order Component to turn any Component into a clickable App Icon on the desktop.
 * 
 * @param {React.Component} Component - The original App UI Component (e.g. Safari, Mail)
 * @param {Object} options - Configuration for the app icon.
 * @param {string} options.windowKey - The unique ID in usewindowstore (e.g., 'safari').
 * @param {string} options.iconPath - The path to the image in the public folder (e.g., '/images/icons/safari.png').
 * @param {string} options.appName - The display name underneath the icon.
 * @param {string} options.defaultClasses - Optional Tailwind layout classes (e.g., 'top-20 right-10').
 */
function AppsWrapper(Component, { windowKey, iconPath, appName, defaultClasses = "" }) {
    // We return a new Component that represents the App Icon launcher.
    const WrappedIcon = (props) => {
        const { openwindow } = usewindowstore();
        const ref = useRef(null);

        // Make the app icon draggable on the desktop
        useGSAP(() => {
            Draggable.create(ref.current, {
                bounds: window,
                inertia: true,
                type: "x,y",
            });
        }, []);

        const handleOpenApp = (e) => {
            // Prevent drag events from triggering a click
            if (Draggable.get(ref.current)?.isDragging) return;
            openwindow(windowKey);
        };

        return (
            <li
                ref={ref}
                className={clsx("group folder absolute cursor-pointer flex flex-col items-center gap-1", defaultClasses)}
                onClick={handleOpenApp}
                title={appName}
            >
                <img src={iconPath} alt={appName} className="w-12 h-12 object-contain" />
                <p className="text-white text-xs text-center drop-shadow-md bg-black/20 px-1 rounded">{appName}</p>

                {/* 
                  The actual Component (the App Window) is usually rendered inside WindowWrapper 
                  somewhere else in the DOM (like inside App.jsx or Home.jsx), not directly inside the icon.
                  But if we want to mount it silently here, we can. However, usually, we just render the icon!
                */}
            </li>
        );
    };

    WrappedIcon.displayName = `AppsWrapper(${Component.displayName || Component.name || "App"})`;

    // We export a payload containing the Launcher Icon and the underlying Component
    return {
        LauncherIcon: WrappedIcon,
        AppComponent: Component,
        windowKey
    };
}

export default AppsWrapper;