import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameProvider, useGames } from '../../contexts/GameContext';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn()
        })),
        removeChannel: vi.fn()
    }
}));

const mockGames = [
    { id: '1', title: 'Game 1', status: 'Playing', genres: ['RPG'], platform: 'PC' },
    { id: '2', title: 'Game 2', status: 'Backlog', genres: ['Action'], platform: 'PlayStation 5' }
];

describe('GameContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default successful fetch mock
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockGames, error: null })
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            }),
            delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            })
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider>{children}</GameProvider>
    );

    it('fetches games on mount', async () => {
        const { result } = renderHook(() => useGames(), { wrapper });

        // Initially loading
        expect(result.current.isLoading).toBe(true);

        // Wait for fetch to complete
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.games).toEqual(mockGames);
        expect(supabase.from).toHaveBeenCalledWith('games');
    });

    it('adds a game successfully', async () => {
        const { result } = renderHook(() => useGames(), { wrapper });

        await act(async () => {
            await result.current.addGame({
                title: 'New Game',
                status: 'Playing',
                genres: ['FPS'],
                platform: 'Xbox',
                rating: null,
                purchasing_price: null,
                selling_price: null,
                start_date: null,
                end_date: null,
                hours_played: null
            });
        });

        expect(supabase.from).toHaveBeenCalledWith('games');
    });

    it('updates a game successfully', async () => {
        const { result } = renderHook(() => useGames(), { wrapper });

        await act(async () => {
            await result.current.updateGame('1', { status: 'Played' });
        });

        expect(supabase.from).toHaveBeenCalledWith('games');
    });

    it('deletes a game successfully', async () => {
        const { result } = renderHook(() => useGames(), { wrapper });

        await act(async () => {
            await result.current.deleteGame('1');
        });

        expect(supabase.from).toHaveBeenCalledWith('games');
    });

    it('handles fetch errors', async () => {
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } })
            })
        });

        const { result } = renderHook(() => useGames(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.error).toBe('Network error');
        expect(result.current.games).toEqual([]);
    });
});
