import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface DisableAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DisableAccountModal({ isOpen, onClose }: DisableAccountModalProps) {
    const { disableAccount } = useAuth();
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleDisable = async () => {
        if (confirmation !== 'DISABLE') {
            setError('Please type DISABLE to confirm.');
            return;
        }

        setLoading(true);
        setError('');
        const { error: disableError } = await disableAccount();

        if (disableError) {
            setError(disableError);
            setLoading(false);
        } else {
            // Success: user is logged out automatically by AuthContext
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Disable Account"
        >
            <div className="profile-modal-content">
                <p className="danger-text">This action will disable your account immediately. You will be logged out, and you will not be able to log back in without contacting support.</p>
                <p>To confirm, type <strong>DISABLE</strong> below:</p>

                {error && <div className="profile-message error">{error}</div>}

                <Input
                    label="Confirmation"
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="DISABLE"
                    style={{ textTransform: 'uppercase' }}
                />

                <div className="modal-actions">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={handleDisable}
                        isLoading={loading}
                        disabled={confirmation !== 'DISABLE'}
                    >
                        Confirm Disable
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
