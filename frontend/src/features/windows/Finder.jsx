import React from "react";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import Location from "@store/location.js";
import usewindowstore from "@store/window.js";
import WindowControls from "@components/common/WindowControl.jsx";
import clsx from "clsx";
import { locations } from "@constants/data.js";

function Finder() {
    const { openwindow, window } = usewindowstore();
    const { activeLocation, setActiveLocation } = Location();

    React.useEffect(() => {
        const finderData = window?.finder?.data;
        const isOpen = window?.finder?.isOpen;
        if (finderData?.id === "trash" && isOpen) {
            setActiveLocation(locations.trash);
        }
    }, [window?.finder?.data, window?.finder?.isOpen, setActiveLocation]);
    const renderlist = (items) => items.map(item => (
        <li className={clsx(item.id == activeLocation.id ? "active" : "notactive")} key={item.id} onClick={() => setActiveLocation(item)}>
            <img src={item.icon} className="w-4" alt={item.name} />
            <p className="text-sm font-medium truncate">{item.name}</p>
        </li>

    ))


    const openItems = (items) => {
        console.log("Opening item:", items);
        if (items.fileType === "pdf") { return openwindow("resume") }
        if (items.kind === "folder") { return setActiveLocation(items) }
        if (["fig", "url"].includes(items.fileType) && (items.href)) {
            console.log("Opening URL:", items.href);
            return globalThis.window.open(items.href, "_blank")
        }
        openwindow(`${items.fileType}${items.kind}`, items)

    }
    return (
        <>

            <div id="window-header">
                <WindowControls target="finder" />
            </div>

            <div className="bg-white flex h-full">
                <div className="sidebar">
                    <div>
                        <h3>Favorites</h3>
                        <ul>
                            {renderlist(Object.values(locations))}
                        </ul>
                    </div>

                    <div>
                        <h3>My Projects</h3>
                        <ul>
                            {renderlist(locations.work.children)}
                        </ul>
                    </div>
                </div>
                <ul className="content">
                    {activeLocation?.children?.map(item => (
                        <li
                            key={item.id}
                            className={item.position}
                            onClick={() => openItems(item)}
                        >
                            <img src={item.icon} alt={item.name} />
                            <p>{item.name}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </>

    )
}
const FinderWindow = WindowWrapper(Finder, "finder");

export default FinderWindow;