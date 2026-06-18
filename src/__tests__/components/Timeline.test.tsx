import { describe, it, expect } from 'vitest';
import { buildTimelineEvents } from '../../components/Timeline';
import type { Game } from '../../types/game';

const makeGame = (overrides: Partial<Game>): Game => ({
    id: '1',
    title: 'Test Game',
    genres: [],
    platform: 'PC',
    rating: null,
    status: 'Playing',
    format: 'Digital',
    purchasing_price: 0,
    selling_price: null,
    start_date: null,
    end_date: null,
    hours_played: null,
    cover_url: null,
    ...overrides,
});

describe('buildTimelineEvents', () => {
    it('creates a "started" event for a Playing game with start_date', () => {
        const games = [makeGame({ id: '1', status: 'Playing', start_date: '2026-01-15' })];
        const events = buildTimelineEvents(games);

        expect(events).toHaveLength(1);
        expect(events[0].type).toBe('started');
        expect(events[0].date).toBe('2026-01-15');
        expect(events[0].game.id).toBe('1');
    });

    it('creates both "started" and "finished" events for a Played game', () => {
        const games = [makeGame({
            id: '2',
            status: 'Played',
            start_date: '2026-01-01',
            end_date: '2026-02-15',
        })];
        const events = buildTimelineEvents(games);

        expect(events).toHaveLength(2);
        // Newest first
        expect(events[0].type).toBe('finished');
        expect(events[0].date).toBe('2026-02-15');
        expect(events[1].type).toBe('started');
        expect(events[1].date).toBe('2026-01-01');
    });

    it('excludes Backlog and Wishlist games entirely', () => {
        const games = [
            makeGame({ id: '3', status: 'Backlog', start_date: '2026-03-01' }),
            makeGame({ id: '4', status: 'Wishlist', start_date: '2026-04-01' }),
        ];
        const events = buildTimelineEvents(games);
        expect(events).toHaveLength(0);
    });

    it('includes On Hold games with a start_date', () => {
        const games = [makeGame({ id: '4', status: 'On Hold', start_date: '2026-02-01' })];
        const events = buildTimelineEvents(games);

        expect(events).toHaveLength(1);
        expect(events[0].type).toBe('started');
    });

    it('sorts events newest first across multiple games', () => {
        const games = [
            makeGame({ id: 'a', status: 'Played', start_date: '2025-06-01', end_date: '2025-12-01' }),
            makeGame({ id: 'b', status: 'Playing', start_date: '2026-02-20' }),
            makeGame({ id: 'c', status: 'Played', start_date: '2026-01-10', end_date: '2026-02-22' }),
        ];
        const events = buildTimelineEvents(games);

        const dates = events.map(e => e.date);
        expect(dates).toEqual([
            '2026-02-22', // c finished
            '2026-02-20', // b started
            '2026-01-10', // c started
            '2025-12-01', // a finished
            '2025-06-01', // a started
        ]);
    });

    it('does not create a finished event for a game without end_date', () => {
        const games = [makeGame({ id: '5', status: 'Playing', start_date: '2026-01-01', end_date: null })];
        const events = buildTimelineEvents(games);

        expect(events).toHaveLength(1);
        expect(events[0].type).toBe('started');
    });
});
