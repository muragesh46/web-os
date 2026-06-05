import { useState, useEffect, useRef } from 'react';
import {
    Settings,
    Wifi,
    Bluetooth,
    Moon,
    Bell,
    BellOff,
    Sun,
    Volume2,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
} from 'lucide-react';
import useSettingsStore from '@store/settings';
import usewindowstore from '@store/window';

function Toggle({ on, onClick, label }) {
    return (
        <button
            type="button"
            className={`settings-toggle ${on ? 'settings-toggle-on' : ''}`}
            onClick={onClick}
            aria-pressed={on}
            aria-label={label}
        >
            <span className="settings-toggle-thumb" />
        </button>
    );
}

function AccessPanel() {
    const [expanded, setExpanded] = useState(false);
    const panelRef = useRef(null);
    const { openwindow } = usewindowstore();
    const {
        theme,
        toggleTheme,
        doNotDisturb,
        toggleDoNotDisturb,
        notificationsEnabled,
        setNotificationsEnabled,
        displayBrightness,
        setDisplayBrightness,
        soundVolume,
        setSoundVolume,
        wifiEnabled,
        setWifiEnabled,
        bluetoothEnabled,
        setBluetoothEnabled,
    } = useSettingsStore();

    useEffect(() => {
        if (!expanded) return;
        const onPointerDown = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setExpanded(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [expanded]);

    const openSettings = (tab) => {
        openwindow('settings', { tab });
        setExpanded(false);
    };

    return (
        <div className="home-access-notch" ref={panelRef}>
            {/* Notch pill */}
            <button
                type="button"
                className={`home-notch-pill ${expanded ? 'home-notch-pill-open' : ''}`}
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-label="Quick settings"
            >
                <span className="home-notch-status">
                    <Wifi size={12} className={wifiEnabled ? 'home-notch-icon-on' : ''} />
                    <Bluetooth size={12} className={bluetoothEnabled ? 'home-notch-icon-on' : ''} />
                    {doNotDisturb && <Moon size={12} className="home-notch-icon-dnd" />}
                </span>
                <span className="home-notch-label">Control</span>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Expanded panel */}
            {expanded && (
                <div className="home-access-panel">
                    {/* Header */}
                    <div className="home-access-header">
                        <div className="home-access-header-left">
                            <SlidersHorizontal size={13} />
                            <span>Quick Access</span>
                        </div>
                        <button
                            type="button"
                            className="home-access-gear"
                            onClick={() => openSettings('General')}
                            title="Open Settings"
                        >
                            <Settings size={13} />
                        </button>
                    </div>

                    {/* Toggle chips */}
                    <div className="home-access-toggles">
                        <button
                            type="button"
                            className={`home-access-chip ${wifiEnabled ? 'home-access-chip-on' : ''}`}
                            onClick={() => setWifiEnabled(!wifiEnabled)}
                        >
                            <Wifi size={14} />
                            Wi‑Fi
                        </button>
                        <button
                            type="button"
                            className={`home-access-chip ${bluetoothEnabled ? 'home-access-chip-on' : ''}`}
                            onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
                        >
                            <Bluetooth size={14} />
                            Bluetooth
                        </button>
                        <button
                            type="button"
                            className={`home-access-chip ${doNotDisturb ? 'home-access-chip-on' : ''}`}
                            onClick={toggleDoNotDisturb}
                        >
                            <Moon size={14} />
                            Focus
                        </button>
                        <button
                            type="button"
                            className={`home-access-chip ${theme === 'dark' ? 'home-access-chip-on' : ''}`}
                            onClick={toggleTheme}
                        >
                            <Sun size={14} />
                            {theme === 'dark' ? 'Dark' : 'Light'}
                        </button>
                    </div>

                    {/* Brightness slider */}
                    <div className="home-access-slider-block">
                        <div className="home-access-slider-label">
                            <Sun size={13} />
                            <span>Display</span>
                            <span className="home-access-slider-value">{displayBrightness}%</span>
                        </div>
                        <input
                            type="range"
                            min={20}
                            max={100}
                            value={displayBrightness}
                            onChange={(e) => setDisplayBrightness(Number(e.target.value))}
                            className="home-access-range"
                        />
                    </div>

                    {/* Volume slider */}
                    <div className="home-access-slider-block">
                        <div className="home-access-slider-label">
                            <Volume2 size={13} />
                            <span>Sound</span>
                            <span className="home-access-slider-value">{soundVolume}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={soundVolume}
                            onChange={(e) => setSoundVolume(Number(e.target.value))}
                            className="home-access-range"
                        />
                    </div>

                    <div className="home-access-divider" />

                    {/* Notification row */}
                    <div className="settings-toggle-row home-access-row">
                        <div>
                            <p className="home-access-row-title">Notifications</p>
                            <p className="home-access-row-sub">
                                {doNotDisturb ? 'Paused while Focus is on' : 'Banners and alerts'}
                            </p>
                        </div>
                        <Toggle
                            on={notificationsEnabled && !doNotDisturb}
                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                            label="Notifications"
                        />
                    </div>

                    {/* Action buttons — deep-link to specific Settings tabs */}
                    <div className="home-access-actions">
                        <button
                            type="button"
                            className="home-access-btn home-access-btn-primary"
                            onClick={() => openSettings('Appearance')}
                        >
                            <Settings size={13} />
                            Settings
                        </button>
                        <button
                            type="button"
                            className="home-access-btn"
                            onClick={() => openSettings('Network')}
                        >
                            <Wifi size={13} />
                            Network
                        </button>
                        <button
                            type="button"
                            className="home-access-btn"
                            onClick={() => openSettings('Notifications')}
                        >
                            {notificationsEnabled ? <Bell size={13} /> : <BellOff size={13} />}
                            Alerts
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AccessPanel;
