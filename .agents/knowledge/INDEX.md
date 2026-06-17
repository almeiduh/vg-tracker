# Knowledge Base Index

This directory contains Knowledge Items (KIs) for VG Tracker. Each KI is a detailed reference doc. **Read this index first** and only load the specific KI artifact that is relevant to your current task.

---

## Available KIs

### `supabase-patterns` → [supabase_patterns.md](./supabase-patterns/artifacts/supabase_patterns.md)

**Read when:** touching anything involving Supabase — auth, database queries, or realtime.

**Covers:**
- How `AuthContext` initialises and cleans up auth subscriptions (`subscription.unsubscribe()`)
- The disabled-user guard (`user_metadata.disabled`) — where and why it must be checked in 3 places
- Auth operations return shape (`{ error: string | null }`) — never throw
- `user_metadata` field names: `full_name`, `disabled`
- Realtime channel lifecycle (`supabase.channel` / `supabase.removeChannel`) — different API from auth subscription
- Channel naming convention (`schema:table` → `'public:games'`)
- Why mutations don't call `setGames()` directly (relies on realtime refetch)
- RLS: queries are scoped automatically, but inserts **must** include `user_id`

**Do NOT read for:** anything unrelated to Supabase (UI, tests, charts).

---

### `recharts-patterns` → [recharts_patterns.md](./recharts-patterns/artifacts/recharts_patterns.md)

**Read when:** adding or modifying any chart in `Statistics.tsx` or adding a metric to `useGameStats.ts`.

**Covers:**
- Which chart type to use for which data shape (area, vertical bar, horizontal bar, donut)
- `ResponsiveContainer` is mandatory — never hardcode chart dimensions
- Tooltip dark-mode `contentStyle` (exact hex values to copy)
- `COLORS` palette and offset pattern; `RATING_COLORS` for rating bars
- `getPlatformConfig()` for brand colors on platform charts
- `Cell`-per-entry coloring pattern and unique `key` prefix rule
- `linearGradient` ID uniqueness warning (two charts can't share the same `id`)
- How to extend `useGameStats`: add inside the single `useMemo`, use `filteredGames`, add to return object
- Bar radius conventions; axis, legend, and CSS class patterns

**Do NOT read for:** anything unrelated to Statistics/charts.

---

### `vitest-rtl-patterns` → [vitest_rtl_patterns.md](./vitest-rtl-patterns/artifacts/vitest_rtl_patterns.md)

**Read when:** writing, updating, or fixing any test in `src/__tests__/`.

**Covers:**
- Full `supabase.from` fluent chain mock (including the `update().eq()` gotcha)
- Full `supabase.auth` named-mock pattern and how to capture `onAuthStateChange` callback
- How to mock `AuthContext` as a passthrough for GameContext/component tests
- `renderHook` wrapper pattern for context hooks
- Async flush: `await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); })`
- `globalThis.fetch` mock + in-memory `localStorage` mock for RAWG tests
- Cache pre-population patterns (valid cache vs expired cache)
- `vi.stubEnv('VITE_RAWG_API_KEY', 'test_api_key')` for Vite env vars
- `consoleSpy` pattern with `mockRestore()`
- Canonical `mockGames` fixture (snake_case DB field names)

**Do NOT read for:** anything unrelated to writing tests.

---

## Maintenance

When a new KI is added:
1. Add an entry to this `INDEX.md`
2. Update the Knowledge Base table in `GEMINI.md`
3. Add a `metadata.json` in the new KI folder
