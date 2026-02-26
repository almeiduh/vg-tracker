import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useGames } from '../contexts/GameContext';
import { GameCard } from './game/GameCard';
import type { Game } from '../types/game';
import { Modal } from './ui/Modal';
import { GameForm } from './forms/GameForm';

export const Timeline = () => {
    const { games, isLoading, error, updateGame, deleteGame } = useGames();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter for Played games and sort by end_date descending (newest finished first)
    const playedGames = games
        .filter(g => g.status === 'Played')
        .sort((a, b) => {
            const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
            const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
            return dateB - dateA;
        });

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
                    Gaming Timeline
                </h1>
                <span className="game-section-count">{playedGames.length} Finished</span>
            </div>

            {error ? (
                <div className="dashboard-error glass-panel" style={{ color: 'var(--danger)', padding: '1rem', marginBottom: '2rem' }}>
                    Error: {error}
                </div>
            ) : null}

            {playedGames.length === 0 ? (
                <div className="game-section-empty glass-card">
                    <p>You haven't finished any games yet. Your timeline will appear here.</p>
                </div>
            ) : (
                <div className="game-section-grid">
                    {playedGames.map(game => (
                        <GameCard
                            key={game.id}
                            game={game}
                            onEdit={handleOpenModal}
                            onDelete={deleteGame}
                        />
                    ))}
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
