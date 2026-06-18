// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchSteamGridDb, getGameGrids, getBestCoverUrl } from '../../lib/steamgriddb';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

describe('SteamGridDB Service - searchSteamGridDb', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_STEAMGRIDDB_API_KEY', 'test_sgdb_key');
    });

    it('returns null if API key is not configured', async () => {
        vi.stubEnv('VITE_STEAMGRIDDB_API_KEY', '');
        const result = await searchSteamGridDb('Zelda');
        expect(result).toBeNull();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns null for empty query', async () => {
        const result = await searchSteamGridDb('');
        expect(result).toBeNull();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches and returns the first autocomplete result', async () => {
        const mockResponse = {
            success: true,
            data: [
                { id: 12345, name: 'The Legend of Zelda: Breath of the Wild', types: ['grid', 'hero', 'logo', 'icon'] },
                { id: 67890, name: 'The Legend of Zelda: Tears of the Kingdom', types: ['grid', 'hero', 'logo'] },
            ],
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await searchSteamGridDb('Zelda');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const requestUrl = mockFetch.mock.calls[0][0] as string;
        expect(requestUrl).toContain('Zelda');
        expect(mockFetch.mock.calls[0][1]?.headers).toEqual({ Authorization: 'Bearer test_sgdb_key' });

        expect(result).not.toBeNull();
        expect(result!.id).toBe(12345);
        expect(result!.name).toBe('The Legend of Zelda: Breath of the Wild');
    });

    it('returns null if API request fails', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false });

        const result = await searchSteamGridDb('Zelda');
        expect(result).toBeNull();
    });

    it('returns null if no results', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: [] }),
        });

        const result = await searchSteamGridDb('zzzznotagamexxxx');
        expect(result).toBeNull();
    });
});

describe('SteamGridDB Service - getGameGrids', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_STEAMGRIDDB_API_KEY', 'test_sgdb_key');
    });

    it('returns null if API key is not configured', async () => {
        vi.stubEnv('VITE_STEAMGRIDDB_API_KEY', '');
        const result = await getGameGrids(12345);
        expect(result).toBeNull();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches grids and returns the first cover URL', async () => {
        const mockResponse = {
            success: true,
            data: [
                { id: 1, url: 'https://cdn.example.com/cover1.jpg', thumb: 'https://cdn.example.com/thumb1.jpg', dimensions: '600x900' },
                { id: 2, url: 'https://cdn.example.com/cover2.jpg', thumb: 'https://cdn.example.com/thumb2.jpg', dimensions: '342x482' },
            ],
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await getGameGrids(12345);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const requestUrl = mockFetch.mock.calls[0][0] as string;
        expect(requestUrl).toContain('/grids/game/12345');
        expect(requestUrl).toContain('dimensions=600x900%2C342x482');

        expect(result).toBe('https://cdn.example.com/cover1.jpg');
    });

    it('returns null if API request fails', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false });

        const result = await getGameGrids(12345);
        expect(result).toBeNull();
    });

    it('returns null if no grids returned', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: [] }),
        });

        const result = await getGameGrids(12345);
        expect(result).toBeNull();
    });
});

describe('SteamGridDB Service - getBestCoverUrl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_STEAMGRIDDB_API_KEY', 'test_sgdb_key');
    });

    it('completes the full search -> grids flow and returns a cover URL', async () => {
        // First call: autocomplete search
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: [{ id: 42, name: 'Test Game', types: ['grid'] }],
            }),
        });

        // Second call: grids fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: [{ id: 1, url: 'https://cdn.example.com/cover.jpg', thumb: 'https://cdn.example.com/thumb.jpg', dimensions: '600x900' }],
            }),
        });

        const result = await getBestCoverUrl('Test Game');

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result).toBe('https://cdn.example.com/cover.jpg');
    });

    it('returns null if search fails', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false });

        const result = await getBestCoverUrl('Test Game');
        expect(result).toBeNull();
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});
