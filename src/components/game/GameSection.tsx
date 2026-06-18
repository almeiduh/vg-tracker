import React, { useState } from 'react';
import type { Game } from '../../types/game';
import { GameCard } from './GameCard';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './GameSection.css';

interface GameSectionProps {
    title: string;
    icon: React.ReactNode;
    games: Game[];
    onEdit: (game: Game) => void;
    onDelete: (gameId: string) => void;
    emptyMessage?: string;
    initialCollapsed?: boolean;
}

export const GameSection: React.FC<GameSectionProps> = ({
    title,
    icon,
    games,
    onEdit,
    onDelete,
    emptyMessage = "No games in this section.",
    initialCollapsed = true
}) => {
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

    return (
        <section className="game-section">
            <header 
                className="game-section-header" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isCollapsed ? <ChevronRight size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                    <h2 className="game-section-title">
                        <span className="game-section-icon">{icon}</span>
                        {title}
                    </h2>
                </div>
                <span className="game-section-count">{games.length}</span>
            </header>

            {!isCollapsed && (
                games.length === 0 ? (
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
                )
            )}
        </section>
    );
};
