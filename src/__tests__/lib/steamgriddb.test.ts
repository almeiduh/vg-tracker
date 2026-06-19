// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchSteamGridDb, getGameGrids, getBestCoverUrl } from '../../lib/steamgriddb';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

describe('SteamGridDB Service - searchSteamGridDb', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null for empty query', async () => {
        const result = await searchSteamGridDb('');
        expect(result).toBeNull();
        expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('fetches and returns the first autocomplete result', async () => {
        const mockResponse = {
            success: true,
            data: [
                { id: 12345, name: 'The Legend of Zelda: Breath of the Wild', types: ['grid', 'hero', 'logo', 'icon'] },
            ],
        };

        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: mockResponse,
            error: null,
        });

        const result = await searchSteamGridDb('Zelda');

        expect(supabase.functions.invoke).toHaveBeenCalledWith('steamgriddb-proxy', {
            body: { action: 'search', query: 'Zelda' },
        });

        expect(result).not.toBeNull();
        expect(result!.id).toBe(12345);
        expect(result!.name).toBe('The Legend of Zelda: Breath of the Wild');
    });

    it('returns null if invoke returns an error', async () => {
        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: null,
            error: { message: 'Network error' },
        });

        const result = await searchSteamGridDb('Zelda');
        expect(result).toBeNull();
    });

    it('returns null if no results', async () => {
        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: { success: true, data: [] },
            error: null,
        });

        const result = await searchSteamGridDb('zzzznotagamexxxx');
        expect(result).toBeNull();
    });
});

describe('SteamGridDB Service - getGameGrids', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches grids and returns the array of grid objects', async () => {
        const mockResponse = {
            success: true,
            data: [
                { id: 1, url: 'https://cdn.example.com/cover1.jpg', thumb: 'https://cdn.example.com/thumb1.jpg', dimensions: '600x900' },
                { id: 2, url: 'https://cdn.example.com/cover2.jpg', thumb: 'https://cdn.example.com/thumb2.jpg', dimensions: '342x482' },
            ],
        };

        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: mockResponse,
            error: null,
        });

        const result = await getGameGrids(12345);

        expect(supabase.functions.invoke).toHaveBeenCalledWith('steamgriddb-proxy', {
            body: { action: 'grids', gameId: 12345 },
        });

        expect(result).toHaveLength(2);
        expect(result[0].url).toBe('https://cdn.example.com/cover1.jpg');
        expect(result[1].dimensions).toBe('342x482');
    });

    it('returns empty array if invoke fails', async () => {
        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: null,
            error: { message: 'Error' },
        });

        const result = await getGameGrids(12345);
        expect(result).toEqual([]);
    });

    it('returns empty array if no grids returned', async () => {
        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: { success: true, data: [] },
            error: null,
        });

        const result = await getGameGrids(12345);
        expect(result).toEqual([]);
    });
});

describe('SteamGridDB Service - getBestCoverUrl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('completes the full search -> grids flow and returns a cover URL', async () => {
        // First call: autocomplete search
        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: {
                success: true,
                data: [{ id: 42, name: 'Test Game', types: ['grid'] }],
            },
            error: null,
        });

        // Second call: grids fetch (now returns array of grids)
        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: {
                success: true,
                data: [
                    { id: 1, url: 'https://cdn.example.com/cover.jpg', thumb: 'https://cdn.example.com/thumb.jpg', dimensions: '600x900' },
                    { id: 2, url: 'https://cdn.example.com/cover2.jpg', thumb: 'https://cdn.example.com/thumb2.jpg', dimensions: '342x482' },
                ],
            },
            error: null,
        });

        const result = await getBestCoverUrl('Test Game');

        expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
        expect(result).toBe('https://cdn.example.com/cover.jpg');
    });

    it('returns null if search fails', async () => {
        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: null,
            error: { message: 'Error' },
        });

        const result = await getBestCoverUrl('Test Game');
        expect(result).toBeNull();
        expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    });
});
