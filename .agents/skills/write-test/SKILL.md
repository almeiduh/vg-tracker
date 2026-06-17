---
name: write-test
description: |
  Runbook for writing Vitest + React Testing Library tests in VG Tracker.
  Trigger when the user asks to add, update, or fix a test, or when a new feature
  is implemented and test coverage should be evaluated.
---

# Write a Test in VG Tracker

Use this skill whenever writing or updating tests in `src/__tests__/`.

## When to use

- After implementing a new feature, hook, or component
- When asked to fix a failing test
- When asked to increase test coverage
- Per the project rule: **evaluate the need to add/update tests after every iteration**

## Prerequisites

Read the KI first:
- [vitest_rtl_patterns.md](../../knowledge/vitest-rtl-patterns/artifacts/vitest_rtl_patterns.md)

---

## Step 1 — Identify the test file location

Mirror the `src/` directory structure under `src/__tests__/`:

| Source file | Test file |
|---|---|
| `src/contexts/GameContext.tsx` | `src/__tests__/contexts/GameContext.test.tsx` |
| `src/components/Dashboard.tsx` | `src/__tests__/components/Dashboard.test.tsx` |
| `src/lib/rawg.ts` | `src/__tests__/lib/rawg.test.ts` |
| `src/hooks/useGameStats.ts` | `src/__tests__/hooks/useGameStats.test.ts` |

---

## Step 2 — Set up the right mocks for the file type

### Testing a Context (AuthContext / GameContext)

```ts
// Mock Supabase — always needed for context tests
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
        removeChannel: vi.fn(),
        auth: { /* only if also testing auth */ }
    }
}));

// Mock AuthContext when testing GameContext or components
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id', email: 'test@example.com' },
        isLoading: false,
        signOut: vi.fn(),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
```

Set up the fluent `supabase.from` chain in `beforeEach`:
```ts
beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockGames, error: null })
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    });
});
```

### Testing a lib/utility (rawg.ts, exportToExcel.ts)

```ts
// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

// Mock localStorage (for RAWG cache tests)
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key: string) => { delete store[key]; }
    };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Stub env vars
beforeEach(() => {
    vi.stubEnv('VITE_RAWG_API_KEY', 'test_api_key');
    localStorage.clear();
});
```

### Testing a Component

```ts
vi.mock('../../contexts/GameContext', () => ({
    useGames: () => ({ games: mockGames, addGame: vi.fn(), isLoading: false, error: null }),
}));
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'test-user-id' }, signOut: vi.fn() }),
}));
```

---

## Step 3 — Use the canonical `mockGames` fixture

Always use the full DB schema shape for mock data (snake_case field names):

```ts
const mockGames = [
    {
        id: '1', title: 'Game 1', status: 'Playing', format: 'Digital',
        genres: ['RPG'], platform: 'PC', rating: null,
        purchasing_price: null, selling_price: null,
        start_date: null, end_date: null, hours_played: null,
        cover_url: null, user_id: 'test-user-id',
        created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    },
];
```

---

## Step 4 — Flush async state with the `act` + timer pattern

Contexts that fetch on mount require flushing the microtask queue:

```ts
const { result } = renderHook(() => useGames(), { wrapper });

await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
});

expect(result.current.isLoading).toBe(false);
```

---

## Step 5 — Run the tests to verify

```sh
npm test -- --run
```

For a single file:
```sh
npm test -- --run src/__tests__/contexts/GameContext.test.tsx
```

All tests must pass before finishing. Fix any failures before handing back to the user.

---

## Step 6 — Update `GEMINI.md` if new patterns are established

If a new mock pattern, fixture, or test utility was introduced, add it to [vitest_rtl_patterns.md](../../knowledge/vitest-rtl-patterns/artifacts/vitest_rtl_patterns.md) and update the `GEMINI.md` Knowledge Base table if a new KI is added.
