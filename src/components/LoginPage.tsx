import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export function LoginPage() {
    const { signIn, signUp } = useAuth();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setIsSubmitting(true);

        if (isLoginMode) {
            const { error } = await signIn(email, password);
            if (error) {
                setError(error);
            }
        } else {
            const { error } = await signUp(email, password, name);
            if (error) {
                setError(error);
            } else {
                setSuccessMsg('Registration successful! Please check your email to verify your account.');
                setIsLoginMode(true);
                setPassword('');
            }
        }
        setIsSubmitting(false);
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setError(null);
        setSuccessMsg(null);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-container">
                        <img src="/logo.png" alt="VG Tracker Logo" className="app-logo" />
                        <span className="logo-text">VG Tracker</span>
                    </div>
                    <p className="login-subtitle">
                        {isLoginMode ? 'Sign in to manage your game collection' : 'Create an account to start tracking'}
                    </p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="login-error" id="login-error">{error}</div>}
                    {successMsg && <div className="login-success" id="login-success">{successMsg}</div>}

                    {!isLoginMode && (
                        <div className="login-field">
                            <label htmlFor="register-name">Name</label>
                            <input
                                id="register-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                required={!isLoginMode}
                                autoComplete="name"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="login-field">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        id="login-submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (isLoginMode ? 'Signing in…' : 'Registering…') : (isLoginMode ? 'Sign In' : 'Register')}
                    </button>

                    <div className="login-toggle">
                        <button type="button" onClick={toggleMode} className="login-toggle-btn">
                            {isLoginMode ? "Don't have an account? Register" : 'Already have an account? Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
