import React, { useState, useEffect } from 'react';
import useAuthStore from '@store/auth';
import { User, Mail, Lock, UserCircle, LogIn, UserPlus } from 'lucide-react';
import '@style/auth.css';

function LockScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        displayName: '',
        email: '',
        password: '',
    });

    const { register, login, isLoading, isError, message, isSuccess } = useAuthStore();

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
                                placeholder="What to call you (Nickname)"
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
            </form>

            <button
                onClick={() => { setIsLogin(!isLogin); setFormData({ fullName: '', displayName: '', email: '', password: '' }); }}
                className="auth-toggle-btn"
            >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
        </div>
    );
}

export default LockScreen;
