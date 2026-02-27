// RAWG API Service

export interface RawgGameResult {
    id: number;
    name: string;
    background_image: string | null;
    genres: { id: number; name: string }[];
    platforms: { platform: { name: string } }[];
    playtime: number;
}

export interface RawgSearchResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: RawgGameResult[];
}

const RAWG_BASE_URL = 'https://api.rawg.io/api';

/**
 * Searches for games using the RAWG API.
 * 
 * @param query The search term
 * @param pageSize Number of results to return
 * @returns Array of game results
 */
export async function searchGames(query: string, pageSize: number = 5): Promise<RawgGameResult[]> {
    const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;

    if (!RAWG_API_KEY) {
        console.error('Missing RAWG API key! Make sure to set VITE_RAWG_API_KEY in .env.local');
        return [];
    }

    if (!query.trim()) {
        return [];
    }

    try {
        const url = new URL(`${RAWG_BASE_URL}/games`);
        url.searchParams.append('key', RAWG_API_KEY);
        url.searchParams.append('search', query.trim());
        url.searchParams.append('page_size', pageSize.toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`RAWG API error: ${response.status} ${response.statusText}`);
        }

        const data: RawgSearchResponse = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Failed to search games from RAWG API:', error);
        return [];
    }
}

/**
 * Fetches the global list of platforms from RAWG, using localStorage for a 24-hour cache.
 * 
 * @returns Array of platform names
 */
export async function getPlatforms(): Promise<string[]> {
    const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;
    if (!RAWG_API_KEY) return [];

    const CACHE_KEY = 'rawg_platforms_cache';
    const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

    // 1. Check Cache
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as { timestamp: number; data: string[] };
            if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                return parsed.data;
            }
        }
    } catch (e) {
        console.warn('Failed to read RAWG platforms cache', e);
    }

    // 2. Fetch from API if not cached or expired
    try {
        const url = new URL(`${RAWG_BASE_URL}/platforms`);
        url.searchParams.append('key', RAWG_API_KEY);
        // Page size 50 usually covers all major primary platforms
        url.searchParams.append('page_size', '50');

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`RAWG API error: ${response.status}`);
        }

        const data = await response.json();
        const platformsList = data.results.map((p: any) => p.name);

        // 3. Save to Cache
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: platformsList
            }));
        } catch (e) {
            console.warn('Failed to write RAWG platforms cache', e);
        }

        return platformsList;
    } catch (error) {
        console.error('Failed to fetch platforms from RAWG API:', error);
        return [];
    }
}

/**
 * Fetches the global list of genres from RAWG, using localStorage for a 24-hour cache.
 * 
 * @returns Array of genre names
 */
export async function getGenres(): Promise<string[]> {
    const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;
    if (!RAWG_API_KEY) return [];

    const CACHE_KEY = 'rawg_genres_cache';
    const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

    // 1. Check Cache
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as { timestamp: number; data: string[] };
            if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                return parsed.data;
            }
        }
    } catch (e) {
        console.warn('Failed to read RAWG genres cache', e);
    }

    // 2. Fetch from API if not cached or expired
    try {
        const url = new URL(`${RAWG_BASE_URL}/genres`);
        url.searchParams.append('key', RAWG_API_KEY);
        url.searchParams.append('page_size', '50');

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`RAWG API error: ${response.status}`);
        }

        const data = await response.json();
        const genresList = data.results.map((g: any) => g.name);

        // 3. Save to Cache
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: genresList
            }));
        } catch (e) {
            console.warn('Failed to write RAWG genres cache', e);
        }

        return genresList;
    } catch (error) {
        console.error('Failed to fetch genres from RAWG API:', error);
        return [];
    }
}
