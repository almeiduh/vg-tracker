import React from 'react';
import { Edit2, Trash2, Clock, Calendar, Star, Gamepad2, Disc, Cloud, HardDrive, ShoppingCart, TrendingUp } from 'lucide-react';
import type { Game } from '../../types/game';
import { getPlatformConfig } from '../../lib/platforms';

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

    const isPlayingOrOnHold = game.status === 'Playing' || game.status === 'On Hold';
    const isBacklog = game.status === 'Backlog' || game.status === 'Wishlist';

    const getDaysPlayed = () => {
        if (!game.start_date || isBacklog) return null;
        const start = new Date(game.start_date);
        start.setHours(0, 0, 0, 0);
        const end = game.end_date ? new Date(game.end_date) : new Date();
        end.setHours(0, 0, 0, 0);
        return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    };
    const daysPlayed = getDaysPlayed();

    const platformConfig = getPlatformConfig(game.platform);
    const PlatformIcon = platformConfig.icon;

    return (
        <article className="game-card glass-card">
            <div className="game-card-cover-wrapper">
                {game.cover_url ? (
                    <img src={game.cover_url} alt={game.title} className="game-card-cover" />
                ) : (
                    <div className="game-card-cover-placeholder">
                        <Gamepad2 size={40} />
                    </div>
                )}
            </div>

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

                <div className="info-tags">
                    <span
                        className="info-tag platform-tag"
                        title={game.platform}
                        style={{
                            color: platformConfig.color,
                            borderColor: `${platformConfig.color}80`,
                            backgroundColor: `${platformConfig.color}33`
                        }}
                    >
                        <PlatformIcon size={14} />
                    </span>
                    <span className="info-tag format-tag" title={game.format}>
                        {game.format === 'Cloud' && <Cloud size={14} />}
                        {game.format === 'Physical' && <Disc size={14} />}
                        {game.format === 'Digital' && <HardDrive size={14} />}
                    </span>
                    {game.rating && !isPlayingOrOnHold && !isBacklog && (
                        <span className="info-tag rating-tag" style={{ marginLeft: 'auto' }}><Star size={14} fill="currentColor" /> {game.rating}/10</span>
                    )}
                </div>

                {!isBacklog && (
                    <div className="game-stats-grid">
                        <div className="stat-item">
                            <Calendar size={14} className="stat-icon" />
                            <div className="stat-content">
                                <span className="stat-label">Started</span>
                                <span className="stat-value">{formatDate(game.start_date)}</span>
                            </div>
                        </div>

                        {!isPlayingOrOnHold && (
                            <div className="stat-item">
                                <Calendar size={14} className="stat-icon" />
                                <div className="stat-content">
                                    <span className="stat-label">Finished</span>
                                    <span className="stat-value">{formatDate(game.end_date)}</span>
                                </div>
                            </div>
                        )}

                        {daysPlayed !== null && (
                            <div className="stat-item">
                                <Calendar size={14} className="stat-icon" />
                                <div className="stat-content">
                                    <span className="stat-label">Days</span>
                                    <span className="stat-value">{daysPlayed}</span>
                                </div>
                            </div>
                        )}

                        {!isPlayingOrOnHold && (
                            <div className="stat-item">
                                <Clock size={14} className="stat-icon" />
                                <div className="stat-content">
                                    <span className="stat-label">Playtime</span>
                                    <span className="stat-value">{game.hours_played ? `${game.hours_played}h` : 'N/A'}</span>
                                </div>
                            </div>
                        )}

                        {game.purchasing_price != null && (
                            <div className="stat-item">
                                <ShoppingCart size={14} className="stat-icon" />
                                <div className="stat-content">
                                    <span className="stat-label">Cost</span>
                                    <span className={`stat-value ${game.purchasing_price > 0 ? 'price-item buy' : 'price-item free'}`}>
                                        {game.purchasing_price > 0 ? `€${game.purchasing_price}` : 'Free'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {!isPlayingOrOnHold && game.selling_price != null && game.selling_price > 0 && (
                            <div className="stat-item">
                                <TrendingUp size={14} className="stat-icon" />
                                <div className="stat-content">
                                    <span className="stat-label">Sold</span>
                                    <span className="stat-value price-item sell">
                                        €{game.selling_price}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
};
