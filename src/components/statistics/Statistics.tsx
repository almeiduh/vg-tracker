import { useState } from 'react';
import { useGames } from '../../contexts/GameContext';
import { useGameStats } from '../../hooks/useGameStats';
import type { TimeRange } from '../../hooks/useGameStats';
import { getPlatformConfig } from '../../lib/platforms';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import './Statistics.css';

const COLORS = ['#8b5cf6', '#06b6d4', '#4ade80', '#eab308', '#f87171', '#ec4899', '#6366f1'];

// Red (1) → Yellow (5) → Green (10)
const RATING_COLORS: Record<string, string> = {
    '1': '#ef4444',
    '2': '#f97316',
    '3': '#f59e0b',
    '4': '#eab308',
    '5': '#facc15',
    '6': '#a3e635',
    '7': '#84cc16',
    '8': '#4ade80',
    '9': '#22c55e',
    '10': '#16a34a',
};

export function Statistics() {
    const { games } = useGames();
    const [timeRange, setTimeRange] = useState<TimeRange>('30days');
    const stats = useGameStats(games, timeRange);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    // Compute unique colors for platforms — shift lightness when multiple share the same base color
    const getPlatformChartColors = () => {
        const baseColors = stats.platformBreakdown.map(p => getPlatformConfig(p.name).color);
        const colorCount = new Map<string, number>();
        const colorIndex = new Map<string, number>();

        // Count occurrences of each base color
        baseColors.forEach(c => colorCount.set(c, (colorCount.get(c) || 0) + 1));

        return baseColors.map(color => {
            const count = colorCount.get(color) || 1;
            const idx = colorIndex.get(color) || 0;
            colorIndex.set(color, idx + 1);

            if (count <= 1) return color;

            // Parse hex and shift lightness: spread from -20% to +30% so each is distinct
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            const offset = -40 + (idx * 90) / (count - 1); // range: -40 to +50
            const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v + offset)));
            return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
        });
    };

    const platformColors = getPlatformChartColors();

    return (
        <div className="statistics-container">
            <div className="stats-header glass-panel">
                <div className="filter-group">
                    <label htmlFor="timeRange">Time Range</label>
                    <select
                        id="timeRange"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                    >
                        <option value="30days">Last 30 Days</option>
                        <option value="1year">This Year</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            <div className="stats-grid">
                {/* KPI Cards */}
                <div className="kpi-card glass-panel">
                    <h3>Money Spent</h3>
                    <div className="kpi-value">{formatCurrency(stats.totalSpent)}</div>
                </div>
                <div className="kpi-card glass-panel">
                    <h3>Money from Sells</h3>
                    <div className="kpi-value kpi-green">{formatCurrency(stats.totalSold)}</div>
                </div>
                <div className="kpi-card glass-panel">
                    <h3>Liquid Spent</h3>
                    <div className="kpi-value kpi-purple">{formatCurrency(stats.liquidSpent)}</div>
                </div>

                {/* Hours Played Area Chart */}
                <div className="chart-card glass-panel col-span-2 row-span-2">
                    <h3>Hours Played</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.hoursPlayedTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="hours" stroke="#06b6d4" fillOpacity={1} fill="url(#colorHours)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Genre Distribution Doughnut */}
                <div className="chart-card glass-panel row-span-2">
                    <h3>Genre Distribution</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.genreDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.genreDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Platform Breakdown */}
                <div className="chart-card glass-panel">
                    <h3>Platform Breakdown (Hours)</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.platformBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.platformBreakdown.map((_, index) => (
                                        <Cell key={`platform-${index}`} fill={platformColors[index]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Time To Finish */}
                <div className="chart-card glass-panel">
                    <h3>Time to Finish Games</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.timeToFinish.filter(d => d.count > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="range"
                                >
                                    {stats.timeToFinish.filter(d => d.count > 0).map((_, index) => (
                                        <Cell key={`time-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className="chart-card glass-panel">
                    <h3>Rating Distribution (Stars)</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.ratingDistribution.filter(d => d.count > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="rating"
                                >
                                    {stats.ratingDistribution.filter(d => d.count > 0).map((entry, index) => (
                                        <Cell key={`rating-${index}`} fill={RATING_COLORS[entry.rating] || '#9ca3af'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
