import React, { useState, useEffect } from 'react';
import useAuthStore from '@store/auth';
import { User, Mail, Lock, UserCircle, LogIn, UserPlus, Sparkles } from 'lucide-react';
import '@style/auth.css';

function LockScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        displayName: '',
        email: '',
        password: '',
    });

    const { register, login, loginGuest, isLoading, isError, message, isSuccess, reset } = useAuthStore();

    useEffect(() => {
        reset();
    }, [isLogin, reset]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();

        if (isLogin) {
            login({ email: formData.email, password: formData.password });
        } else {
            register(formData);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-container">
                {/* User Avatar Circle */}
                <div className="auth-avatar-circle">
                    <User className="w-16 h-16 text-white/80" />
                </div>

                <h1 className="auth-title">
                    {isLogin ? "Welcome Back" : "Create Account"}
                </h1>

                <form onSubmit={onSubmit} className="auth-form">
                    {!isLogin && (
                        <>
                            <div className="auth-input-container">
                                <UserCircle className="auth-input-icon" />
                                <input
                                    type="text"
                                    name="fullName"
                                    placeholder="Full Name"
                                    value={formData.fullName}
                                    onChange={onChange}
                                    required
                                    className="auth-input"
                                />
                            </div>

                            <div className="auth-input-container">
                                <User className="auth-input-icon" />
                                <input
                                    type="text"
                                    name="displayName"
                                    placeholder="Nickname"
                                    value={formData.displayName}
                                    onChange={onChange}
                                    required
                                    className="auth-input"
                                />
                            </div>
                        </>
                    )}

                    <div className="auth-input-container">
                        <Mail className="auth-input-icon" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={onChange}
                            required
                            className="auth-input"
                        />
                    </div>

                    <div className="auth-input-container">
                        <Lock className="auth-input-icon" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={onChange}
                            required
                            className="auth-input"
                        />
                    </div>

                    {isError && (
                        <p className="auth-error-text">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="auth-submit-btn"
                    >
                        {isLoading ? (
                            <div className="auth-spinner"></div>
                        ) : isLogin ? (
                            <> <LogIn className="w-5 h-5" /> Sign In </>
                        ) : (
                            <> <UserPlus className="w-5 h-5" /> Sign Up </>
                        )}
                    </button>

                    <div className="flex items-center gap-2 my-1 w-full opacity-70">
                        <div className="h-px bg-white/30 flex-1"></div>
                        <span className="text-[11px] text-white/80 uppercase tracking-wider font-semibold">or explore directly</span>
                        <div className="h-px bg-white/30 flex-1"></div>
                    </div>

                    <button
                        type="button"
                        onClick={() => loginGuest()}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600/90 to-purple-600/90 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-sm flex items-center justify-center gap-2 border border-white/20 backdrop-blur-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        Explore as Guest (No Sign In Needed)
                    </button>
                </form>

                <button
                    onClick={() => { setIsLogin(!isLogin); setFormData({ fullName: '', displayName: '', email: '', password: '' }); reset(); }}
                    className="auth-toggle-btn"
                >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </button>
            </div>
        </div>
    );
}

export default LockScreen;
