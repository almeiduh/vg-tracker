import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DisableAccountModal } from './DisableAccountModal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import './ProfilePage.css';

export function ProfilePage() {
    const { user, updateEmail, updateName, updatePassword } = useAuth();

    const [email, setEmail] = useState(user?.email || '');
    const [name, setName] = useState(user?.user_metadata?.full_name || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        const { error } = await updateEmail(email);
        if (error) {
            setError(error);
        } else {
            setMessage('Please check both your old and new email addresses for confirmation links.');
        }
        setLoading(false);
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        const { error } = await updateName(name);
        if (error) {
            setError(error);
        } else {
            setMessage('Name updated successfully.');
        }
        setLoading(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setError('Please enter a new password.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setMessage('');
        setError('');
        const { error } = await updatePassword(password);
        if (error) {
            setError(error);
        } else {
            setMessage('Password updated successfully.');
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="profile-container">
            <h1 className="profile-title">Account Settings</h1>

            {message && <div className="profile-message success">{message}</div>}
            {error && <div className="profile-message error">{error}</div>}

            <div className="profile-section">
                <h2>Profile Information</h2>
                <form onSubmit={handleUpdateName} className="profile-form">
                    <Input
                        label="Full Name"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Button type="submit" isLoading={loading} variant="primary">
                        Update Name
                    </Button>
                </form>
            </div>

            <div className="profile-section">
                <h2>Email Address</h2>
                <form onSubmit={handleUpdateEmail} className="profile-form">
                    <Input
                        label="Email Address"
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button type="submit" isLoading={loading} variant="primary">
                        Update Email
                    </Button>
                </form>
            </div>

            <div className="profile-section">
                <h2>Change Password</h2>
                <form onSubmit={handleUpdatePassword} className="profile-form">
                    <Input
                        label="New Password"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                        required
                    />
                    <Button type="submit" isLoading={loading} variant="primary">
                        Update Password
                    </Button>
                </form>
            </div>

            <div className="profile-section danger-zone">
                <h2>Danger Zone</h2>
                <p>Once you disable your account, you will be logged out and unable to log back in without contacting support.</p>
                <Button
                    type="button"
                    variant="danger"
                    onClick={() => setIsDisableModalOpen(true)}
                >
                    Disable Account
                </Button>
            </div>

            <DisableAccountModal
                isOpen={isDisableModalOpen}
                onClose={() => setIsDisableModalOpen(false)}
            />
        </div>
    );
}
