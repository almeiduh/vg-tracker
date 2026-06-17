# Supabase Patterns — VG Tracker

This KI documents the established patterns for working with Supabase auth and realtime in this codebase. Always follow these patterns when adding new features that touch auth or database state.

---

## Auth Client Import

The Supabase client is a singleton at `src/lib/supabase.ts`. Always import from there — never create a new client inline.

```ts
import { supabase } from '../lib/supabase';
```

---

## AuthContext Patterns

**File**: [`src/contexts/AuthContext.tsx`](../../../../personal/dev/vg-tracker/vg-tracker/src/contexts/AuthContext.tsx)

### Session Initialisation

On mount, call `supabase.auth.getSession()` to restore any existing session, then set up `onAuthStateChange` for subsequent changes. Both paths share the same disabled-user guard (see below).

```ts
useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        // ... handle session
        setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
            // ... handle session
            setIsLoading(false);
        }
    );

    return () => {
        subscription.unsubscribe(); // ← CRITICAL: always unsubscribe on unmount
    };
}, []);
```

> [!IMPORTANT]
> Always call `subscription.unsubscribe()` in the `useEffect` cleanup. Omitting this causes duplicate auth state handlers to accumulate across hot reloads.

### Disabled-User Guard

This project implements a soft account-disable mechanism via `user_metadata.disabled = true`. The guard must be checked in **three** places:
1. `getSession()` result on initial load
2. `onAuthStateChange` callback
3. After `signInWithPassword` returns

```ts
if (session?.user?.user_metadata?.disabled) {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    return { error: "Your account is disabled. In order to be re-enabled, please contact support." };
}
```

> [!CAUTION]
> Do NOT merge these three guard points into a single helper without understanding the async flow — they run in different contexts (sync resolve vs async callback vs user action).

### Auth Operations Return Shape

All auth operations return `{ error: string | null }` — never throw. This is a project-wide convention.

```ts
// ✅ Correct pattern
const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
};

// ❌ Do NOT throw from auth operations
```

### User Metadata Fields

| Field | Key in `user_metadata` | Type | Set by |
|---|---|---|---|
| Display name | `full_name` | `string` | `signUp` options, `updateName` |
| Account disabled flag | `disabled` | `boolean` | `disableAccount` |

Update metadata with:
```ts
await supabase.auth.updateUser({ data: { full_name: name } });
await supabase.auth.updateUser({ data: { disabled: true } });
```

---

## GameContext & Realtime Patterns

**File**: [`src/contexts/GameContext.tsx`](../../../../personal/dev/vg-tracker/vg-tracker/src/contexts/GameContext.tsx)

### Realtime Subscription Lifecycle

```ts
useEffect(() => {
    fetchGames();

    const subscription = supabase
        .channel('public:games')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, payload => {
            fetchGames(); // re-fetch on any change
        })
        .subscribe();

    return () => {
        supabase.removeChannel(subscription); // ← use removeChannel, NOT subscription.unsubscribe()
    };
}, []);
```

> [!WARNING]
> Auth subscriptions use `subscription.unsubscribe()`. Realtime channel subscriptions use `supabase.removeChannel(subscription)`. These are **different APIs** — do not mix them up.

### Channel Naming Convention

The channel for the `games` table is named `'public:games'`. Use `schema:table` format for all new realtime channels.

### Mutation Strategy

Mutations (`insert`, `update`, `delete`) do NOT manually update local state. They rely on the realtime subscription to trigger `fetchGames()` after the DB write confirms. This keeps state consistent.

```ts
const addGame = async (gameData) => {
    const { error } = await supabase.from('games').insert([{ ...gameData, user_id: user?.id }]);
    if (error) throw error;
    // No setGames() call here — realtime subscription handles the refetch
};
```

> [!IMPORTANT]
> Always include `user_id: user?.id` when inserting a new game. RLS policies on the `games` table enforce row ownership by `user_id`.

### RLS-Aware Queries

The `games` table is scoped by RLS to the authenticated user. Queries do NOT need an explicit `.eq('user_id', user.id)` filter — RLS handles it. However, inserts **must** include `user_id` in the payload for the policy to recognise ownership.

```ts
// ✅ Fetch — RLS applies automatically
supabase.from('games').select('*').order('created_at', { ascending: false });

// ✅ Insert — must include user_id
supabase.from('games').insert([{ ...gameData, user_id: user?.id }]);

// ✅ Update — RLS scopes to current user's rows
supabase.from('games').update(updates).eq('id', id);

// ✅ Delete — RLS scopes to current user's rows  
supabase.from('games').delete().eq('id', id);
```

### Error Handling Convention

All context mutations catch errors and set `error` state via `setError`, then re-throw for the calling component to handle (e.g. show a toast).

```ts
try {
    setError(null);
    const { error } = await supabase.from('games').insert([payload]);
    if (error) throw error;
} catch (err: any) {
    setError(err.message || 'Failed to add game');
    throw err; // ← re-throw so UI layer can respond
}
```

---

## Hook Access Patterns

```ts
// In any component inside AuthProvider:
const { user, session, isLoading, signIn, signOut } = useAuth();

// In any component inside GameProvider (which must be inside AuthProvider):
const { games, isLoading, addGame, updateGame, deleteGame } = useGames();
```

Both hooks throw if used outside their provider — this is intentional for fast failure during development.
