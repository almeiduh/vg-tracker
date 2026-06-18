// SteamGridDB API Service — fetches game cover art (vertial box art)

export interface SteamGridDbGame {
    id: number;
    name: string;
    types: string[];
}

export interface SteamGridDbGrid {
    id: number;
    url: string;
    thumb: string;
    dimensions: string;
}

const SGDB_BASE_URL = 'https://www.steamgriddb.com/api/v2';

function getApiKey(): string | null {
    return import.meta.env.VITE_STEAMGRIDDB_API_KEY || null;
}

/**
 * Searches for a game by name on SteamGridDB.
 * Returns the best-matching game entry or null.
 */
export async function searchSteamGridDb(query: string): Promise<SteamGridDbGame | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    if (!query.trim()) return null;

    try {
        const url = new URL(`${SGDB_BASE_URL}/search/autocomplete/${encodeURIComponent(query.trim())}`);
        const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) return null;

        const data = await response.json() as { success: boolean; data: SteamGridDbGame[] };
        return data.success && data.data.length > 0 ? data.data[0] : null;
    } catch {
        return null;
    }
}

/**
 * Fetches grid (cover) images for a SteamGridDB game ID.
 * Filters to vertical cover dimensions (600x900 or 342x482).
 * Returns the best cover URL or null.
 */
export async function getGameGrids(gameId: number): Promise<string | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    try {
        const url = new URL(`${SGDB_BASE_URL}/grids/game/${gameId}`);
        url.searchParams.append('dimensions', '600x900,342x482');
        url.searchParams.append('limit', '5');

        const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) return null;

        const data = await response.json() as { success: boolean; data: SteamGridDbGrid[] };
        if (!data.success || data.data.length === 0) return null;

        return data.data[0].url;
    } catch {
        return null;
    }
}

/**
 * One-shot: search for a game by title, fetch its best vertical cover.
 * Returns the cover URL or null if nothing found / API not configured.
 */
export async function getBestCoverUrl(title: string): Promise<string | null> {
    const game = await searchSteamGridDb(title);
    if (!game) return null;
    return getGameGrids(game.id);
}
