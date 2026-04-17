import { useState, useEffect, useRef } from "react"
import { navLinks, navIcons } from "@constants/data.js"
import dayjs from "dayjs"
import usewindowstore from "@store/window.js";
import useAuthStore from "@store/auth";
import useSettingsStore from "@store/settings";
import UserDropdown from "./UserDropdown.jsx";
import ControlCenter from "./ControlCenter.jsx";
import NotificationCenter from "@features/notifications/NotificationCenter.jsx";
import useNotificationStore from "@store/notifications";

function Navbar() {
    const { openwindow } = usewindowstore()
    const { user } = useAuthStore();
    const { displayName: settingsName } = useSettingsStore();
    const { notifications } = useNotificationStore();
    const unreadCount = notifications.filter((n) => !n.read).length;
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showControlCenter, setShowControlCenter] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [currentTime, setCurrentTime] = useState(dayjs());
    const activeUser = settingsName || user?.displayName || user?.fullName || user?.email || "Guest";
    const userRef = useRef(null);
    const controlRef = useRef(null);
    const notifRef = useRef(null);

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
        if (iconId === 2) {
            setShowNotifications((prev) => !prev);
            setShowUserDropdown(false);
            setShowControlCenter(false);
        } else if (iconId === 3) {
            setShowUserDropdown(!showUserDropdown);
            setShowControlCenter(false);
            setShowNotifications(false);
        } else if (iconId === 4) {
            setShowControlCenter(!showControlCenter);
            setShowUserDropdown(false);
            setShowNotifications(false);
        } else {
            setShowUserDropdown(false);
            setShowControlCenter(false);
            setShowNotifications(false);
        }
    };

    return (
        <nav className="nav">
            <div>
                <img src="/images/m.png" alt="logo" className="h-[17.6px] w-auto" />
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
                            ref={id === 2 ? notifRef : id === 3 ? userRef : id === 4 ? controlRef : null}
                            className="relative"
                        >
                            <div
                                onClick={() => handleIconClick(id)}
                                className="cursor-pointer hover:bg-gray-200/70 rounded-lg p-1 transition-all duration-200 hover:scale-110 active:scale-95 relative"
                                title={id === 2 ? "Notifications" : id === 3 ? "User" : id === 4 ? "Control Center" : `Icon ${id}`}
                            >
                                <img src={img} alt={`icon-${id}`} className="w-[17.6px] h-[17.6px]" />
                                {/* Unread badge on notification icon */}
                                {id === 2 && unreadCount > 0 && (
                                    <span className="navbar-notif-badge">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            {id === 2 && (
                                <NotificationCenter
                                    isOpen={showNotifications}
                                    onClose={() => setShowNotifications(false)}
                                />
                            )}
                            {id === 3 && showUserDropdown && (
                                <UserDropdown
                                    onClose={() => setShowUserDropdown(false)}
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
                            const win = usewindowstore.getState().window?.calander;
                            if (win?.isOpen) {
                                usewindowstore.getState().closewindow('calander');
                            } else {
                                openwindow('calander');
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