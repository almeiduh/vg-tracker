import { useState } from 'react';
import { PlayCircle, PauseCircle, ListTodo, Plus } from 'lucide-react';
import { useGames } from '../contexts/GameContext';
import { GameSection } from './game/GameSection';
import type { Game } from '../types/game';
import { Modal } from './ui/Modal';
import { GameForm } from './forms/GameForm';
import { Button } from './ui/Button';

export const Dashboard = () => {
    const { games, isLoading, error, addGame, updateGame, deleteGame } = useGames();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const playingGames = games.filter(g => g.status === 'Playing');
    const onHoldGames = games.filter(g => g.status === 'On Hold');
    const backlogGames = games.filter(g => g.status === 'Backlog');

    const handleOpenModal = (game?: Game) => {
        setEditingGame(game);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingGame(undefined);
    };

    const handleSubmit = async (gameData: Omit<Game, 'id' | 'created_at' | 'updated_at'>) => {
        setIsSubmitting(true);
        try {
            if (editingGame) {
                await updateGame(editingGame.id, gameData);
            } else {
                await addGame(gameData);
            }
            handleCloseModal();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && games.length === 0) {
        return (
            <div className="dashboard-loading" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <p>Loading your games...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{ padding: '0 2rem 2rem', margin: '0 auto', maxWidth: '1440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>Dashboard</h1>
                <Button
                    onClick={() => handleOpenModal()}
                    variant="primary"
                    style={{ borderRadius: '9999px', padding: '0.6rem 1.5rem', fontWeight: 600, letterSpacing: '0.5px' }}
                >
                    <Plus size={20} strokeWidth={2.5} />
                    Add Game
                </Button>
            </div>

            {error ? (
                <div className="dashboard-error glass-panel" style={{ color: 'var(--danger)', padding: '1rem', marginBottom: '2rem' }}>
                    Error: {error}
                </div>
            ) : null}

            <GameSection
                title="Playing"
                icon={<PlayCircle size={26} color="var(--success)" />}
                games={playingGames}
                onEdit={handleOpenModal}
                onDelete={deleteGame}
            />

            <GameSection
                title="On Hold"
                icon={<PauseCircle size={26} color="var(--warning)" />}
                games={onHoldGames}
                onEdit={handleOpenModal}
                onDelete={deleteGame}
            />

            <GameSection
                title="Backlog"
                icon={<ListTodo size={26} color="var(--warning-alt)" />}
                games={backlogGames}
                onEdit={handleOpenModal}
                onDelete={deleteGame}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingGame ? 'Edit Game' : 'Add New Game'}
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
