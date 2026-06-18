import { useState } from 'react';
import { PlayCircle, PauseCircle, ListTodo, Plus, CheckCircle, FileSpreadsheet, Heart } from 'lucide-react';
import { exportGamesToExcel } from '../lib/exportToExcel';
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

    const wishlistGames = games.filter(g => g.status === 'Wishlist');
    const playingGames = games.filter(g => g.status === 'Playing');
    const onHoldGames = games.filter(g => g.status === 'On Hold');
    const backlogGames = games.filter(g => g.status === 'Backlog');
    const playedGames = games
        .filter(g => g.status === 'Played')
        .sort((a, b) => {
            if (!a.end_date && !b.end_date) return 0;
            if (!a.end_date) return 1;
            if (!b.end_date) return -1;
            return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
        });

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
            <div className="dashboard-header">
                <h1 style={{ margin: 0, fontSize: '2rem' }}>Dashboard</h1>
                <div className="dashboard-actions">
                    <Button
                        onClick={() => handleOpenModal()}
                        variant="primary"
                        style={{ borderRadius: '9999px', padding: '0.6rem 1.5rem', fontWeight: 600, letterSpacing: '0.5px' }}
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        Add Game
                    </Button>
                </div>
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
                initialCollapsed={false}
            />

            <GameSection
                title="Wishlist"
                icon={<Heart size={26} color="var(--accent-pink)" />}
                games={wishlistGames}
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

            <GameSection
                title="On Hold"
                icon={<PauseCircle size={26} color="var(--warning)" />}
                games={onHoldGames}
                onEdit={handleOpenModal}
                onDelete={deleteGame}
            />

            <GameSection
                title="Played"
                icon={<CheckCircle size={26} color="var(--success)" />}
                games={playedGames}
                onEdit={handleOpenModal}
                onDelete={deleteGame}
            />

            <div className="dashboard-footer" style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', padding: '1rem 0' }}>
                <Button
                    onClick={() => exportGamesToExcel(games)}
                    variant="ghost"
                    size="sm"
                    disabled={games.length === 0}
                    title={games.length === 0 ? 'No games to export' : 'Export all games to Excel'}
                    style={{ gap: '0.375rem', opacity: 0.5, fontSize: '0.875rem' }}
                >
                    <FileSpreadsheet size={16} strokeWidth={1.5} />
                    Export to Excel
                </Button>
            </div>

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
