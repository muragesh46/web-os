import { LogOut, Users } from "lucide-react";
import useAuthStore from "@store/auth";

function UserDropdown({ onClose, activeUser }) {
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        onClose();
    };

    return (
        <div className="absolute top-12 right-0 bg-white/70 backdrop-blur-3xl rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden min-w-[200px] z-[100001] animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5 p-1.5 border border-gray-200/50">
            <div className="flex flex-col gap-1">
                <div className="px-3 py-2 border-b border-gray-200/50 mb-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="font-bold text-gray-800 text-sm truncate">{activeUser}</p>
                </div>

                <button
                    onClick={handleLogout}
                    className="group flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-200/50 text-gray-700"
                >
                    <Users size={16} className="text-gray-500 group-hover:text-gray-700" />
                    <span>Switch Account...</span>
                </button>

                <button
                    onClick={handleLogout}
                    className="group flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-all duration-200 hover:bg-red-50 text-red-600"
                >
                    <LogOut size={16} className="text-red-500 group-hover:text-red-700" />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
}

export default UserDropdown;
