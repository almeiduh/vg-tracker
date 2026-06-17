# Vitest + React Testing Library Patterns — VG Tracker

This KI documents the established test patterns for this codebase. All tests live in `src/__tests__/` mirroring the `src/` structure.

**Test runner**: `npm test -- --run` (single run) | `npm test` (watch mode)
**Stack**: Vitest + jsdom + React Testing Library + jest-dom

---

## Supabase Client Mock

### Database Mock (`supabase.from`)

Used in: `GameContext.test.tsx`, component tests that trigger CRUD operations.

The mock must support the full fluent chain: `.from()` → `.select()` → `.order()` and `.from()` → `.insert()` / `.update().eq()` / `.delete().eq()`.

```ts
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn()
        })),
        removeChannel: vi.fn()
    }
}));
```

Set up the default successful mock inside `beforeEach` so each test starts fresh:

```ts
beforeEach(() => {
    vi.clearAllMocks();

    (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockGames, error: null })
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
        }),
        delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
        })
    });
});
```

> [!IMPORTANT]
> The chain `update().eq()` and `delete().eq()` each return a Promise. The mock must reflect this: `update` returns an object with an `eq` fn that returns the resolved promise — not `update` returning a promise directly.

### Auth Mock (`supabase.auth`)

Used in: `AuthContext.test.tsx`.

Use named mock functions so individual tests can override them:

```ts
const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('../../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: (...args: any[]) => mockGetSession(...args),
            signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
            signUp: (...args: any[]) => mockSignUp(...args),
            signOut: (...args: any[]) => mockSignOut(...args),
            onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
            updateUser: (...args: any[]) => mockUpdateUser(...args),
        }
    }
}));
```

#### Simulating Auth State Changes

Capture the `onAuthStateChange` callback in a variable so you can call it in tests to simulate auth events:

```ts
let authStateCallback: ((event: string, session: any) => void) | null = null;

beforeEach(() => {
    mockOnAuthStateChange.mockImplementation((callback: any) => {
        authStateCallback = callback;
        return {
            data: { subscription: { unsubscribe: vi.fn() } }
        };
    });
});

// In a test:
await act(async () => {
    authStateCallback?.('SIGNED_IN', newSession);
});
```

---

## Mocking AuthContext in Other Tests

When testing `GameContext` or components that depend on `useAuth`, mock the entire `AuthContext` module:

```ts
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { user: { id: 'test-user-id' } },
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
```

> [!NOTE]
> When mocking `AuthProvider`, render it as a passthrough (`=> children`) so the wrapper pattern still works in `renderHook`.

---

## Context Wrapper Pattern

For `renderHook` tests on context hooks, use the `wrapper` pattern:

```tsx
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameProvider>{children}</GameProvider>
);

const { result } = renderHook(() => useGames(), { wrapper });
```

For nested providers (e.g., a component that needs both `AuthProvider` and `GameProvider`), compose them:

```tsx
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
        <GameProvider>{children}</GameProvider>
    </AuthProvider>
);
```

---

## Async Flush Pattern

Context hooks that fetch on mount (`fetchGames`, `getSession`) are async. Flush the microtask queue after `renderHook` to let promises settle:

```ts
const { result } = renderHook(() => useGames(), { wrapper });

// Flush async operations
await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
});

// Now assertions are safe
expect(result.current.isLoading).toBe(false);
expect(result.current.games).toEqual(mockGames);
```

---

## RAWG API Mock

**File**: `src/__tests__/lib/rawg.test.ts`

### Mocking `fetch`

```ts
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;
```

Simulate a successful response:
```ts
mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
});
```

Simulate a failed response:
```ts
mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
    statusText: 'Unauthorized'
});
```

### Mocking `localStorage`

The `rawg.ts` module reads/writes `localStorage` for caching. In test environments, provide an in-memory implementation:

```ts
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
```

Clear it in `beforeEach` to prevent cache leakage between tests:
```ts
beforeEach(() => {
    localStorage.clear();
});
```

#### Pre-populating Cache (for cache-hit tests)

```ts
// Valid cache (not expired)
localStorage.setItem('rawg_platforms_cache', JSON.stringify({
    timestamp: Date.now(),
    data: ['Xbox Series X', 'Nintendo Switch']
}));

// Expired cache (25 hours ago)
localStorage.setItem('rawg_platforms_cache', JSON.stringify({
    timestamp: Date.now() - (1000 * 60 * 60 * 25),
    data: ['Old Platform']
}));
```

Cache keys:
- `rawg_platforms_cache`
- `rawg_genres_cache`

---

## Mocking Vite Environment Variables

Use `vi.stubEnv` to provide env vars in tests (do NOT read from `.env` files in tests):

```ts
beforeEach(() => {
    vi.stubEnv('VITE_RAWG_API_KEY', 'test_api_key');
});
```

This sets `import.meta.env.VITE_RAWG_API_KEY` for the duration of the test. Always call `vi.clearAllMocks()` or `vi.unstubAllEnvs()` in `afterEach` if needed.

---

## Spying on `console.error`

When testing error branches that call `console.error`, suppress the output and verify it was called:

```ts
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// ... trigger the error path

expect(consoleSpy).toHaveBeenCalled();
consoleSpy.mockRestore(); // ← always restore to avoid leaking into other tests
```

---

## Mock Game Data Shape

Use this canonical fixture for `mockGames` in tests — it matches the DB schema exactly:

```ts
const mockGames = [
    {
        id: '1',
        title: 'Game 1',
        status: 'Playing',
        format: 'Digital',
        genres: ['RPG'],
        platform: 'PC',
        rating: null,
        purchasing_price: null,
        selling_price: null,
        start_date: null,
        end_date: null,
        hours_played: null,
        cover_url: null,
        user_id: 'test-user-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
];
```

> [!WARNING]
> Do NOT use `snake_case` property names inconsistently. The DB uses `purchasing_price`, `selling_price`, `hours_played`, `cover_url`, `start_date`, `end_date`. Match these exactly or Supabase inserts will silently drop the fields.

---

## Component Test Pattern (RTL)

For component tests, mock both Supabase and all context dependencies, then `render` the component:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock contexts
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ ... }) }));
vi.mock('../../contexts/GameContext', () => ({ useGames: () => ({ games: mockGames, addGame: vi.fn() }) }));

it('renders game list', () => {
    render(<Dashboard />);
    expect(screen.getByText('Game 1')).toBeInTheDocument();
});
```

---

## jsdom Environment Directive

Tests that use browser APIs (`localStorage`, `URL`, DOM queries) should declare:

```ts
// @vitest-environment jsdom
```

as the very first line of the test file. Most test files in this project already target jsdom via `vitest.config.ts`, but add the directive explicitly if in doubt.
