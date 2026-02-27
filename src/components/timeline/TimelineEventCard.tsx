import React from 'react';
import { Edit2, Trash2, Calendar, Clock, Gamepad2 } from 'lucide-react';
import type { Game } from '../../types/game';
import { getPlatformConfig } from '../../lib/platforms';

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    };

    const platformConfig = getPlatformConfig(game.platform);
    const PlatformIcon = platformConfig.icon;

    const isFinished = type === 'finished';
    const eventLabel = isFinished ? 'Finished' : 'Started';

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
                    </div>
                </div>

                {/* Title */}
                <h3 className="timeline-card-title">{game.title}</h3>

                {/* Rating bar — finished events only */}
                {isFinished && game.rating != null && (
                    <div className="timeline-rating-row">
                        <div className="timeline-rating-bar">
                            <div
                                className="timeline-rating-fill"
                                style={{ width: `${(game.rating / 10) * 100}%` }}
                            />
                        </div>
                        <span className="timeline-rating-score">{game.rating}/10</span>
                    </div>
                )}
            </div>
        </article>
    );
};
