import { useEffect, useRef } from 'react';
import useNotificationStore from '@store/notifications';
import useSettingsStore from '@store/settings';

const typeConfig = {
    info: { bg: 'rgba(59,130,246,0.18)', border: '#3b82f6', icon: 'ℹ️' },
    success: { bg: 'rgba(34,197,94,0.18)', border: '#22c55e', icon: '✅' },
    warning: { bg: 'rgba(234,179,8,0.18)', border: '#eab308', icon: '⚠️' },
    error: { bg: 'rgba(239,68,68,0.18)', border: '#ef4444', icon: '🔴' },
};

function Banner({ notification }) {
    const { dismissBanner } = useNotificationStore();
    const cfg = typeConfig[notification.type] || typeConfig.info;

    return (
        <div
            className="notification-banner"
            style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.border}` }}
        >
            <div className="notification-banner-icon">
                {notification.icon
                    ? <img src={notification.icon} alt="" className="w-8 h-8 rounded-md" />
                    : <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                }
            </div>
            <div className="notification-banner-body">
                <p className="notification-banner-title">{notification.title}</p>
                <p className="notification-banner-message">{notification.message}</p>
            </div>
            <button
                className="notification-banner-close"
                onClick={() => dismissBanner(notification.id)}
            >✕</button>
        </div>
    );
}

export default function NotificationBanner() {
    const { bannerQueue } = useNotificationStore();
    const { notificationsEnabled } = useSettingsStore();

    if (!notificationsEnabled || bannerQueue.length === 0) return null;

    return (
        <div className="notification-banner-stack">
            {bannerQueue.map((n) => (
                <Banner key={n.id} notification={n} />
            ))}
        </div>
    );
}
