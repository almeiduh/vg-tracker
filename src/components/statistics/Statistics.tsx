import { useState, useCallback, useEffect } from 'react';
import { useGames } from '../../contexts/GameContext';
import { useGameStats } from '../../hooks/useGameStats';
import type { TimeRange, TimelineMonth } from '../../hooks/useGameStats';
import { getPlatformConfig } from '../../lib/platforms';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import './Statistics.css';

const COLORS = ['#de4364', '#00b0f4', '#00d451', '#eaea22', '#de4364', '#7c5cbf', '#e86a85'];

// Red (1) → Orange (4) → Yellow (7) → Green (10)
const RATING_COLORS: Record<string, string> = {
    '1': '#b91c1c',
    '2': '#dc2626',
    '3': '#ef4444',
    '4': '#f97316',
    '5': '#fb923c',
    '6': '#f59e0b',
    '7': '#eab308',
    '8': '#84cc16',
    '9': '#22c55e',
    '10': '#16a34a',
};

export function Statistics() {
    const { games } = useGames();
    const [timeRange, setTimeRange] = useState<TimeRange>('thisYear');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const stats = useGameStats(games, timeRange, customStart || undefined, customEnd || undefined);

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

    const [tooltipMonth, setTooltipMonth] = useState<TimelineMonth | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const handleMonthClick = useCallback((month: TimelineMonth, e: React.MouseEvent) => {
        if (tooltipMonth?.monthKey === month.monthKey) {
            setTooltipMonth(null);
            return;
        }
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const halfWidth = 140;
        const clampedX = Math.max(halfWidth, Math.min(centerX, window.innerWidth - halfWidth));
        setTooltipPos({ x: clampedX, y: rect.bottom + 8 });
        setTooltipMonth(month);
    }, [tooltipMonth]);

    const handleTooltipClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    useEffect(() => {
        if (!tooltipMonth) return;
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.timeline-tooltip') && !target.closest('.timeline-month')) {
                setTooltipMonth(null);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [tooltipMonth]);

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
                        <option value="all">All Time</option>
                        <option value="thisYear">This Year</option>
                        <option value="lastYear">Last Year</option>
                        <option value="thisMonth">This Month</option>
                        <option value="lastMonth">Last Month</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="1year">Last 365 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>
                {timeRange === 'custom' && (
                    <div className="filter-group filter-group-row">
                        <div className="date-input-group">
                            <label htmlFor="customStart">From</label>
                            <input
                                id="customStart"
                                type="month"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="date-input"
                            />
                        </div>
                        <div className="date-input-group">
                            <label htmlFor="customEnd">To</label>
                            <input
                                id="customEnd"
                                type="month"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="date-input"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="timeline-section glass-panel">
                <div className="timeline-header">
                    <h3>Activity Timeline</h3>
                    <div className="timeline-scale">
                        <span>Less</span>
                        <div className="timeline-scale-cells">
                            <div className="scale-cell" />
                            <div className="scale-cell" style={{ opacity: 0.3 }} />
                            <div className="scale-cell" style={{ opacity: 0.55 }} />
                            <div className="scale-cell" style={{ opacity: 0.75 }} />
                            <div className="scale-cell" style={{ opacity: 1 }} />
                        </div>
                        <span>More</span>
                    </div>
                </div>
                {stats.activityTimeline.length > 0 ? (
                    <div className="timeline-months">
                        {stats.activityTimeline.map(month => (
                            <div
                                key={month.monthKey}
                                className="timeline-month"
                                onClick={(e) => handleMonthClick(month, e)}
                            >
                                <span className="timeline-month-label">{month.label.split(' ')[0]}</span>
                                <span className="timeline-month-year">{month.label.split(' ')[1]}</span>
                                <div
                                    className="timeline-month-bar"
                                    style={{
                                        backgroundColor: month.totalActions > 0
                                            ? `rgba(222, 67, 100, ${0.15 + (month.totalActions / stats.timelineMaxActions) * 0.85})`
                                            : 'transparent',
                                    }}
                                >
                                    {month.totalActions > 0 && (
                                        <span className="timeline-month-count">{month.totalActions}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="timeline-empty">No activity in this time range</p>
                )}
            </div>

            {tooltipMonth && (
                <div
                    className="timeline-tooltip"
                    onClick={handleTooltipClick}
                    style={{
                        position: 'fixed',
                        left: tooltipPos.x,
                        top: tooltipPos.y,
                        transform: 'translate(-50%, 0)',
                    }}
                >
                    <strong>{tooltipMonth.label}</strong>
                    {tooltipMonth.totalActions === 0 ? (
                        <p className="timeline-tooltip-empty">No activity</p>
                    ) : (
                        <>
                            {tooltipMonth.gamesStarted.length > 0 && (
                                                <div className="timeline-tooltip-group">
                                                    <span className="timeline-tooltip-label timeline-tooltip-label--started">Started</span>
                                    {tooltipMonth.gamesStarted.map((game, i) => (
                                        <div key={i} className="timeline-tooltip-game">
                                            {game.coverUrl && (
                                                <img className="timeline-tooltip-cover" src={game.coverUrl} alt="" />
                                            )}
                                            <div className="timeline-tooltip-game-info">
                                                <span className="timeline-tooltip-game-title">{game.title}</span>
                                                <span className="timeline-tooltip-game-meta">{game.platform}{game.hoursPlayed !== null ? ` · ${game.hoursPlayed}h` : ''}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {tooltipMonth.gamesFinished.length > 0 && (
                                                <div className="timeline-tooltip-group">
                                                    <span className="timeline-tooltip-label timeline-tooltip-label--finished">Finished</span>
                                    {tooltipMonth.gamesFinished.map((game, i) => (
                                        <div key={i} className="timeline-tooltip-game">
                                            {game.coverUrl && (
                                                <img className="timeline-tooltip-cover" src={game.coverUrl} alt="" />
                                            )}
                                            <div className="timeline-tooltip-game-info">
                                                <span className="timeline-tooltip-game-title">{game.title}</span>
                                                <span className="timeline-tooltip-game-meta">{game.platform}{game.hoursPlayed !== null ? ` · ${game.hoursPlayed}h` : ''}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className="stats-grid">

                <div className="section-divider">
                    <span>Overview</span>
                </div>

                <div className="kpi-card glass-panel">
                    <h3>Total Games</h3>
                    <div className="kpi-value">{stats.totalGames}</div>
                </div>
                <div className="kpi-card glass-panel">
                    <h3>Total Hours Played</h3>
                    <div className="kpi-value">{stats.totalHours}</div>
                </div>
                <div className="kpi-card glass-panel">
                    <h3>Average Rating</h3>
                    <div className="kpi-value kpi-purple">{stats.avgRating}</div>
                </div>
                <div className="kpi-card glass-panel">
                    <h3>Completion Rate</h3>
                    <div className="kpi-value kpi-green">{stats.completionRate}%</div>
                </div>

                <div className="chart-card glass-panel col-span-4">
                    <h3>Top 10 Most Played Games</h3>
                    <div className="chart-with-legend">
                        <div className="chart-wrapper chart-tall">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.hoursPerGame} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="name" tickFormatter={(_, index) => `${index + 1}`} interval={0} stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                    <YAxis type="number" width={36} stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#374151', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
                                        labelFormatter={(_, payload) => payload[0]?.payload?.name ?? ''}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {stats.hoursPerGame.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="chart-legend">
                            {stats.hoursPerGame.map((entry, index) => (
                                <div key={entry.name} className="legend-item">
                                    <span className="legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="legend-label">{entry.name}</span>
                                    <span className="legend-value">{entry.value}h</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="section-divider">
                    <span>Distribution</span>
                </div>

                <div className="chart-card glass-panel">
                    <h3>Genre Distribution</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.genreDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.genreDistribution.map((_, index) => (
                                        <Cell key={`genre-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass-panel">
                    <h3>Platform Breakdown</h3>
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
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass-panel">
                    <h3>Status Distribution</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.statusDistribution.map((_, index) => (
                                        <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass-panel">
                    <h3>Format Distribution</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.formatDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.formatDistribution?.map((_, index) => (
                                        <Cell key={`format-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="section-divider">
                    <span>Engagement</span>
                </div>

                <div className="chart-card glass-panel">
                    <h3>Time to Finish</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.timeToFinish} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="range" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                                <YAxis width={36} stroke="#9ca3af" tick={{ fill: '#9ca3af' }} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: '#374151', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {stats.timeToFinish.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass-panel">
                    <h3>Days to Finish</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.daysPlayedDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="range" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                                <YAxis width={36} stroke="#9ca3af" tick={{ fill: '#9ca3af' }} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: '#374151', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {stats.daysPlayedDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass-panel">
                    <h3>Avg Playtime by Genre (Hours)</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.avgPlaytimeByGenre}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.avgPlaytimeByGenre.map((_, index) => (
                                        <Cell key={`avg-genre-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass-panel">
                    <h3>Top Played Platforms (Hours)</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.hoursByPlatform}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.hoursByPlatform.map((entry, index) => (
                                        <Cell key={`hours-platform-${index}`} fill={getPlatformConfig(entry.name).color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="section-divider">
                    <span>Ratings</span>
                </div>

                <div className="chart-card glass-panel col-span-2">
                    <h3>Rating Distribution (Stars)</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.ratingDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="rating" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                                <YAxis width={36} stroke="#9ca3af" tick={{ fill: '#9ca3af' }} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: '#374151', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {stats.ratingDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={RATING_COLORS[entry.rating] || '#9ca3af'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass-panel col-span-2">
                    <h3>Average Rating by Platform</h3>
                    <div className="chart-wrapper chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.avgRatingByPlatform} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" domain={[0, 10]} stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                                <YAxis dataKey="name" type="category" width={80} stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#374151', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {stats.avgRatingByPlatform.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getPlatformConfig(entry.name).color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="section-divider">
                    <span>Monetary</span>
                </div>

                <div className="kpi-row">
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
                    <div className="kpi-card glass-panel">
                        <h3>Cost per Hour</h3>
                        <div className="kpi-value">{stats.costPerHour > 0 ? formatCurrency(stats.costPerHour) : '—'}</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
