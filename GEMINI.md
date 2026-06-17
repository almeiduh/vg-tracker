# 🤖 Gemini Agent Guidelines & Workspace Context

This document is compiled for AI agents (Gemini, Antigravity, etc.) working on the **VG Tracker** codebase. It outlines repository architecture, data flow patterns, design paradigms, and guidelines for development.

---

## 📚 Knowledge Base (Wiki)

This repository contains curated Knowledge Items (KIs) in [`.agents/knowledge/`](./.agents/knowledge/). These are **LLM-readable wiki docs** documenting established patterns, conventions, and gotchas specific to this codebase.

**Workflow:**
1. **Read [`INDEX.md`](./.agents/knowledge/INDEX.md) first** — it has a one-paragraph summary of each KI with exact trigger conditions.
2. **Only load the specific KI artifact** that is relevant to your current task. Do not read KIs that don't apply.

> [!IMPORTANT]
> **Keep this index up to date.** When adding a new KI, add an entry to both `INDEX.md` and this table, and create a `metadata.json` in the new KI folder.

| Area | KI Artifact | When to read |
| :--- | :--- | :--- |
| Supabase auth & realtime | [supabase_patterns.md](./.agents/knowledge/supabase-patterns/artifacts/supabase_patterns.md) | Before touching `AuthContext`, `GameContext`, or any Supabase call |
| Recharts & Statistics | [recharts_patterns.md](./.agents/knowledge/recharts-patterns/artifacts/recharts_patterns.md) | Before adding/modifying charts in `Statistics.tsx` or `useGameStats.ts` |
| Vitest + RTL tests | [vitest_rtl_patterns.md](./.agents/knowledge/vitest-rtl-patterns/artifacts/vitest_rtl_patterns.md) | Before writing or updating any test in `src/__tests__/` |

---

## 🛠️ Skills (Runbooks)

Skills live in [`.agents/skills/`](./.agents/skills/). These are **step-by-step executable runbooks** — follow them when performing the listed workflows to ensure consistency.

> [!IMPORTANT]
> **Keep this index up to date.** When adding a new skill or updating an existing one, update this table.

| Task | Skill | When to use |
| :--- | :--- | :--- |
| Add a chart to Statistics | [add-chart](./.agents/skills/add-chart/SKILL.md) | Adding any new Recharts chart or metric to `Statistics.tsx` |
| Write or update a test | [write-test](./.agents/skills/write-test/SKILL.md) | Writing any new test or updating existing ones in `src/__tests__/` |
| Add a new game field | [add-game-field](./.agents/skills/add-game-field/SKILL.md) | Adding a new attribute to the `Game` type and `games` DB table |

---

## 🗺️ Codebase Overview

VG Tracker is a React 19 + TypeScript + Vite project that interfaces with Supabase (database & authentication) and RAWG API (gaming metadata lookup).

### Main Files & Components
- **Client Entry**: [main.tsx](./src/main.tsx) launches [App.tsx](./src/App.tsx) which sets up Routing (`BrowserRouter`, `Routes`) and Global Context Providers.
- **Views**:
  - [Dashboard.tsx](./src/components/Dashboard.tsx): Organizes active/backlog inventories and provides Excel export and CRUD action portals.
  - [Timeline.tsx](./src/components/Timeline.tsx): A flat chronological history list of gameplay states.
  - [Statistics.tsx](./src/components/statistics/Statistics.tsx): A grid-based reporting center mapping user gameplay metrics with Recharts.
  - [ProfilePage.tsx](./src/components/profile/ProfilePage.tsx): User settings management dashboard.

---

## ⚙️ Data Flow & State Management

### 1. Global Contexts
- **[AuthContext](./src/contexts/AuthContext.tsx)**:
  - Exposes authentication state (`user`, `session`, `isLoading`) and auth operations (`signIn`, `signUp`, `signOut`, `updateEmail`, `updatePassword`, `updateName`, `disableAccount`).
  - Checks if user is disabled (`disabled: true` in user metadata) and signs them out.
- **[GameContext](./src/contexts/GameContext.tsx)**:
  - Manages the state and database synchronization of games.
  - Listen to real-time postgres changes (`supabase.channel('public:games')`) on table `games` and fetches updates automatically when changes are made.
  - Exposes actions: `addGame`, `updateGame`, `deleteGame`, and `refreshGames`.

### 2. Analytics Derivation
- **[useGameStats](./src/hooks/useGameStats.ts)**:
  - All stats computations must reside in this custom hook.
  - Uses `useMemo` to filter and calculate metrics based on the active `timeRange` ('30days' | '1year' | 'all') to prevent redundant computations on component re-renders.

---

## 🔌 API & Integration Guidelines

### RAWG API Integration
- RAWG API queries live in [rawg.ts](./src/lib/rawg.ts).
- Always verify if cache queries are valid. Global assets like platforms and genres list must be cached in `localStorage` for **24 hours** to prevent rate-limiting:
  - Key: `rawg_platforms_cache`
  - Key: `rawg_genres_cache`
- Search lookup requests: Use `VITE_RAWG_API_KEY` loaded from Vite env vars. If missing, warn via console error rather than throwing, to support offline modes.

---

## 🎨 Styling & Component Rules

- **Vanilla CSS**: Do not inject ad-hoc utilities or Tailwind CSS unless explicitly instructed.
- **Design System**: Use predefined CSS variables in [index.css](./src/index.css) for backgrounds, glassmorphism templates, colors, typography, borders, and animations.
- **Platform Colors & Icons**: Use `getPlatformConfig()` from [platforms.ts](./src/lib/platforms.ts) to resolve brand colors and matching Lucide/React-Icons globally.

---

## 🧪 Testing Guidelines

> [!IMPORTANT]
> **For each iteration, evaluate the need to add or update additional tests.**

- All test suites reside in `src/__tests__/`.
- Run tests using `npm test -- --run` (or watch mode `npm test`).
- Setup mock modules:
  - Always mock `supabase` client methods (`from`, `select`, `insert`, `update`, `delete`, `channel`) in components/contexts tests.
  - Mock fetch calls to external APIs such as the RAWG platform.
- Environment: Built on top of **Vitest** + **jsdom** + **React Testing Library** + **jest-dom**.

---

## 🗄️ Database Schema Details

When modifying game details, map properties to the underlying SQL table properties exactly:

| Attribute | TypeScript Type | DB Column Name | Notes |
| :--- | :--- | :--- | :--- |
| UUID | `string` | `id` | Primary key, generated on insert |
| Title | `string` | `title` | Game Title |
| Genres | `string[]` | `genres` | Text array |
| Platform | `string` | `platform` | Game Platform |
| Rating | `number \| null` | `rating` | Scale from 1 to 10 |
| Status | `GameStatus` | `status` | `'Playing' \| 'On Hold' \| 'Backlog' \| 'Played'` |
| Format | `GameFormat` | `format` | `'Digital' \| 'Physical' \| 'Cloud'` |
| Purchase Price | `number \| null` | `purchasing_price` | Price in Euros |
| Sale Price | `number \| null` | `selling_price` | Price in Euros |
| Start Date | `string \| null` | `start_date` | YYYY-MM-DD Date string |
| End Date | `string \| null` | `end_date` | YYYY-MM-DD Date string |
| Playtime | `number \| null` | `hours_played` | Float / Integer |
| Box Art Link | `string \| null` | `cover_url` | RAWG cover art url |
| User ID | `string` | `user_id` | References auth.users(id) |
