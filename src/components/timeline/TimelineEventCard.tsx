import React from 'react';
import { Edit2, Trash2, Calendar, Clock, Gamepad2, Star } from 'lucide-react';
import type { Game } from '../../types/game';
import { getPlatformConfig } from '../../lib/platforms';
import { formatDate } from '../../lib/formatDate';

export interface TimelineEvent {
    type: 'started' | 'finished';
    date: string; // ISO date string
    game: Game;
}

interface TimelineEventCardProps {
    event: TimelineEvent;
    onEdit: (game: Game) => void;
    onDelete: (gameId: string) => void;
}

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({ event, onEdit, onDelete }) => {
    const { game, type, date } = event;

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete "${game.title}"?`)) {
            onDelete(game.id);
        }
    };

    const platformConfig = getPlatformConfig(game.platform);
    const PlatformIcon = platformConfig.icon;

    const isFinished = type === 'finished';
    const eventLabel = isFinished ? 'Finished' : 'Started';

    const getDaysPlayed = () => {
        if (!game.start_date || game.status === 'Backlog' || game.status === 'Wishlist') return null;
        const start = new Date(game.start_date);
        start.setHours(0, 0, 0, 0);
        const end = game.end_date ? new Date(game.end_date) : new Date();
        end.setHours(0, 0, 0, 0);
        return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    };
    const daysPlayed = getDaysPlayed();

    return (
        <article className={`timeline-event-card timeline-event-card--${type}`}>
            {/* Cover thumbnail */}
            <div className="timeline-card-cover">
                {game.cover_url ? (
                    <img src={game.cover_url} alt={game.title} />
                ) : (
                    <div className="timeline-card-cover-placeholder">
                        <Gamepad2 size={28} />
                    </div>
                )}
            </div>

            {/* Floating action overlay */}
            <div className="timeline-card-overlay">
                <button className="overlay-action-btn edit-btn" onClick={() => onEdit(game)} aria-label="Edit game">
                    <Edit2 size={15} />
                </button>
                <button className="overlay-action-btn delete-btn" onClick={handleDelete} aria-label="Delete game">
                    <Trash2 size={15} />
                </button>
            </div>

            {/* Body */}
            <div className="timeline-card-body">
                {/* Top row: event label + badges */}
                <div className="timeline-card-top">
                    <span className={`timeline-event-label timeline-event-label--${type}`}>
                        <Calendar size={14} />
                        {eventLabel}: {formatDate(date)}
                    </span>

                    <div className="timeline-card-badges">
                        <span
                            className="timeline-badge"
                            style={{
                                color: platformConfig.color,
                                borderColor: `${platformConfig.color}40`,
                                backgroundColor: `${platformConfig.color}15`
                            }}
                        >
                            <PlatformIcon size={14} />
                            {game.platform}
                        </span>

                        {isFinished && game.hours_played != null && (
                            <span className="timeline-badge">
                                <Clock size={14} />
                                {game.hours_played}h
                            </span>
                        )}
                        {isFinished && daysPlayed !== null && (
                            <span className="timeline-badge">
                                <Calendar size={14} />
                                {daysPlayed} {daysPlayed === 1 ? 'day' : 'days'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="timeline-card-title">{game.title}</h3>

                {/* Rating bar — finished events only */}
                {isFinished && game.rating != null && (
                    <div className="star-rating-row">
                        {Array.from({ length: 10 }, (_, i) => {
                            const filled = i + 1 <= game.rating!;
                            return (
                                <Star
                                    key={i}
                                    size={16}
                                    strokeWidth={1.5}
                                    fill={filled ? 'var(--accent-blue)' : 'none'}
                                    color={filled ? 'var(--accent-blue)' : 'var(--text-muted)'}
                                />
                            );
                        })}
                        <span className="star-rating-value">{game.rating}/10</span>
                    </div>
                )}
            </div>
        </article>
    );
};
