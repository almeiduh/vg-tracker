import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../../components/LoginPage';

// Mock the AuthContext
const mockSignIn = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        signIn: mockSignIn,
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
    }),
}));

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the login form', () => {
        render(<LoginPage />);

        expect(screen.getByText('VG Tracker')).toBeInTheDocument();
        expect(screen.getByText('Sign in to manage your game collection')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('allows typing email and password', () => {
        render(<LoginPage />);

        const emailInput = screen.getByLabelText('Email');
        const passwordInput = screen.getByLabelText('Password');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput).toHaveValue('test@example.com');
        expect(passwordInput).toHaveValue('password123');
    });

    it('calls signIn on form submission', async () => {
        mockSignIn.mockResolvedValue({ error: null });

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'diogo@example.com' }
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'diogo' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('diogo@example.com', 'diogo');
        });
    });

    it('displays error message on failed login', async () => {
        mockSignIn.mockResolvedValue({ error: 'Invalid login credentials' });

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'wrong@example.com' }
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'badpassword' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

        await waitFor(() => {
            expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
        });
    });

    it('shows loading state during submission', async () => {
        // Make signIn take time to resolve
        let resolveSignIn: ((value: any) => void) | null = null;
        mockSignIn.mockImplementation(() => new Promise(resolve => {
            resolveSignIn = resolve;
        }));

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

        // Button should show loading text and be disabled
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
        });

        // Resolve the sign in
        await waitFor(() => {
            resolveSignIn?.({ error: null });
        });
    });

    it('has unique IDs for all interactive elements', () => {
        render(<LoginPage />);

        expect(document.getElementById('login-email')).toBeInTheDocument();
        expect(document.getElementById('login-password')).toBeInTheDocument();
        expect(document.getElementById('login-submit')).toBeInTheDocument();
    });
});
