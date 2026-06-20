import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useGames } from '../contexts/GameContext';
import { TimelineEventCard } from './timeline/TimelineEventCard';
import type { TimelineEvent } from './timeline/TimelineEventCard';
import type { Game } from '../types/game';
import { Modal } from './ui/Modal';
import { GameForm } from './forms/GameForm';

import './timeline/Timeline.css';

/** Returns 'YYYY-MM' key for grouping events by month. */
function getMonthYearKey(dateString: string): string {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
}

/** Returns a display label like "February 2026". */
function formatMonthYear(dateString: string): string {
    return new Date(dateString).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
    });
}

/** Build a flat list of timeline events from all non-Backlog/Wishlist games. */
export function buildTimelineEvents(games: Game[]): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    for (const game of games) {
        if (game.status === 'Backlog' || game.status === 'Wishlist') continue;

        if (game.start_date) {
            events.push({ type: 'started', date: game.start_date, game });
        }

        if (game.end_date && game.status === 'Played') {
            events.push({ type: 'finished', date: game.end_date, game });
        }
    }

    // Sort newest first
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return events;
}

export const Timeline = () => {
    const { games, isLoading, error, updateGame, deleteGame } = useGames();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const timelineEvents = buildTimelineEvents(games);

    const handleOpenModal = (game: Game) => {
        setEditingGame(game);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingGame(undefined);
    };

    const handleSubmit = async (gameData: Omit<Game, 'id' | 'created_at' | 'updated_at'>) => {
        if (!editingGame) return;
        setIsSubmitting(true);
        try {
            await updateGame(editingGame.id, gameData);
            handleCloseModal();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && games.length === 0) {
        return (
            <div className="timeline-loading" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <p>Loading your timeline...</p>
            </div>
        );
    }

    return (
        <div className="timeline-container" style={{ padding: '0 2rem 2rem', margin: '0 auto', maxWidth: '1440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CalendarClock className="text-accent-blue" color="var(--accent-blue)" size={32} />
                    Timeline
                </h1>
                <span className="game-section-count">{timelineEvents.length} Events</span>
            </div>

            {error ? (
                <div className="dashboard-error glass-panel" style={{ color: 'var(--danger)', padding: '1rem', marginBottom: '2rem' }}>
                    Error: {error}
                </div>
            ) : null}

            {timelineEvents.length === 0 ? (
                <div className="game-section-empty glass-card">
                    <p>No timeline events yet. Start or finish a game to see your history here.</p>
                </div>
            ) : (
                <div className="timeline-track">
                    {timelineEvents.map((event, index) => {
                        const currentMonth = getMonthYearKey(event.date);
                        const prevMonth = index > 0 ? getMonthYearKey(timelineEvents[index - 1].date) : null;
                        const showSeparator = currentMonth !== prevMonth;

                        return (
                            <div className="timeline-event-group" key={`${event.game.id}-${event.type}-${index}`}>
                                {showSeparator && (
                                    <div className="timeline-month-separator">
                                        <span className="timeline-month-label">{formatMonthYear(event.date)}</span>
                                    </div>
                                )}
                                <div className={`timeline-event timeline-event--${event.type}`}>
                                    <TimelineEventCard
                                        event={event}
                                        onEdit={handleOpenModal}
                                        onDelete={deleteGame}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Edit Game"
            >
                <GameForm
                    initialData={editingGame}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                    isLoading={isSubmitting}
                />
            </Modal>
        </div>
    );
};
