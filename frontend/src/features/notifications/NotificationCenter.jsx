import { useRef, useEffect } from 'react';
import useNotificationStore from '@store/notifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const typeIcon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '🔴',
};

export default function NotificationCenter({ isOpen, onClose }) {
    const { notifications, markRead, markAllRead, clearAll } = useNotificationStore();
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const unread = notifications.filter((n) => !n.read);
    const read = notifications.filter((n) => n.read);

    return (
        <div ref={ref} className="notif-center">
            {/* Header */}
            <div className="notif-center-header">
                <h2 className="notif-center-title">Notifications</h2>
                <div className="notif-center-actions">
                    {notifications.length > 0 && (
                        <>
                            <button onClick={markAllRead} className="notif-action-btn">Mark all read</button>
                            <button onClick={clearAll} className="notif-action-btn notif-clear-btn">Clear All</button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="notif-center-body">
                {notifications.length === 0 && (
                    <div className="notif-empty">
                        <span style={{ fontSize: 36 }}>🔔</span>
                        <p>No notifications</p>
                    </div>
                )}

                {unread.length > 0 && (
                    <div>
                        <p className="notif-section-label">NEW</p>
                        {unread.map((n) => (
                            <NotifItem key={n.id} n={n} onRead={markRead} />
                        ))}
                    </div>
                )}

                {read.length > 0 && (
                    <div>
                        <p className="notif-section-label">EARLIER</p>
                        {read.map((n) => (
                            <NotifItem key={n.id} n={n} onRead={markRead} dimmed />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function NotifItem({ n, onRead, dimmed }) {
    return (
        <div
            className={`notif-item ${dimmed ? 'notif-item-dimmed' : ''}`}
            onClick={() => onRead(n.id)}
        >
            <div className="notif-item-icon">
                {n.icon
                    ? <img src={n.icon} alt="" className="w-8 h-8 rounded-lg" />
                    : <span style={{ fontSize: 20 }}>{typeIcon[n.type] || '🔔'}</span>
                }
            </div>
            <div className="notif-item-content">
                <div className="notif-item-header">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-item-time">{dayjs(n.timestamp).fromNow()}</span>
                </div>
                <p className="notif-item-msg">{n.message}</p>
            </div>
            {!n.read && <div className="notif-unread-dot" />}
        </div>
    );
}
