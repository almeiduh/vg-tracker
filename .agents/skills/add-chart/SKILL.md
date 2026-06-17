---
name: add-chart
description: |
  Step-by-step runbook for adding a new chart to the Statistics view in VG Tracker.
  Trigger when the user asks to add a new metric, visualisation, or chart to Statistics.tsx.
---

# Add a Chart to Statistics

Use this skill whenever adding a new Recharts chart or metric to the Statistics view.

## When to use

- User asks to add a new chart, graph, or metric to the Statistics page
- User wants to visualise a new data dimension (e.g. by genre, platform, time)

## Prerequisites

Read the KI first:
- [recharts_patterns.md](../../knowledge/recharts-patterns/artifacts/recharts_patterns.md)
- [supabase_patterns.md](../../knowledge/supabase-patterns/artifacts/supabase_patterns.md) (if the metric needs new data from DB)

---

## Step 1 — Add the computation to `useGameStats`

File: `src/hooks/useGameStats.ts`

- All metric logic lives inside the **single existing `useMemo`** block. Do NOT create a new `useMemo`.
- Always compute from `filteredGames` (already time-range filtered), never the raw `games` array.
- Add the new value to the `return {}` object at the bottom of the hook.

```ts
// Inside the existing useMemo:
const myNewMetric = filteredGames
    .filter(game => ...)
    .map(game => ({ name: game.title, value: game.hours_played }))
    .sort((a, b) => b.value - a.value);

return {
    // ... existing fields
    myNewMetric,
};
```

---

## Step 2 — Choose the right chart type

| Data shape | Chart type | Recharts components |
|---|---|---|
| Values over time (date on X) | Area chart | `AreaChart`, `Area`, `XAxis`, `YAxis` |
| Ranked categories (horizontal) | Vertical bar | `BarChart layout="vertical"` |
| Count/histogram (category on X) | Horizontal bar | `BarChart` (default) |
| Part-of-whole / proportions | Donut | `PieChart`, `Pie` with `innerRadius={50} outerRadius={70}` |

---

## Step 3 — Add the chart card to `Statistics.tsx`

File: `src/components/statistics/Statistics.tsx`

1. Import any new Recharts components needed (add to the existing import line).
2. Add a `<div className="chart-card glass-panel">` block inside `<div className="stats-grid">`.
3. Wrap the chart in `<ResponsiveContainer width="100%" height="100%">` inside a `<div className="chart-wrapper chart-tall">`.
4. Apply the standard axis, tooltip, and color conventions from the KI.

```tsx
<div className="chart-card glass-panel">
    <h3>My New Chart</h3>
    <div className="chart-wrapper chart-tall">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.myNewMetric} layout="vertical"
                      margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af"
                       tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                    cursor={{ fill: '#374151', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none',
                                    borderRadius: '8px', color: '#f3f4f6' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                    {stats.myNewMetric.map((_, index) => (
                        <Cell key={`my-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
</div>
```

> **Cell key prefixes** must be unique across all charts on the page. Use a descriptive prefix for each chart (e.g., `genre-`, `platform-`, `my-metric-`).

---

## Step 4 — Update `GEMINI.md` if adding a new metric category

If the new chart introduces a new data concept not yet documented (e.g., a new field from the DB schema), update the relevant KI in `.agents/knowledge/` and reflect any changes in the `GEMINI.md` Knowledge Base table.

---

## Step 5 — Write a test (if logic is non-trivial)

If the metric involves non-obvious computation (e.g., date arithmetic, grouping, bucketing), add a test in `src/__tests__/` using the Vitest patterns in the KI. See the `write-test` skill.
