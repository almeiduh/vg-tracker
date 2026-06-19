// SteamGridDB API Service — fetches game cover art via Supabase Edge Function proxy.
// The edge function handles the API key server-side and avoids CORS issues.

import { supabase } from './supabase';

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

interface SgdbResponse<T> {
    success: boolean;
    data: T[];
}

/**
 * Searches for a game by name on SteamGridDB via the edge function proxy.
 * Returns the best-matching game entry or null.
 */
export async function searchSteamGridDb(query: string): Promise<SteamGridDbGame | null> {
    if (!query.trim()) return null;

    try {
        const { data, error } = await supabase.functions.invoke<SgdbResponse<SteamGridDbGame>>(
            'steamgriddb-proxy',
            { body: { action: 'search', query: query.trim() } }
        );
        if (error) return null;
        return data?.success && data.data.length > 0 ? data.data[0] : null;
    } catch {
        return null;
    }
}

/**
 * Fetches grid (cover) images for a SteamGridDB game ID via the edge function proxy.
 * Returns an array of grid objects (up to 5 by default).
 */
export async function getGameGrids(gameId: number): Promise<SteamGridDbGrid[]> {
    try {
        const { data, error } = await supabase.functions.invoke<SgdbResponse<SteamGridDbGrid>>(
            'steamgriddb-proxy',
            { body: { action: 'grids', gameId } }
        );
        if (error) return [];
        if (!data?.success || data.data.length === 0) return [];
        return data.data;
    } catch {
        return [];
    }
}

/**
 * One-shot: search for a game by title, fetch its best vertical cover.
 * Returns the cover URL or null if nothing found / API not configured.
 */
export async function getBestCoverUrl(title: string): Promise<string | null> {
    const game = await searchSteamGridDb(title);
    if (!game) return null;
    const grids = await getGameGrids(game.id);
    return grids.length > 0 ? grids[0].url : null;
}
