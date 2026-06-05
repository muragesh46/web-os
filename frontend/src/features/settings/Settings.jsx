import React, { useEffect, useState, useCallback } from 'react';
import WindowWrapper from '@hoc/WindowWrapper.jsx';
import WindowControls from '@components/common/WindowControl.jsx';
import useSettingsStore, { wallpapers, ACCENT_COLORS } from '@store/settings';
import useAuthStore from '@store/auth';
import usewindowstore from '@store/window';
import {
    User, Palette, Volume2, Bell, Wifi, Shield, Keyboard, Info,
    Sun, Moon, Monitor, LogOut, Bluetooth, BellOff, Music,
    Trash2, ExternalLink, ChevronRight,
} from 'lucide-react';
import '@style/settings.css';

/* ────────── Sidebar definition ────────── */
const SIDEBAR_SECTIONS = [
    {
        label: 'System',
        items: [
            { id: 'General',       icon: User,     color: '#8e8e93', label: 'General' },
            { id: 'Appearance',    icon: Palette,  color: '#3b82f6', label: 'Appearance' },
            { id: 'Sound',         icon: Volume2,  color: '#ec4899', label: 'Sound' },
        ],
    },
    {
        label: 'Connectivity',
        items: [
            { id: 'Notifications', icon: Bell,     color: '#ef4444', label: 'Notifications' },
            { id: 'Network',       icon: Wifi,     color: '#22c55e', label: 'Network' },
        ],
    },
    {
        label: 'Other',
        items: [
            { id: 'Privacy',       icon: Shield,   color: '#f97316', label: 'Privacy' },
            { id: 'Keyboard',      icon: Keyboard, color: '#64748b', label: 'Keyboard' },
            { id: 'About',         icon: Info,     color: '#8b5cf6', label: 'About' },
        ],
    },
];

const ALL_TABS = SIDEBAR_SECTIONS.flatMap((s) => s.items);

/* ────────── Toggle component ────────── */
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

/* ────────── Tab content components ────────── */

function GeneralTab({ store, user, logout }) {
    const displayName = store.displayName || user?.displayName || user?.fullName || '';
    const email = user?.email || '';
    const initial = (displayName || email || 'U').charAt(0).toUpperCase();

    return (
        <div className="settings-section">
            <h2 className="settings-section-title">General</h2>
            <p className="settings-section-desc">Manage your profile and preferences</p>

            <div className="settings-card">
                <div className="settings-user-badge">
                    <div className="settings-avatar">{initial}</div>
                    <div className="settings-user-info">
                        <p className="settings-user-name">{displayName || 'Guest'}</p>
                        {email && <p className="settings-user-email">{email}</p>}
                    </div>
                </div>
            </div>

            <div className="settings-card">
                <p className="settings-label">Display Name</p>
                <p className="settings-hint">This name appears in the menu bar and on your desktop.</p>
                <input
                    id="settings-display-name"
                    type="text"
                    className="settings-input"
                    value={store.displayName}
                    onChange={(e) => store.setDisplayName(e.target.value)}
                    placeholder="Enter your display name…"
                />
            </div>

            <div className="settings-card">
                <div className="settings-toggle-row">
                    <div>
                        <p className="settings-label">Language & Region</p>
                        <p className="settings-hint">English (United States)</p>
                    </div>
                    <ChevronRight size={16} style={{ opacity: 0.3 }} />
                </div>
            </div>

            <div className="settings-card">
                <button
                    type="button"
                    className="settings-btn-danger"
                    onClick={() => logout()}
                >
                    <LogOut size={14} />
                    Log Out
                </button>
            </div>
        </div>
    );
}

function AppearanceTab({ store }) {
    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Appearance</h2>
            <p className="settings-section-desc">Customize your desktop look and feel</p>

            {/* Theme */}
            <div className="settings-card">
                <p className="settings-label">Theme</p>
                <div className="settings-theme-row">
                    <button
                        type="button"
                        className={`settings-theme-option ${store.theme === 'light' && !store.autoTheme ? 'settings-theme-active' : ''}`}
                        onClick={() => store.setTheme('light')}
                    >
                        <div className="settings-theme-preview settings-theme-light">
                            <Sun size={20} />
                        </div>
                        <span>Light</span>
                    </button>
                    <button
                        type="button"
                        className={`settings-theme-option ${store.theme === 'dark' && !store.autoTheme ? 'settings-theme-active' : ''}`}
                        onClick={() => store.setTheme('dark')}
                    >
                        <div className="settings-theme-preview settings-theme-dark">
                            <Moon size={20} />
                        </div>
                        <span>Dark</span>
                    </button>
                    <button
                        type="button"
                        className={`settings-theme-option ${store.autoTheme ? 'settings-theme-active' : ''}`}
                        onClick={() => store.setAutoTheme(true)}
                    >
                        <div className="settings-theme-preview settings-theme-auto">
                            <Monitor size={20} />
                        </div>
                        <span>Auto</span>
                    </button>
                </div>
            </div>

            {/* Accent Color */}
            <div className="settings-card">
                <p className="settings-label">Accent Color</p>
                <p className="settings-hint">Applied to buttons, selections, and highlights</p>
                <div className="settings-accent-grid">
                    {ACCENT_COLORS.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            className={`settings-accent-swatch ${store.accentColor === c.value ? 'settings-accent-active' : ''}`}
                            style={{ background: c.value, color: c.value }}
                            onClick={() => store.setAccentColor(c.value)}
                            aria-label={c.label}
                            title={c.label}
                        >
                            {store.accentColor === c.value && (
                                <span className="settings-accent-check">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Wallpaper */}
            <div className="settings-card">
                <p className="settings-label">Desktop Wallpaper</p>
                <div className="settings-wallpaper-grid">
                    {wallpapers.map((wp, idx) => (
                        <button
                            key={wp}
                            type="button"
                            className={`settings-wallpaper-item ${store.wallpaper === wp ? 'settings-wallpaper-active' : ''}`}
                            onClick={() => store.setWallpaper(wp)}
                            aria-label={`Wallpaper ${idx + 1}`}
                        >
                            <img src={wp} alt="" className="settings-wallpaper-img" loading="lazy" />
                            {store.wallpaper === wp && (
                                <span className="settings-wallpaper-check">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Brightness */}
            <div className="settings-card">
                <div className="settings-slider-block">
                    <div className="settings-slider-header">
                        <span className="settings-slider-label">
                            <Sun size={14} />
                            Display Brightness
                        </span>
                        <span className="settings-slider-value">{store.displayBrightness}%</span>
                    </div>
                    <input
                        type="range"
                        min={20}
                        max={100}
                        value={store.displayBrightness}
                        onChange={(e) => store.setDisplayBrightness(Number(e.target.value))}
                        className="settings-range"
                        style={{
                            background: `linear-gradient(to right, #3b82f6 ${((store.displayBrightness - 20) / 80) * 100}%, rgba(0,0,0,0.08) ${((store.displayBrightness - 20) / 80) * 100}%)`,
                        }}
                    />
                </div>
            </div>

            {/* Reduce Motion */}
            <div className="settings-card">
                <div className="settings-toggle-row">
                    <div>
                        <p className="settings-label">Reduce Motion</p>
                        <p className="settings-hint">Shortens window and UI animations</p>
                    </div>
                    <Toggle
                        on={store.reduceMotion}
                        onClick={() => store.setReduceMotion(!store.reduceMotion)}
                        label="Reduce motion"
                    />
                </div>
            </div>
        </div>
    );
}

function SoundTab({ store }) {
    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Sound</h2>
            <p className="settings-section-desc">Control audio output and effects</p>

            <div className="settings-card">
                <div className="settings-slider-block">
                    <div className="settings-slider-header">
                        <span className="settings-slider-label">
                            <Volume2 size={14} />
                            System Volume
                        </span>
                        <span className="settings-slider-value">{store.soundVolume}%</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={store.soundVolume}
                        onChange={(e) => store.setSoundVolume(Number(e.target.value))}
                        className="settings-range"
                        style={{
                            background: `linear-gradient(to right, #ec4899 ${store.soundVolume}%, rgba(0,0,0,0.08) ${store.soundVolume}%)`,
                        }}
                    />
                </div>
            </div>

            <div className="settings-card">
                <div className="settings-toggle-row">
                    <div>
                        <p className="settings-label">UI Sound Effects</p>
                        <p className="settings-hint">Play sounds for buttons, alerts, and notifications</p>
                    </div>
                    <Toggle
                        on={store.soundEffectsEnabled}
                        onClick={() => store.setSoundEffectsEnabled(!store.soundEffectsEnabled)}
                        label="Sound effects"
                    />
                </div>
            </div>

            <div className="settings-card settings-card-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Music size={14} style={{ opacity: 0.6 }} />
                    <p className="settings-hint" style={{ margin: 0 }}>
                        Volume changes sync with the Control Center and home notch panel.
                    </p>
                </div>
            </div>
        </div>
    );
}

function NotificationsTab({ store }) {
    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Notifications</h2>
            <p className="settings-section-desc">Manage alerts, banners, and Focus mode</p>

            <div className="settings-card">
                <div className="settings-toggle-row">
                    <div>
                        <p className="settings-label">Allow Notifications</p>
                        <p className="settings-hint">Show banners for messages and alerts</p>
                    </div>
                    <Toggle
                        on={store.notificationsEnabled}
                        onClick={() => store.setNotificationsEnabled(!store.notificationsEnabled)}
                        label="Allow notifications"
                    />
                </div>
            </div>

            <div className="settings-card">
                <div className="settings-toggle-row">
                    <div>
                        <p className="settings-label">Focus Mode</p>
                        <p className="settings-hint">
                            {store.doNotDisturb
                                ? 'Active — notifications are silenced'
                                : 'Silence all notifications (Do Not Disturb)'}
                        </p>
                    </div>
                    <Toggle
                        on={store.doNotDisturb}
                        onClick={() => store.setDoNotDisturb(!store.doNotDisturb)}
                        label="Focus mode"
                    />
                </div>
            </div>

            <div className="settings-card">
                <div className="settings-toggle-row">
                    <div>
                        <p className="settings-label">Notification Sounds</p>
                        <p className="settings-hint">Play sounds for UI feedback and alerts</p>
                    </div>
                    <Toggle
                        on={store.soundEffectsEnabled}
                        onClick={() => store.setSoundEffectsEnabled(!store.soundEffectsEnabled)}
                        label="Sound effects"
                    />
                </div>
            </div>

            {store.doNotDisturb && (
                <div className="settings-card settings-card-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BellOff size={14} style={{ opacity: 0.6 }} />
                        <p className="settings-hint" style={{ margin: 0 }}>
                            Focus mode is active. Notifications are paused across the system.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function NetworkTab({ store }) {
    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Network</h2>
            <p className="settings-section-desc">Manage Wi-Fi, Bluetooth, and connectivity</p>

            <div className="settings-card">
                <div className="settings-toggle-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: store.wifiEnabled ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(0,0,0,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s',
                        }}>
                            <Wifi size={16} color={store.wifiEnabled ? 'white' : '#86868b'} />
                        </div>
                        <div>
                            <p className="settings-label">Wi-Fi</p>
                            <p className="settings-hint">
                                {store.wifiEnabled ? 'Connected to network' : 'Disconnected'}
                            </p>
                        </div>
                    </div>
                    <Toggle
                        on={store.wifiEnabled}
                        onClick={() => store.setWifiEnabled(!store.wifiEnabled)}
                        label="Wi-Fi"
                    />
                </div>
            </div>

            <div className="settings-card">
                <div className="settings-toggle-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: store.bluetoothEnabled ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(0,0,0,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s',
                        }}>
                            <Bluetooth size={16} color={store.bluetoothEnabled ? 'white' : '#86868b'} />
                        </div>
                        <div>
                            <p className="settings-label">Bluetooth</p>
                            <p className="settings-hint">
                                {store.bluetoothEnabled ? 'On — discoverable' : 'Off'}
                            </p>
                        </div>
                    </div>
                    <Toggle
                        on={store.bluetoothEnabled}
                        onClick={() => store.setBluetoothEnabled(!store.bluetoothEnabled)}
                        label="Bluetooth"
                    />
                </div>
            </div>

            <div className="settings-card settings-card-info">
                <p className="settings-hint" style={{ margin: 0 }}>
                    Network toggles sync with the quick access panel in the home notch and Control Center.
                </p>
            </div>
        </div>
    );
}

function PrivacyTab({ store }) {
    const [cleared, setCleared] = useState(false);

    const handleClear = useCallback(() => {
        store.clearAllData();
        setCleared(true);
        setTimeout(() => setCleared(false), 2000);
    }, [store]);

    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Privacy & Security</h2>
            <p className="settings-section-desc">Your data stays local and private</p>

            <div className="settings-card settings-card-info">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Shield size={16} style={{ opacity: 0.5, marginTop: 1, flexShrink: 0 }} />
                    <div>
                        <p className="settings-label" style={{ marginBottom: 4 }}>Data Storage</p>
                        <p className="settings-hint">
                            All preferences are stored locally in your browser's localStorage.
                            Nothing is sent to third parties or external servers.
                        </p>
                    </div>
                </div>
            </div>

            <div className="settings-card">
                <p className="settings-label">Reset Preferences</p>
                <p className="settings-hint">
                    Clear all stored settings and return to defaults. This cannot be undone.
                </p>
                <button
                    type="button"
                    className="settings-btn-danger"
                    onClick={handleClear}
                >
                    <Trash2 size={14} />
                    {cleared ? 'Cleared ✓' : 'Reset All Settings'}
                </button>
            </div>
        </div>
    );
}

function KeyboardTab() {
    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Keyboard Shortcuts</h2>
            <p className="settings-section-desc">Quick actions to navigate the desktop</p>

            <div className="settings-card">
                <ul className="settings-shortcut-list">
                    <li>
                        <span>Spotlight Search</span>
                        <div>
                            <kbd className="settings-kbd">⌘</kbd>{' '}
                            <kbd className="settings-kbd">Space</kbd>
                        </div>
                    </li>
                    <li>
                        <span>MAI Assistant</span>
                        <div>
                            <kbd className="settings-kbd">⌘</kbd>{' '}
                            <kbd className="settings-kbd">⇧</kbd>{' '}
                            <kbd className="settings-kbd">A</kbd>
                        </div>
                    </li>
                    <li>
                        <span>Quick Settings</span>
                        <span className="settings-hint">Click the notch on the desktop</span>
                    </li>
                    <li>
                        <span>Close Window</span>
                        <div>
                            <kbd className="settings-kbd">⌘</kbd>{' '}
                            <kbd className="settings-kbd">W</kbd>
                        </div>
                    </li>
                    <li>
                        <span>Minimize Window</span>
                        <div>
                            <kbd className="settings-kbd">⌘</kbd>{' '}
                            <kbd className="settings-kbd">M</kbd>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}

function AboutTab() {
    return (
        <div className="settings-section">
            <h2 className="settings-section-title">About</h2>

            <div className="settings-card" style={{ alignItems: 'center', textAlign: 'center', padding: '24px 18px' }}>
                <div className="settings-about-logo">💻</div>
                <p className="settings-about-name">Muragesh WebOS</p>
                <p className="settings-about-version">Version 2.0 — Portfolio Desktop Experience</p>
            </div>

            <div className="settings-card">
                <p className="settings-label">System Information</p>
                <dl className="settings-about-specs">
                    <dt>Platform</dt>
                    <dd>Web Browser</dd>
                    <dt>Engine</dt>
                    <dd>React + Zustand</dd>
                    <dt>UI Framework</dt>
                    <dd>Tailwind CSS + Vanilla</dd>
                    <dt>Animations</dt>
                    <dd>GSAP + CSS Transitions</dd>
                    <dt>Backend</dt>
                    <dd>Node.js + MongoDB</dd>
                </dl>
            </div>

            <div className="settings-card settings-card-info">
                <p className="settings-hint" style={{ margin: 0, textAlign: 'center' }}>
                    Built with ❤️ by Muragesh · All rights reserved
                </p>
            </div>
        </div>
    );
}

/* ────────── Main Settings Component ────────── */
const Settings = () => {
    const store = useSettingsStore();
    const { user, logout } = useAuthStore();
    const { window: windowsState, clearWindowData } = usewindowstore();
    const winData = windowsState?.settings?.data;
    const [activeTab, setActiveTab] = useState('General');

    useEffect(() => {
        if (winData?.tab && ALL_TABS.some((t) => t.id === winData.tab)) {
            setActiveTab(winData.tab);
            clearWindowData('settings');
        }
    }, [winData?.tab, clearWindowData]);

    const renderContent = () => {
        switch (activeTab) {
            case 'General':       return <GeneralTab store={store} user={user} logout={logout} />;
            case 'Appearance':    return <AppearanceTab store={store} />;
            case 'Sound':         return <SoundTab store={store} />;
            case 'Notifications': return <NotificationsTab store={store} />;
            case 'Network':       return <NetworkTab store={store} />;
            case 'Privacy':       return <PrivacyTab store={store} />;
            case 'Keyboard':      return <KeyboardTab />;
            case 'About':         return <AboutTab />;
            default:              return null;
        }
    };

    return (
        <div className={`settings-container ${store.reduceMotion ? 'settings-reduce-motion' : ''}`}>
            {/* Header */}
            <div id="window-header" className="settings-header">
                <div id="window-controls">
                    <WindowControls target="settings" />
                </div>
                <span className="settings-header-title">System Settings</span>
                <div style={{ width: 52 }} />
            </div>

            {/* Body */}
            <div className="settings-body">
                {/* Sidebar */}
                <aside
                    className="settings-sidebar"
                >
                    {SIDEBAR_SECTIONS.map((section) => (
                        <div key={section.label}>
                            <p className="settings-sidebar-label">{section.label}</p>
                            {section.items.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`settings-sidebar-item ${activeTab === tab.id ? 'settings-sidebar-active' : ''}`}
                                    >
                                        <span
                                            className="settings-sidebar-icon"
                                            style={{ background: tab.color }}
                                        >
                                            <Icon size={14} />
                                        </span>
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </aside>

                {/* Main */}
                <main
                    className="settings-main"
                    key={activeTab}
                >
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

const SettingsWindow = WindowWrapper(Settings, 'settings');

export default SettingsWindow;
