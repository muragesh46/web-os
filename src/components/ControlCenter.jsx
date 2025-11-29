import { Wifi, Bluetooth, Moon, Airplay, Monitor, Sun, Volume2, Music } from "lucide-react";
import { useState } from "react";

function ControlCenter() {
    const [controls, setControls] = useState({
        wifi: true,
        bluetooth: true,
        airdrop: true,
        darkMode: false,
        doNotDisturb: false,
        keyboardBrightness: 50,
        displayBrightness: 85,
        sound: 60,
        nowPlaying: {
            title: "Not Playing",
            artist: "Music",
            isPlaying: false
        }
    });

    // Safe state update handler
    const toggleControl = (key) => {
        try {
            setControls(prev => ({ ...prev, [key]: !prev[key] }));
        } catch (error) {
            console.error(`Error toggling control ${key}:`, error);
        }
    };

    const handleSliderChange = (key, value) => {
        try {
            setControls(prev => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error(`Error updating slider ${key}:`, error);
        }
    };

    return (
        <div
            className="absolute top-10 right-2 w-80 sm:w-96 bg-[#e6e6e6]/80 dark:bg-[#1e1e1e]/80 backdrop-blur-3xl rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_50px_rgba(0,0,0,0.3)] p-3 z-[100001] animate-in fade-in slide-in-from-top-2 duration-300 text-black dark:text-white select-none"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="grid grid-cols-4 gap-3">

                {/* Connectivity Block (2x2) */}
                <div className="col-span-2 row-span-2 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-xl p-3 flex flex-col justify-between shadow-sm transition-all duration-200 hover:bg-white/60 dark:hover:bg-black/30">
                    <div className="flex flex-col gap-3">
                        <ConnectivityToggle
                            icon={Wifi}
                            label="Wi-Fi"
                            subLabel={controls.wifi ? "Home_Network" : "Off"}
                            active={controls.wifi}
                            onClick={() => toggleControl('wifi')}
                            color="bg-[#007AFF]"
                        />
                        <ConnectivityToggle
                            icon={Bluetooth}
                            label="Bluetooth"
                            subLabel={controls.bluetooth ? "On" : "Off"}
                            active={controls.bluetooth}
                            onClick={() => toggleControl('bluetooth')}
                            color="bg-[#007AFF]"
                        />
                        <ConnectivityToggle
                            icon={Airplay}
                            label="AirDrop"
                            subLabel={controls.airdrop ? "Contacts Only" : "Off"}
                            active={controls.airdrop}
                            onClick={() => toggleControl('airdrop')}
                            color="bg-[#007AFF]"
                        />
                    </div>
                </div>

                {/* Do Not Disturb (2x1) */}
                <div
                    className="col-span-2 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 shadow-sm cursor-pointer transition-all duration-200 hover:bg-white/60 dark:hover:bg-black/30 active:scale-[0.98]"
                    onClick={() => toggleControl('doNotDisturb')}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${controls.doNotDisturb ? "bg-[#5E5CE6] text-white" : "bg-gray-200/80 dark:bg-white/10 text-gray-500 dark:text-gray-300"}`}>
                        <Moon size={16} fill={controls.doNotDisturb ? "currentColor" : "none"} />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold">Do Not Disturb</span>
                        <span className="text-[11px] opacity-60">{controls.doNotDisturb ? "On" : "Off"}</span>
                    </div>
                </div>

                {/* Screen Mirroring (2x1) */}
                <div className="col-span-2 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 shadow-sm cursor-pointer transition-all duration-200 hover:bg-white/60 dark:hover:bg-black/30 active:scale-[0.98]">
                    <div className="w-8 h-8 rounded-full bg-gray-200/80 dark:bg-white/10 text-gray-500 dark:text-gray-300 flex items-center justify-center">
                        <Monitor size={16} />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold">Screen Mirroring</span>
                    </div>
                </div>

                {/* Display Brightness (4x1) */}
                <div className="col-span-4 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                    <span className="text-xs font-medium opacity-70 ml-1">Display</span>
                    <div className="relative h-7 w-full bg-gray-200/50 dark:bg-white/10 rounded-full overflow-hidden group">
                        <div
                            className="absolute top-0 left-0 h-full bg-white transition-all duration-75"
                            style={{ width: `${controls.displayBrightness}%` }}
                        />
                        <div className="absolute inset-0 flex items-center px-2">
                            <Sun size={14} className="text-gray-500 dark:text-gray-300 z-10" />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={controls.displayBrightness}
                            onChange={(e) => handleSliderChange('displayBrightness', parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Sound (4x1) */}
                <div className="col-span-4 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                    <span className="text-xs font-medium opacity-70 ml-1">Sound</span>
                    <div className="relative h-7 w-full bg-gray-200/50 dark:bg-white/10 rounded-full overflow-hidden group">
                        <div
                            className="absolute top-0 left-0 h-full bg-white transition-all duration-75"
                            style={{ width: `${controls.sound}%` }}
                        />
                        <div className="absolute inset-0 flex items-center px-2">
                            <Volume2 size={14} className="text-gray-500 dark:text-gray-300 z-10" />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={controls.sound}
                            onChange={(e) => handleSliderChange('sound', parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Media Player (4x2) - Optional addition for "premium" feel */}
                <div className="col-span-4 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-xl p-3 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-white/10 rounded-lg flex items-center justify-center">
                        <Music size={24} className="opacity-50" />
                    </div>
                    <div className="flex flex-col flex-1">
                        <span className="text-sm font-semibold">{controls.nowPlaying.title}</span>
                        <span className="text-xs opacity-60">{controls.nowPlaying.artist}</span>
                    </div>
                    <div className="flex gap-2">
                        {/* Play/Pause placeholder */}
                        <div className="w-8 h-8 flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-black dark:border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function ConnectivityToggle({ icon: Icon, label, subLabel, active, onClick, color }) {
    return (
        <div className="flex items-center gap-3 group cursor-pointer" onClick={onClick}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${active ? `${color} text-white` : 'bg-gray-200/80 dark:bg-white/10 text-gray-500 dark:text-gray-300 group-hover:bg-gray-300 dark:group-hover:bg-white/20'}`}>
                {Icon && <Icon size={16} />}
            </div>
            <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-[11px] opacity-60">{subLabel}</span>
            </div>
        </div>
    );
}

export default ControlCenter;
