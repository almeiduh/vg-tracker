// Supabase Edge Function — proxies SteamGridDB API calls so the frontend
// avoids CORS issues and the API key stays server-side.

const SGDB_BASE = 'https://www.steamgriddb.com/api/v2';

Deno.serve(async (req: Request) => {
    const origin = req.headers.get('origin') || '*';

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders(origin),
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
    }

    const apiKey = Deno.env.get('STEAMGRIDDB_API_KEY');
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'SteamGridDB API key not configured' }), {
            status: 500,
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
    }

    try {
        const { action, query, gameId } = await req.json();

        let sgdbUrl: URL;
        if (action === 'search') {
            if (!query) throw new Error('query is required for search action');
            sgdbUrl = new URL(`${SGDB_BASE}/search/autocomplete/${encodeURIComponent(query)}`);
        } else if (action === 'grids') {
            if (!gameId) throw new Error('gameId is required for grids action');
            sgdbUrl = new URL(`${SGDB_BASE}/grids/game/${gameId}`);
            sgdbUrl.searchParams.append('dimensions', '600x900,342x482');
            sgdbUrl.searchParams.append('limit', '5');
        } else {
            throw new Error('Invalid action — use "search" or "grids"');
        }

        const sgdbResponse = await fetch(sgdbUrl.toString(), {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!sgdbResponse.ok) {
            const text = await sgdbResponse.text();
            return new Response(JSON.stringify({ error: `SteamGridDB error: ${sgdbResponse.status}`, detail: text }), {
                status: sgdbResponse.status,
                headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
            });
        }

        const data = await sgdbResponse.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
            status: 400,
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
    }
});

function corsHeaders(origin: string): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
}
