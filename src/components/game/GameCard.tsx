import React from 'react';
import { Edit2, Trash2, Clock, Calendar, Euro, Tag, Gamepad2, Star } from 'lucide-react';
import type { Game } from '../../types/game';

import './GameCard.css';

interface GameCardProps {
    game: Game;
    onEdit: (game: Game) => void;
    onDelete: (gameId: string) => void;
    showStatusBadge?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onEdit, onDelete, showStatusBadge = false }) => {
    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete "${game.title}"?`)) {
            onDelete(game.id);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <article className="game-card glass-card">
            {game.cover_url && (
                <div className="game-card-cover-wrapper">
                    <img src={game.cover_url} alt={game.title} className="game-card-cover" />
                </div>
            )}

            {/* Floating action overlay */}
            <div className="game-card-overlay">
                <button className="overlay-action-btn edit-btn" onClick={() => onEdit(game)} aria-label="Edit game">
                    <Edit2 size={15} />
                </button>
                <button className="overlay-action-btn delete-btn" onClick={handleDelete} aria-label="Delete game">
                    <Trash2 size={15} />
                </button>
            </div>

            <div className="game-card-content">
                {/* Line 1: Title */}
                <header className="game-card-header">
                    <div className="game-card-title-group">
                        <h3 className="game-title">{game.title}</h3>
                        {showStatusBadge && (
                            <span className={`status-badge status-${game.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                {game.status}
                            </span>
                        )}
                    </div>
                </header>

                {/* Line 2: Platform & Genres */}
                <div className="info-tags">
                    <span className="info-tag"><Gamepad2 size={14} /> {game.platform}</span>
                    {game.genres?.map(genre => (
                        <span key={genre} className="info-tag"><Tag size={14} /> {genre}</span>
                    ))}
                </div>

                {/* Line 3: Rating */}
                {game.rating && (
                    <div className="game-card-rating">
                        <span className="info-tag rating-tag"><Star size={14} fill="currentColor" /> {game.rating}/10</span>
                    </div>
                )}

                {/* Darker stats box */}
                <div className="game-stats-grid">
                    <div className="stat-item">
                        <Calendar size={14} className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-label">Started</span>
                            <span className="stat-value">{formatDate(game.start_date)}</span>
                        </div>
                    </div>

                    <div className="stat-item">
                        <Calendar size={14} className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-label">Finished</span>
                            <span className="stat-value">{formatDate(game.end_date)}</span>
                        </div>
                    </div>

                    <div className="stat-item">
                        <Clock size={14} className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-label">Playtime</span>
                            <span className="stat-value">{game.hours_played ? `${game.hours_played}h` : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="stat-item">
                        <Euro size={14} className="stat-icon" />
                        <div className="stat-content prices">
                            <span className="price-item buy" title="Purchasing Price">
                                ↓{game.purchasing_price ?? 'N/A'}
                            </span>
                            <span className="price-item sell" title="Selling Price">
                                ↑{game.selling_price ?? 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};
