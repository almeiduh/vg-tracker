# VG Tracker — Agent Guide

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server at `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` — typecheck **then** build |
| `npm run lint` | ESLint (`.ts`/`.tsx` only) |
| `npm test` | Vitest watch mode |
| `npm test -- --run` | Vitest single run |

No formatter is configured.

## Environment

- Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAWG_API_KEY`.
- Env vars accessed via `import.meta.env.VITE_*`.
- Missing RAWG key → warns and returns `[]` (never throws).

## Architecture

- **Providers**: `AuthProvider` (outer) → `AppContent` → `GameProvider` (inner, only when authenticated). Components that need games need both.
- **State**: React Context only. Mutations go to Supabase; real-time channel `public:games` triggers `fetchGames()` — do **not** call `setGames()` directly after mutating.
- **Routing**: `BrowserRouter` inside `GameProvider`. Routes: `/` (Dashboard), `/timeline`, `/statistics`, `/profile`. Unauthenticated → `<LoginPage />`.
- **Stats**: `useGameStats(games, timeRange)` hook — all analytics computed in a single `useMemo`. Add new metrics inside that `useMemo`, not as separate hooks.

## Key Conventions

- **Auth ops** return `{ error: string | null }`, never throw.
- **Disabled-user guard**: check `session.user.user_metadata.disabled` in 3 places (initial session load, `onAuthStateChange`, `signIn`).
- **`user_metadata` field names**: `full_name`, `disabled`.
- **Inserts must include `user_id`** (RLS scopes queries automatically, but inserts need explicit user_id).
- **DB field names are snake_case** in both SQL and the TypeScript `Game` type (`purchasing_price`, `hours_played`, `cover_url`, etc.) — do not convert to camelCase.
- **RAWG cache**: `rawg_platforms_cache` and `rawg_genres_cache` in localStorage, valid 24h.
- **Styling**: Vanilla CSS only. No Tailwind, no CSS-in-JS. CSS variables in `index.css`.
- **TypeScript**: `strict: true`, `verbatimModuleSyntax: true` (import type required for type-only imports), `erasableSyntaxOnly: true` (no enums, no namespaces).
- `noUnusedLocals` and `noUnusedParameters` are enabled — remove unused code.

## Charts (Recharts)

- Always wrap in `<ResponsiveContainer width="100%" height="100%">`. Never hardcode chart dimensions.
- `linearGradient` `id` must be unique per chart instance.
- Parent `<div className="chart-wrapper chart-tall">` controls sizing.
- Charts live in `src/components/statistics/Statistics.tsx`.

## Tests

- All tests in `src/__tests__/`, mirroring `src/` structure.
- **Stack**: Vitest + jsdom + React Testing Library + jest-dom.
- **Supabase mock**: must support fluent chain (`.from() → .select() → .order()`, `.from() → .insert()`, `.from() → .update().eq()`, `.from() → .delete().eq()`) plus `.channel()` / `.removeChannel()`.
- **Auth mock**: Mock `AuthContext` as passthrough for GameContext/component tests.
- **RAWG mock**: Mock `globalThis.fetch` + in-memory `localStorage`.
- **Vite env vars**: `vi.stubEnv('VITE_RAWG_API_KEY', 'test_api_key')`.
- **Async flush**: `await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); })`.
- **Always evaluate test coverage** per iteration (`.agents/rules/tests.md`).

## Existing Agent Resources

Before starting work, check if one of these is relevant:

| Resource | When to load |
|---|---|
| `.agents/knowledge/INDEX.md` → supabase-patterns KI | Touching Supabase auth, realtime, or DB calls |
| `.agents/knowledge/INDEX.md` → recharts-patterns KI | Adding/modifying charts or `useGameStats` |
| `.agents/knowledge/INDEX.md` → vitest-rtl-patterns KI | Writing/updating tests |
| `.agents/skills/add-chart/SKILL.md` | Adding a new chart to Statistics |
| `.agents/skills/add-game-field/SKILL.md` | Adding a new field to the Game type |
| `.agents/skills/write-test/SKILL.md` | Writing tests |

## Project Boundaries

- Single package, not a monorepo.
- No CI/CD, no codegen, no DB migrations (Supabase schema managed externally).
- No state management library — just React Context + hooks.
