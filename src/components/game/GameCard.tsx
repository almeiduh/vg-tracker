import React from 'react';
import { Edit2, Trash2, Clock, Calendar, Euro, Tag, Gamepad2, Star } from 'lucide-react';
import type { Game } from '../../types/game';
import { Button } from '../ui/Button';
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
            <header className="game-card-header">
                <div className="game-card-title-group">
                    <h3 className="game-title">{game.title}</h3>
                    {showStatusBadge && (
                        <span className={`status-badge status-${game.status.replace(/\s+/g, '-').toLowerCase()}`}>
                            {game.status}
                        </span>
                    )}
                </div>
                <div className="game-card-actions">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(game)} aria-label="Edit game" className="action-btn">
                        <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDelete} aria-label="Delete game" className="action-btn danger-hover">
                        <Trash2 size={16} />
                    </Button>
                </div>
            </header>

            <div className="game-card-body">
                <div className="info-tags">
                    <span className="info-tag"><Tag size={14} /> {game.genre}</span>
                    <span className="info-tag"><Gamepad2 size={14} /> {game.platform}</span>
                    {game.rating && <span className="info-tag rating-tag"><Star size={14} fill="currentColor" /> {game.rating}/10</span>}
                </div>

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
