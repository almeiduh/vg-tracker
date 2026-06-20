import { useMemo } from 'react';
import type { Game } from '../types/game';

export type TimeRange = '30days' | '1year' | 'all' | 'thisYear' | 'lastYear' | 'thisMonth' | 'lastMonth' | 'custom';

export function computeDateRange(timeRange: TimeRange, customStart?: string, customEnd?: string, now?: Date) {
    const _now = now ?? new Date();
    const currentYear = _now.getFullYear();
    const currentMonth = _now.getMonth();

    let rangeStart: Date | null | undefined;
    let rangeEnd: Date | null | undefined;

    switch (timeRange) {
        case 'all':
            rangeStart = undefined;
            rangeEnd = undefined;
            break;
        case '30days':
            rangeStart = new Date(_now.getTime() - 30 * 24 * 60 * 60 * 1000);
            rangeEnd = _now;
            break;
        case '1year':
            rangeStart = new Date(_now.getTime() - 365 * 24 * 60 * 60 * 1000);
            rangeEnd = _now;
            break;
        case 'thisYear':
            rangeStart = new Date(currentYear, 0, 1);
            rangeEnd = _now;
            break;
        case 'lastYear':
            rangeStart = new Date(currentYear - 1, 0, 1);
            rangeEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59, 999);
            break;
        case 'thisMonth':
            rangeStart = new Date(currentYear, currentMonth, 1);
            rangeEnd = _now;
            break;
        case 'lastMonth':
            rangeStart = new Date(currentYear, currentMonth - 1, 1);
            rangeEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
            break;
        case 'custom':
            if (customStart) {
                if (customStart.length === 7) {
                    const [y, m] = customStart.split('-').map(Number);
                    rangeStart = new Date(y, m - 1, 1);
                } else {
                    rangeStart = new Date(customStart);
                }
            }
            if (customEnd) {
                if (customEnd.length === 7) {
                    const [y, m] = customEnd.split('-').map(Number);
                    rangeEnd = new Date(y, m, 0, 23, 59, 59, 999);
                } else {
                    rangeEnd = new Date(customEnd);
                }
            }
            break;
    }

    return { rangeStart, rangeEnd };
}

export interface TimelineGameInfo {
    title: string;
    coverUrl: string | null;
    platform: string | null;
    hoursPlayed: number | null;
}

export interface TimelineMonth {
    monthKey: string;
    label: string;
    totalActions: number;
    gamesStarted: Array<TimelineGameInfo>;
    gamesFinished: Array<TimelineGameInfo>;
}

export function useGameStats(games: Game[], timeRange: TimeRange, customStart?: string, customEnd?: string) {
    return useMemo(() => {
        const now = new Date();
        const { rangeStart, rangeEnd } = computeDateRange(timeRange, customStart, customEnd, now);

        // 2. Filter games based on date boundaries
        const filteredGames = games.filter(game => {
            if (rangeStart === undefined && rangeEnd === undefined) return true;

            const gameDateStr = game.end_date || game.start_date || game.created_at;
            if (!gameDateStr) return false;

            const gameDate = new Date(gameDateStr);

            if (rangeStart && gameDate < rangeStart) return false;
            if (rangeEnd && gameDate > rangeEnd) return false;

            return true;
        });

        // 2. Financial KPIs
        const totalSpent = filteredGames.reduce((acc, game) => acc + (game.purchasing_price || 0), 0);
        const totalSold = filteredGames.reduce((acc, game) => acc + (game.selling_price || 0), 0);
        const liquidSpent = totalSpent - totalSold;

        // 3. Genre Distribution
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

        // 5b. Hours Played by Platform
        const hoursByPlatformMap = new Map<string, number>();
        filteredGames.forEach(game => {
            if (game.platform && game.hours_played) {
                hoursByPlatformMap.set(game.platform, (hoursByPlatformMap.get(game.platform) || 0) + game.hours_played);
            }
        });
        const hoursByPlatform = Array.from(hoursByPlatformMap.entries())
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
            if (game.status === 'Backlog' || game.status === 'Wishlist' || !game.start_date) return;
            const start = new Date(game.start_date);
            start.setHours(0, 0, 0, 0);
            const end = game.end_date ? new Date(game.end_date) : now;
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

        // 9.5 Format Distribution
        const formatCountMap = new Map<string, number>();
        filteredGames.forEach(game => {
            if (game.format) {
                formatCountMap.set(game.format, (formatCountMap.get(game.format) || 0) + 1);
            }
        });
        const formatDistribution = Array.from(formatCountMap.entries())
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

        // 12. Top Most Played Games (hours per game)
        const hoursPerGame = [...filteredGames]
            .filter(g => g.hours_played && g.hours_played > 0)
            .sort((a, b) => (b.hours_played || 0) - (a.hours_played || 0))
            .slice(0, 10)
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

        // 14. Top-Level KPIs
        const totalGames = filteredGames.length;
        const totalHours = filteredGames.reduce((acc, g) => acc + (g.hours_played || 0), 0);
        const ratedGames = filteredGames.filter(g => g.rating !== null && g.rating !== undefined);
        const avgRating = ratedGames.length > 0
            ? Math.round((ratedGames.reduce((acc, g) => acc + g.rating!, 0) / ratedGames.length) * 10) / 10
            : 0;
        const playedGames = filteredGames.filter(g => g.status === 'Played').length;
        const completionRate = totalGames > 0 ? Math.round((playedGames / totalGames) * 100) : 0;

        // 15. Activity Timeline (GitHub-style contribution per month)
        let displayStart = rangeStart;
        let displayEnd = rangeEnd;

        if (!displayStart || !displayEnd) {
            const allDates = filteredGames
                .flatMap(g => [g.start_date, g.end_date].filter(Boolean)) as string[];
            if (allDates.length > 0) {
                allDates.sort();
                displayStart = new Date(allDates[0]);
                displayEnd = new Date(allDates[allDates.length - 1]);
            }
        }

        let activityTimeline: TimelineMonth[] = [];
        let timelineMaxActions = 0;

        if (displayStart && displayEnd) {
            const start = new Date(displayStart.getFullYear(), displayStart.getMonth(), 1);
            const end = new Date(displayEnd.getFullYear(), displayEnd.getMonth(), 1);

            const monthMap = new Map<string, TimelineMonth>();
            const cursor = new Date(start);
            while (cursor <= end) {
                const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
                const label = cursor.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                monthMap.set(key, {
                    monthKey: key,
                    label,
                    totalActions: 0,
                    gamesStarted: [],
                    gamesFinished: [],
                });
                cursor.setMonth(cursor.getMonth() + 1);
            }

            filteredGames.forEach(game => {
                if (game.start_date) {
                    const d = new Date(game.start_date);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    const month = monthMap.get(key);
                    if (month) {
                        month.gamesStarted.push({ title: game.title, coverUrl: game.cover_url ?? null, platform: game.platform ?? null, hoursPlayed: game.hours_played ?? null });
                        month.totalActions++;
                    }
                }
                if (game.end_date) {
                    const d = new Date(game.end_date);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    const month = monthMap.get(key);
                    if (month) {
                        month.gamesFinished.push({ title: game.title, coverUrl: game.cover_url ?? null, platform: game.platform ?? null, hoursPlayed: game.hours_played ?? null });
                        month.totalActions++;
                    }
                }
            });

            activityTimeline = Array.from(monthMap.values());
            timelineMaxActions = Math.max(1, ...activityTimeline.map(m => m.totalActions));
        }

        return {
            totalGames,
            totalHours,
            avgRating,
            completionRate,
            totalSpent,
            totalSold,
            liquidSpent,
            costPerHour,
            genreDistribution,
            platformBreakdown,
            hoursByPlatform,
            timeToFinish,
            ratingDistribution,
            daysPlayedDistribution,
            statusDistribution,
            formatDistribution,
            avgPlaytimeByGenre,
            hoursPerGame,
            avgRatingByPlatform,
            activityTimeline,
            timelineMaxActions,
        };
    }, [games, timeRange, customStart, customEnd]);
}
