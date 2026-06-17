# Recharts Patterns — VG Tracker

This KI documents the conventions for adding or modifying Recharts charts in the Statistics view. All charts live in [`src/components/statistics/Statistics.tsx`](../../../../personal/dev/vg-tracker/vg-tracker/src/components/statistics/Statistics.tsx) and consume data from [`src/hooks/useGameStats.ts`](../../../../personal/dev/vg-tracker/vg-tracker/src/hooks/useGameStats.ts).

---

## Chart Types in Use

| Chart Type | Used For | Recharts Component |
|---|---|---|
| Area chart | Hours played over time | `AreaChart` + `Area` |
| Vertical bar chart | Genre distribution, Avg playtime by genre, Top games, Avg rating by platform | `BarChart layout="vertical"` |
| Horizontal bar chart | Time to finish, Rating distribution, Days played distribution | `BarChart` (default) |
| Donut/Pie chart | Platform breakdown, Status distribution, Format distribution | `PieChart` + `Pie` with `innerRadius` |

---

## The ResponsiveContainer Rule

**Every** chart must be wrapped in `<ResponsiveContainer width="100%" height="100%">`. The parent `div.chart-wrapper` controls the actual dimensions via CSS classes (`chart-tall`, etc.).

```tsx
<div className="chart-wrapper chart-tall">
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats.genreDistribution} ...>
            ...
        </BarChart>
    </ResponsiveContainer>
</div>
```

> [!IMPORTANT]
> Never hardcode `width` or `height` on the chart component itself. This breaks responsiveness. Always use `ResponsiveContainer`.

---

## Tooltip Dark-Mode Style Convention

All tooltips use the same dark glassmorphism style. Copy this contentStyle exactly:

```tsx
<Tooltip
    cursor={{ fill: '#374151', opacity: 0.4 }}
    contentStyle={{
        backgroundColor: '#1f2937',
        border: 'none',
        borderRadius: '8px',
        color: '#f3f4f6'
    }}
/>
```

For charts without a cursor fill (e.g., AreaChart, PieChart), omit the `cursor` prop.

---

## Color Palettes

### General `COLORS` Array (for genre, status, format, etc.)

```ts
const COLORS = ['#8b5cf6', '#06b6d4', '#4ade80', '#eab308', '#f87171', '#ec4899', '#6366f1'];
```

Use modulo indexing to cycle: `COLORS[index % COLORS.length]`

To visually distinguish different chart sections, offset the starting index:
```ts
// e.g., start at offset 2 for "Time to Finish" to differ from "Genre Distribution"
fill={COLORS[(index + 2) % COLORS.length]}
```

### `RATING_COLORS` (for rating distribution bars)

Maps ratings 1–10 to a red→orange→yellow→green gradient:

```ts
const RATING_COLORS: Record<string, string> = {
    '1': '#b91c1c', '2': '#dc2626', '3': '#ef4444',
    '4': '#f97316', '5': '#fb923c', '6': '#f59e0b',
    '7': '#eab308', '8': '#84cc16', '9': '#22c55e', '10': '#16a34a',
};

// Usage in Cell:
<Cell key={`cell-${index}`} fill={RATING_COLORS[entry.rating] || '#9ca3af'} />
```

### Platform Colors (from `getPlatformConfig`)

For charts showing platform data, use brand colors from `getPlatformConfig()`:

```tsx
import { getPlatformConfig } from '../../lib/platforms';

// In a Bar/Cell:
<Cell key={`cell-${index}`} fill={getPlatformConfig(entry.name).color} />
```

For pie charts where multiple platforms share the same brand color, use the `getPlatformChartColors()` helper pattern from Statistics.tsx — it shifts RGB lightness to differentiate slices with the same base color.

---

## Cell-Per-Entry Coloring Pattern

For `BarChart` and `PieChart`, map a `<Cell>` for each data entry inside the `<Bar>` or `<Pie>`:

```tsx
<Bar dataKey="value" radius={[0, 4, 4, 0]}>
    {stats.genreDistribution.map((_, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
</Bar>
```

> [!WARNING]
> The `key` prop on `Cell` must be unique within its parent. Use a descriptive prefix (e.g., `cell-`, `platform-`, `status-`) plus the index to avoid React reconciliation issues when multiple charts render simultaneously.

---

## Axis Styling Convention

Axes use muted grey strokes and text. Apply consistently:

```tsx
<XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
<YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} allowDecimals={false} />
<CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
```

For vertical bar charts (layout="vertical"), swap axis types:
```tsx
<XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
<YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
```

For long labels on the Y-axis (e.g., game titles), add a `width` prop:
```tsx
<YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
```

---

## Area Chart with Gradient Fill

The Hours Played chart uses a gradient fill. Replicate this pattern for any new area charts:

```tsx
<AreaChart data={stats.hoursPlayedTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
    <defs>
        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
        </linearGradient>
    </defs>
    <Area type="monotone" dataKey="hours" stroke="#06b6d4" fillOpacity={1} fill="url(#colorHours)" />
</AreaChart>
```

> [!CAUTION]
> The `id` in `linearGradient` must be unique across the entire page — if two charts define `id="colorHours"`, the second will steal the first's gradient. Use unique IDs like `colorHoursPlayed`, `colorSpending`, etc.

---

## Bar Border Radius Convention

- **Horizontal bars** (category on Y-axis): `radius={[0, 4, 4, 0]}` (right corners rounded)
- **Vertical bars** (category on X-axis): `radius={[4, 4, 0, 0]}` (top corners rounded)

---

## Legend Styling

```tsx
<Legend wrapperStyle={{ fontSize: '11px' }} />
```

Only include `Legend` on pie/donut charts where color alone isn't enough to identify segments.

---

## `useGameStats` Hook — Adding New Metrics

All computed statistics live in [`src/hooks/useGameStats.ts`](../../../../personal/dev/vg-tracker/vg-tracker/src/hooks/useGameStats.ts). The hook:
1. Accepts `(games: Game[], timeRange: TimeRange)` where `TimeRange = '30days' | '1year' | 'all'`
2. Filters games by `timeRange` first, then computes all metrics
3. Wraps everything in a single `useMemo([games, timeRange])` for performance

**When adding a new metric:**
1. Add the computation inside the existing `useMemo` block — do NOT create a separate `useMemo`
2. Add the result to the returned object at the bottom
3. The filter logic at the top (`filteredGames`) applies the time range — use `filteredGames`, not the raw `games` array

```ts
// ✅ Correct — compute inside the existing useMemo
const myNewMetric = filteredGames.filter(...).map(...);

return {
    // ... existing metrics
    myNewMetric,
};
```

---

## Donut Chart Structure

All pie charts are rendered as donuts (inner + outer radius). Use these standard values:

```tsx
<Pie
    data={stats.platformBreakdown}
    cx="50%"
    cy="50%"
    innerRadius={50}
    outerRadius={70}
    paddingAngle={5}
    dataKey="value"
>
```

---

## Chart Card CSS Classes

Wrap each chart in the `glass-panel` and `chart-card` classes. Use `col-span-2` and `row-span-2` for larger charts:

```tsx
<div className="chart-card glass-panel col-span-2 row-span-2">
    <h3>Hours Played</h3>
    <div className="chart-wrapper chart-tall">
        ...
    </div>
</div>
```
