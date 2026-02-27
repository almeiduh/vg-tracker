// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchGames, getPlatforms, getGenres } from '../../lib/rawg';

// Mock the global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

// Polyfill localStorage for Node environments
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: (key: string) => {
            delete store[key];
        }
    };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('RAWG Service - searchGames', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Since we are mocking import.meta.env, we need to ensure it has a value in tests
        vi.stubEnv('VITE_RAWG_API_KEY', 'test_api_key');
    });

    it('returns empty array if query is empty', async () => {
        const results = await searchGames('');
        expect(results).toEqual([]);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches games correctly and returns results', async () => {
        const mockResponse = {
            count: 1,
            next: null,
            previous: null,
            results: [
                {
                    id: 123,
                    name: 'The Legend of Zelda',
                    background_image: 'https://example.com/zelda.jpg',
                    genres: [{ id: 1, name: 'Adventure' }, { id: 2, name: 'Action' }],
                    playtime: 46
                }
            ]
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const results = await searchGames('Zelda');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const url = new URL(mockFetch.mock.calls[0][0]);
        expect(url.searchParams.get('search')).toBe('Zelda');
        expect(url.searchParams.get('key')).toBe('test_api_key');
        expect(url.searchParams.get('page_size')).toBe('5');

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('The Legend of Zelda');
        expect(results[0].genres).toHaveLength(2);
    });

    it('returns empty array if API request fails', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            statusText: 'Unauthorized'
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const results = await searchGames('Zelda');

        expect(results).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});

describe('RAWG Service - getPlatforms', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_RAWG_API_KEY', 'test_api_key');
        localStorage.clear();
    });

    it('fetches platforms correctly from API and caches them', async () => {
        const mockResponse = {
            results: [
                { id: 1, name: 'PC' },
                { id: 2, name: 'PlayStation 5' }
            ]
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const results = await getPlatforms();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const url = new URL(mockFetch.mock.calls[0][0]);
        expect(url.pathname).toBe('/api/platforms');
        expect(url.searchParams.get('key')).toBe('test_api_key');
        expect(url.searchParams.get('page_size')).toBe('50');

        expect(results).toHaveLength(2);
        expect(results).toEqual(['PC', 'PlayStation 5']);

        // Verify cache was set
        const cachedStr = localStorage.getItem('rawg_platforms_cache');
        expect(cachedStr).not.toBeNull();
        const cached = JSON.parse(cachedStr!);
        expect(cached.data).toEqual(['PC', 'PlayStation 5']);
    });

    it('returns cached platforms if available and not expired', async () => {
        // Pre-populate cache
        localStorage.setItem('rawg_platforms_cache', JSON.stringify({
            timestamp: Date.now(),
            data: ['Xbox Series X', 'Nintendo Switch']
        }));

        const results = await getPlatforms();

        // Should not call fetch
        expect(mockFetch).not.toHaveBeenCalled();
        expect(results).toEqual(['Xbox Series X', 'Nintendo Switch']);
    });

    it('ignores expired cache and fetches from API', async () => {
        // Pre-populate expired cache (25 hours ago)
        localStorage.setItem('rawg_platforms_cache', JSON.stringify({
            timestamp: Date.now() - (1000 * 60 * 60 * 25),
            data: ['Old Platform']
        }));

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [{ name: 'New Platform' }] }),
        });

        const results = await getPlatforms();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(results).toEqual(['New Platform']);
    });

    it('returns empty array if API request fails', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const results = await getPlatforms();

        expect(results).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});

describe('RAWG Service - getGenres', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_RAWG_API_KEY', 'test_api_key');
        localStorage.clear();
    });

    it('fetches genres correctly from API and caches them', async () => {
        const mockResponse = {
            results: [
                { id: 1, name: 'Action' },
                { id: 2, name: 'RPG' }
            ]
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const results = await getGenres();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const url = new URL(mockFetch.mock.calls[0][0]);
        expect(url.pathname).toBe('/api/genres');
        expect(url.searchParams.get('key')).toBe('test_api_key');
        expect(url.searchParams.get('page_size')).toBe('50');

        expect(results).toHaveLength(2);
        expect(results).toEqual(['Action', 'RPG']);

        // Verify cache was set
        const cachedStr = localStorage.getItem('rawg_genres_cache');
        expect(cachedStr).not.toBeNull();
        const cached = JSON.parse(cachedStr!);
        expect(cached.data).toEqual(['Action', 'RPG']);
    });

    it('returns cached genres if available and not expired', async () => {
        localStorage.setItem('rawg_genres_cache', JSON.stringify({
            timestamp: Date.now(),
            data: ['Adventure', 'Puzzle']
        }));

        const results = await getGenres();

        expect(mockFetch).not.toHaveBeenCalled();
        expect(results).toEqual(['Adventure', 'Puzzle']);
    });

    it('ignores expired cache and fetches from API', async () => {
        localStorage.setItem('rawg_genres_cache', JSON.stringify({
            timestamp: Date.now() - (1000 * 60 * 60 * 25),
            data: ['Old Genre']
        }));

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [{ name: 'New Genre' }] }),
        });

        const results = await getGenres();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(results).toEqual(['New Genre']);
    });

    it('returns empty array if API request fails', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const results = await getGenres();

        expect(results).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
