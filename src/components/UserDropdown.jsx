import { Check, Lock, LogOut } from "lucide-react";

function UserDropdown({ onClose, onSwitchUser, activeUser }) {
    const users = ["Muragesh", "Marnani"];

    return (
        <div className="absolute top-12 right-0 bg-white/70 backdrop-blur-3xl rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden min-w-[240px] z-[100001] animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5 p-1.5">
            <div className="flex flex-col gap-0.5">
                {users.map((userName) => (
                    <button
                        key={userName}
                        onClick={() => {
                            onSwitchUser(userName);
                            onClose();
                        }}
                        className="group flex items-center justify-between w-full px-3 py-2 text-left text-sm rounded-lg transition-all duration-200 hover:bg-blue-500 hover:text-white"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${activeUser === userName ? 'bg-gray-200 text-gray-700' : 'bg-gray-200 text-gray-500'}`}>
                                {userName.charAt(0)}
                            </div>
                            <span className={`font-medium ${activeUser === userName ? 'text-gray-900 group-hover:text-white' : 'text-gray-700 group-hover:text-white'}`}>
                                {userName}
                            </span>
                        </div>
                        {activeUser === userName && (
                            <Check size={14} className="text-gray-500 group-hover:text-white" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default UserDropdown;
