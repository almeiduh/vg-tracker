import { useMemo } from 'react';
import type { Game } from '../types/game';

export type TimeRange = '30days' | '1year' | 'all';

export function useGameStats(games: Game[], timeRange: TimeRange) {
    return useMemo(() => {
        const now = new Date();

        // 1. Filter games based on timeRange
        // If a game doesn't have an end_date, we might use start_date or skip it for timeline stats.
        const filteredGames = games.filter(game => {
            if (timeRange === 'all') return true;

            const gameDateStr = game.end_date || game.start_date || game.created_at;
            if (!gameDateStr) return false;

            const gameDate = new Date(gameDateStr);
            const diffTime = Math.abs(now.getTime() - gameDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (timeRange === '30days') return diffDays <= 30;
            if (timeRange === '1year') return diffDays <= 365;

            return true;
        });

        // 2. Financial KPIs
        const totalSpent = filteredGames.reduce((acc, game) => acc + (game.purchasing_price || 0), 0);
        const totalSold = filteredGames.reduce((acc, game) => acc + (game.selling_price || 0), 0);
        const liquidSpent = totalSpent - totalSold;

        // 3. Hours Played Timeline (Group by Date)
        // For simplicity, we'll plot games finished/started on those dates, or just sum their hours.
        // A more precise timeline would need daily logs, but we only have start_date/end_date.
        // Let's create a timeline of hours played based on end_date (when they finished it).
        const hoursByDateMap = new Map<string, number>();
        filteredGames.forEach(game => {
            if (game.end_date && game.hours_played) {
                const dateKey = game.end_date.split('T')[0]; // YYYY-MM-DD
                hoursByDateMap.set(dateKey, (hoursByDateMap.get(dateKey) || 0) + game.hours_played);
            }
        });

        // Sort timeline data
        const hoursPlayedTimeline = Array.from(hoursByDateMap.entries())
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, hours]) => ({ date, hours }));

        // 4. Genre Distribution
        const genreCountMap = new Map<string, number>();
        filteredGames.forEach(game => {
            if (game.genres && Array.isArray(game.genres)) {
                game.genres.forEach(genre => {
                    genreCountMap.set(genre, (genreCountMap.get(genre) || 0) + 1);
                });
            }
        });
        const genreDistribution = Array.from(genreCountMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 5. Platform Breakdown (by count of games)
        const platformMap = new Map<string, number>();
        filteredGames.forEach(game => {
            if (game.platform) {
                platformMap.set(game.platform, (platformMap.get(game.platform) || 0) + 1);
            }
        });
        const platformBreakdown = Array.from(platformMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 6. Time to Finish (Histogram data)
        // Buckets: 0-10, 10-30, 30-50, 50-100, 100+
        const timeBuckets = {
            '0-10h': 0,
            '10-30h': 0,
            '30-50h': 0,
            '50-100h': 0,
            '100h+': 0
        };
        filteredGames.forEach(game => {
            if (game.hours_played !== null && game.hours_played !== undefined) {
                const h = game.hours_played;
                if (h <= 10) timeBuckets['0-10h']++;
                else if (h <= 30) timeBuckets['10-30h']++;
                else if (h <= 50) timeBuckets['30-50h']++;
                else if (h <= 100) timeBuckets['50-100h']++;
                else timeBuckets['100h+']++;
            }
        });
        const timeToFinish = Object.entries(timeBuckets).map(([range, count]) => ({ range, count }));

        // 7. Rating Distribution
        const ratingBuckets: Record<string, number> = {
            '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
            '6': 0, '7': 0, '8': 0, '9': 0, '10': 0
        };
        filteredGames.forEach(game => {
            if (game.rating !== null && game.rating !== undefined) {
                const r = Math.round(game.rating).toString();
                if (ratingBuckets[r] !== undefined) {
                    ratingBuckets[r]++;
                }
            }
        });
        const ratingDistribution = Object.entries(ratingBuckets).map(([rating, count]) => ({ rating, count }));

        // 8. Days Played Distribution
        const daysPlayedBuckets = {
            '0-7d': 0,
            '8-30d': 0,
            '1-3m': 0,
            '3-6m': 0,
            '6m+': 0
        };
        filteredGames.forEach(game => {
            if (game.status === 'Backlog' || !game.start_date) return;
            const start = new Date(game.start_date);
            start.setHours(0, 0, 0, 0);
            const end = game.end_date ? new Date(game.end_date) : now; // now is defined at the top
            end.setHours(0, 0, 0, 0);
            const daysPlayed = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

            if (daysPlayed <= 7) daysPlayedBuckets['0-7d']++;
            else if (daysPlayed <= 30) daysPlayedBuckets['8-30d']++;
            else if (daysPlayed <= 90) daysPlayedBuckets['1-3m']++;
            else if (daysPlayed <= 180) daysPlayedBuckets['3-6m']++;
            else daysPlayedBuckets['6m+']++;
        });
        const daysPlayedDistribution = Object.entries(daysPlayedBuckets).map(([range, count]) => ({ range, count }));

        // 9. Status Distribution (Backlog vs Played Ratio)
        const statusCountMap = new Map<string, number>();
        filteredGames.forEach(game => {
            if (game.status) {
                statusCountMap.set(game.status, (statusCountMap.get(game.status) || 0) + 1);
            }
        });
        const statusDistribution = Array.from(statusCountMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 10. Cost per Hour of Entertainment
        const totalHoursPlayed = filteredGames.reduce((acc, game) => acc + (game.hours_played || 0), 0);
        const costPerHour = totalHoursPlayed > 0 ? liquidSpent / totalHoursPlayed : 0;

        // 11. Average Playtime by Genre
        const genrePlaytimeMap = new Map<string, { totalHours: number, count: number }>();
        filteredGames.forEach(game => {
            if (game.hours_played && game.hours_played > 0 && game.genres && Array.isArray(game.genres)) {
                game.genres.forEach(genre => {
                    const current = genrePlaytimeMap.get(genre) || { totalHours: 0, count: 0 };
                    genrePlaytimeMap.set(genre, {
                        totalHours: current.totalHours + game.hours_played!,
                        count: current.count + 1
                    });
                });
            }
        });
        const avgPlaytimeByGenre = Array.from(genrePlaytimeMap.entries())
            .map(([name, data]) => ({ name, value: Math.round((data.totalHours / data.count) * 10) / 10 }))
            .sort((a, b) => b.value - a.value);

        // 12. Top 5 Most Played Games
        const topGamesByPlaytime = [...filteredGames]
            .filter(g => g.hours_played && g.hours_played > 0)
            .sort((a, b) => (b.hours_played || 0) - (a.hours_played || 0))
            .slice(0, 5)
            .map(game => ({
                name: game.title,
                value: game.hours_played,
                platform: game.platform
            }));

        // 13. Average Rating by Platform
        const platformRatingMap = new Map<string, { totalRating: number, count: number }>();
        filteredGames.forEach(game => {
            if (game.rating !== null && game.rating !== undefined && game.platform) {
                const current = platformRatingMap.get(game.platform) || { totalRating: 0, count: 0 };
                platformRatingMap.set(game.platform, {
                    totalRating: current.totalRating + game.rating,
                    count: current.count + 1
                });
            }
        });
        const avgRatingByPlatform = Array.from(platformRatingMap.entries())
            .map(([name, data]) => ({ name, value: Math.round((data.totalRating / data.count) * 10) / 10 }))
            .sort((a, b) => b.value - a.value);

        // 14. Spending Over Time
        const spendingByMonthMap = new Map<string, number>();
        filteredGames.forEach(game => {
            if (game.purchasing_price && game.purchasing_price > 0 && game.created_at) {
                // Group by YYYY-MM
                const d = new Date(game.created_at);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                spendingByMonthMap.set(monthKey, (spendingByMonthMap.get(monthKey) || 0) + game.purchasing_price);
            }
        });
        const spendingOverTime = Array.from(spendingByMonthMap.entries())
            .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
            .map(([month, amount]) => {
                const [year, m] = month.split('-');
                const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleString('default', { month: 'short' });
                return { month: `${monthName} ${year}`, amount };
            });

        return {
            totalSpent,
            totalSold,
            liquidSpent,
            hoursPlayedTimeline,
            genreDistribution,
            platformBreakdown,
            timeToFinish,
            ratingDistribution,
            daysPlayedDistribution,
            statusDistribution,
            costPerHour,
            avgPlaytimeByGenre,
            topGamesByPlaytime,
            avgRatingByPlatform,
            spendingOverTime
        };
    }, [games, timeRange]);
}
