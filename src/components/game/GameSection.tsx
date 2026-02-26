import React from 'react';
import type { Game } from '../../types/game';
import { GameCard } from './GameCard';
import './GameSection.css';

interface GameSectionProps {
    title: string;
    icon: React.ReactNode;
    games: Game[];
    onEdit: (game: Game) => void;
    onDelete: (gameId: string) => void;
    emptyMessage?: string;
}

export const GameSection: React.FC<GameSectionProps> = ({
    title,
    icon,
    games,
    onEdit,
    onDelete,
    emptyMessage = "No games in this section."
}) => {
    return (
        <section className="game-section">
            <header className="game-section-header">
                <h2 className="game-section-title">
                    <span className="game-section-icon">{icon}</span>
                    {title}
                </h2>
                <span className="game-section-count">{games.length}</span>
            </header>

            {games.length === 0 ? (
                <div className="game-section-empty glass-card">
                    <p>{emptyMessage}</p>
                </div>
            ) : (
                <div className="game-section-grid">
                    {games.map(game => (
                        <GameCard
                            key={game.id}
                            game={game}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};
