import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock Supabase client
const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('../../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: (...args: any[]) => mockGetSession(...args),
            signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
            signOut: (...args: any[]) => mockSignOut(...args),
            onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
        }
    }
}));

describe('AuthContext', () => {
    let authStateCallback: ((event: string, session: any) => void) | null = null;

    beforeEach(() => {
        vi.clearAllMocks();
        authStateCallback = null;

        mockGetSession.mockResolvedValue({
            data: { session: null }
        });

        mockOnAuthStateChange.mockImplementation((callback: any) => {
            authStateCallback = callback;
            return {
                data: {
                    subscription: {
                        unsubscribe: vi.fn()
                    }
                }
            };
        });

        mockSignOut.mockResolvedValue({ error: null });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );

    it('initializes with loading state and then resolves to no session', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        // Wait for session check to complete
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
    });

    it('restores an existing session on mount', async () => {
        const mockSession = {
            user: { id: 'user-123', email: 'test@example.com' },
            access_token: 'token-123'
        };

        mockGetSession.mockResolvedValue({
            data: { session: mockSession }
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.user).toEqual(mockSession.user);
        expect(result.current.session).toEqual(mockSession);
    });

    it('signs in with email and password', async () => {
        mockSignInWithPassword.mockResolvedValue({ error: null });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        let signInResult: { error: string | null } = { error: 'not called' };
        await act(async () => {
            signInResult = await result.current.signIn('test@example.com', 'password123');
        });

        expect(signInResult.error).toBeNull();
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        });
    });

    it('returns error message on failed sign in', async () => {
        mockSignInWithPassword.mockResolvedValue({
            error: { message: 'Invalid login credentials' }
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        let signInResult: { error: string | null } = { error: null };
        await act(async () => {
            signInResult = await result.current.signIn('wrong@example.com', 'badpassword');
        });

        expect(signInResult.error).toBe('Invalid login credentials');
    });

    it('signs out successfully', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.signOut();
        });

        expect(mockSignOut).toHaveBeenCalled();
    });

    it('updates user when auth state changes', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.user).toBeNull();

        // Simulate auth state change (e.g., user signs in)
        const newSession = {
            user: { id: 'user-456', email: 'user@example.com' },
            access_token: 'new-token'
        };

        await act(async () => {
            authStateCallback?.('SIGNED_IN', newSession);
        });

        expect(result.current.user).toEqual(newSession.user);
        expect(result.current.session).toEqual(newSession);
    });

    it('throws when useAuth is used outside AuthProvider', () => {
        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within an AuthProvider');
    });
});
