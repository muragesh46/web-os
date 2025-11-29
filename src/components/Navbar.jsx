import { useState, useEffect, useRef } from "react"
import { navLinks, navIcons } from "@constants/data.js"
import dayjs from "dayjs"
import usewindowstore from "@store/window.js";
import UserDropdown from "./UserDropdown.jsx";
import ControlCenter from "./ControlCenter.jsx";

function Navbar() {
    const { openwindow } = usewindowstore()
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showControlCenter, setShowControlCenter] = useState(false);
    const [currentTime, setCurrentTime] = useState(dayjs());
    const [activeUser, setActiveUser] = useState("Muragesh");
    const userRef = useRef(null);
    const controlRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userRef.current && !userRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
            if (controlRef.current && !controlRef.current.contains(event.target)) {
                setShowControlCenter(false);
            }
        };

        if (showUserDropdown || showControlCenter) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showUserDropdown, showControlCenter]);

    const handleIconClick = (iconId) => {
        // Icon 1: WiFi, Icon 2: Search, Icon 3: User, Icon 4: Widgets/Mode
        if (iconId === 3) {
            setShowUserDropdown(!showUserDropdown);
            setShowControlCenter(false);
        } else if (iconId === 4) {
            setShowControlCenter(!showControlCenter);
            setShowUserDropdown(false);
        } else {
            console.log(`Icon ${iconId} clicked`);
            // Close others if needed, or leave as is
            setShowUserDropdown(false);
            setShowControlCenter(false);
        }
    };

    return (
        <nav className="nav">
            <div>
                <img src="/images/logo.svg" alt="logo" className="h-[17.6px] w-auto" />
                <p>{activeUser}</p>
                <ul>
                    {navLinks.map(({ id, name, type }) => (
                        <li key={id} onClick={() => {
                            const win = usewindowstore.getState().window?.[type];
                            if (win?.isOpen) {
                                usewindowstore.getState().closewindow(type);
                            } else {
                                openwindow(type);
                            }
                        }}>
                            <p>{name}</p>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <ul>
                    {navIcons.map(({ id, img }) => (
                        <li
                            key={id}
                            ref={id === 3 ? userRef : id === 4 ? controlRef : null}
                            className="relative"
                        >
                            <div
                                onClick={() => handleIconClick(id)}
                                className="cursor-pointer hover:bg-gray-200/70 rounded-lg p-1 transition-all duration-200 hover:scale-110 active:scale-95"
                                title={id === 3 ? "User" : id === 4 ? "Control Center" : `Icon ${id}`}
                            >
                                <img src={img} alt={`icon-${id}`} className="w-[17.6px] h-[17.6px]" />
                            </div>
                            {id === 3 && showUserDropdown && (
                                <UserDropdown
                                    onClose={() => setShowUserDropdown(false)}
                                    onSwitchUser={setActiveUser}
                                    activeUser={activeUser}
                                />
                            )}
                            {id === 4 && showControlCenter && <ControlCenter onClose={() => setShowControlCenter(false)} />}
                        </li>
                    ))}
                </ul>
                <div className="relative">
                    <time
                        onClick={() => {
                            const win = usewindowstore.getState().window?.calendar;
                            if (win?.isOpen) {
                                usewindowstore.getState().closewindow('calendar');
                            } else {
                                openwindow('calendar');
                            }
                        }}
                        className="cursor-pointer hover:bg-gray-200/70 dark:hover:bg-white/10 rounded-lg px-2 py-0.5 transition-all duration-200 hover:shadow-sm font-medium"
                        title="Open calendar"
                    >
                        {currentTime.format(" ddd D h:mm A")}
                    </time>
                </div>
            </div>


        </nav>
    )
}

export default Navbar