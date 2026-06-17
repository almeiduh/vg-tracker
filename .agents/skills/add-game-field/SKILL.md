---
name: add-game-field
description: |
  End-to-end runbook for adding a new field to the game data model in VG Tracker.
  Trigger when the user wants to add a new attribute to games (e.g. completion %, difficulty,
  notes, developer name). Covers the DB schema, TypeScript type, form, context, and tests.
---

# Add a New Game Field

Use this skill when adding a new attribute to the `Game` type and the `games` table.

## When to use

- User asks to add a new property to games (e.g. "add a notes field", "track completion percentage")
- User wants to capture a new dimension of game data

## Prerequisites

Read these KIs first:
- [supabase_patterns.md](../../knowledge/supabase-patterns/artifacts/supabase_patterns.md)
- [vitest_rtl_patterns.md](../../knowledge/vitest-rtl-patterns/artifacts/vitest_rtl_patterns.md)

---

## Step 1 — Add the column to the DB schema

Run a migration in Supabase (via the Supabase dashboard SQL editor or CLI):

```sql
ALTER TABLE games ADD COLUMN my_field text;        -- for text
ALTER TABLE games ADD COLUMN my_field integer;     -- for numbers
ALTER TABLE games ADD COLUMN my_field boolean DEFAULT false;
```

Ensure the column is nullable unless there's a strong reason for a default.

---

## Step 2 — Update the TypeScript `Game` type

File: `src/types/game.ts`

Add the new field following the existing naming convention (snake_case matching the DB column):

```ts
export interface Game {
    // ... existing fields
    my_field: string | null;   // nullable to match DB
}
```

Refer to the DB schema in `GEMINI.md` for the full type mapping table.

---

## Step 3 — Update the Game Form

File: `src/components/forms/` (AddGameForm or GameEditForm, whichever applies)

1. Add the field to the form's local state initialisation.
2. Add a controlled input element with a unique `id` attribute.
3. Include the field in the submit payload passed to `addGame` / `updateGame`.

```tsx
// State
const [myField, setMyField] = useState<string>('');

// Input
<label htmlFor="myField">My Field</label>
<input
    id="myField"
    type="text"
    value={myField}
    onChange={e => setMyField(e.target.value)}
/>

// Submit payload
await addGame({
    // ... existing fields
    my_field: myField || null,
});
```

---

## Step 4 — Verify context mutations pass the field

File: `src/contexts/GameContext.tsx`

The `addGame` and `updateGame` functions accept `Omit<Game, 'id' | 'created_at' | 'updated_at'>` and `Partial<Game>` respectively. No changes needed there — the new field flows through automatically as long as the type is updated.

> Verify `addGame` still includes `user_id: user?.id` in the insert payload (it must — RLS requires it).

---

## Step 5 — Update `GEMINI.md` DB schema table

File: `GEMINI.md` — update the **Database Schema Details** table to include the new field:

| Attribute | TypeScript Type | DB Column Name | Notes |
|---|---|---|---|
| My Field | `string \| null` | `my_field` | Description of the field |

---

## Step 6 — Update the KI if a new pattern is introduced

If the new field introduces a non-obvious mapping (e.g. a JSON column, an enum), document it in [supabase_patterns.md](../../knowledge/supabase-patterns/artifacts/supabase_patterns.md).

---

## Step 7 — Add/update tests

Using the `write-test` skill:
- Update `mockGames` fixture in any test file to include the new field (even as `null`)
- Add a form test asserting the new field is included in the submit payload
- Run `npm test -- --run` to confirm all tests pass
