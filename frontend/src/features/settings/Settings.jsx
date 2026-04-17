import React, { useState } from 'react';
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import WindowControls from "@components/common/WindowControl.jsx";
import useSettingsStore, { wallpapers } from "@store/settings";
import { User, Image, Bell, Sun, Moon, Monitor, CreditCard, Shield, HelpCircle } from "lucide-react";

const Settings = () => {
    const {
        wallpaper,
        setWallpaper,
        theme,
        setTheme,
        notificationsEnabled,
        setNotificationsEnabled,
        displayName,
        setDisplayName
    } = useSettingsStore();

    const [activeTab, setActiveTab] = useState('General');

    const tabs = [
        { id: 'General', icon: User, label: 'General' },
        { id: 'Appearance', icon: Monitor, label: 'Appearance' },
        { id: 'Notifications', icon: Bell, label: 'Notifications' },
        { id: 'Privacy', icon: Shield, label: 'Privacy' },
        { id: 'Payments', icon: CreditCard, label: 'Payments' },
        { id: 'Help', icon: HelpCircle, label: 'Help' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'General':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <section>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">User Profile</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                                    {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-gray-100 outline-none"
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>
                        </section>
                        <hr className="border-gray-200 dark:border-gray-800" />
                        <section>
                            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Language & Region</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">English (United States)</p>
                        </section>
                    </div>
                );
            case 'Appearance':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <section>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Theme</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800'}`}
                                >
                                    <Sun className={`mx-auto mb-2 ${theme === 'light' ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <span className="block text-sm font-medium dark:text-gray-200">Light</span>
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800'}`}
                                >
                                    <Moon className={`mx-auto mb-2 ${theme === 'dark' ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <span className="block text-sm font-medium dark:text-gray-200">Dark</span>
                                </button>
                            </div>
                        </section>
                        <section>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Wallpaper</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {wallpapers.map((wp, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setWallpaper(wp)}
                                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${wallpaper === wp ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : 'border-transparent'}`}
                                    >
                                        <img src={wp} alt={`Wallpaper ${idx + 1}`} className="w-full h-full object-cover" />
                                        {wallpaper === wp && (
                                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                <div className="bg-blue-500 rounded-full p-1 text-white">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                );
            case 'Notifications':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <section className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Allow Notifications</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts and updates.</p>
                            </div>
                            <button
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notificationsEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </section>
                        <hr className="border-gray-200 dark:border-gray-800" />
                        <section className="opacity-50">
                            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Sound Effects</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-sm dark:text-gray-300">Play sound for notifications</span>
                                <input type="checkbox" disabled checked className="rounded border-gray-300 dark:border-gray-700 text-blue-500 focus:ring-blue-500 h-4 w-4" />
                            </div>
                        </section>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <HelpCircle className="w-12 h-12 text-gray-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{activeTab} settings coming soon</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">We're working on making this feature available in a future update.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div id="settings" className="w-[50rem] h-[35rem] bg-white dark:bg-gray-900 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
            <div id="window-header" className="dark:bg-gray-800 dark:border-gray-700">
                <div id="window-controls">
                    <WindowControls target="settings" />
                </div>
                <h2 className="dark:text-gray-100">Settings</h2>
                <div className="w-16"></div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 p-4 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-white dark:bg-gray-900">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

const SettingsWindow = WindowWrapper(Settings, "settings");

export default SettingsWindow;
