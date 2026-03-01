import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameCard } from '../../components/game/GameCard';
import type { Game } from '../../types/game';

const mockGame: Game = {
    id: '123',
    title: 'Test Game Title',
    status: 'Played',
    format: 'Physical',
    genres: ['RPG'],
    platform: 'PlayStation 5',
    rating: 9,
    purchasing_price: 60,
    selling_price: null,
    start_date: '2023-01-01',
    end_date: null,
    hours_played: 45.5,
    cover_url: 'https://example.com/cover.jpg'
};

describe('GameCard', () => {
    it('renders game information correctly', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();

        render(<GameCard game={mockGame} onEdit={onEdit} onDelete={onDelete} showStatusBadge={true} />);

        // Basic Info
        expect(screen.getByText('Test Game Title')).toBeInTheDocument();
        expect(screen.getByText('RPG')).toBeInTheDocument();
        expect(screen.getByText('PlayStation 5')).toBeInTheDocument();
        expect(screen.getByText('Physical')).toBeInTheDocument();

        // Cover Image
        const coverImage = screen.getByAltText('Test Game Title');
        expect(coverImage).toBeInTheDocument();
        expect(coverImage).toHaveAttribute('src', 'https://example.com/cover.jpg');

        // Status Badge
        expect(screen.getByText('Played')).toBeInTheDocument();

        // Rating
        expect(screen.getByText('9/10')).toBeInTheDocument();

        // Stats
        expect(screen.getByText('45.5h')).toBeInTheDocument();
        expect(screen.getByText('€60')).toBeInTheDocument();
        expect(screen.queryByText('€N/A')).toBeInTheDocument(); // If selling price is null, it might show '€N/A' or 'N/A'. Wait, selling price is null so '€N/A'. 'N/A' was the previous.
        expect(screen.getByText('Jan 1, 2023')).toBeInTheDocument();
    });

    it('calls onEdit when the edit button is clicked', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();

        render(<GameCard game={mockGame} onEdit={onEdit} onDelete={onDelete} />);

        const editButton = screen.getByLabelText('Edit game');
        fireEvent.click(editButton);

        expect(onEdit).toHaveBeenCalledTimes(1);
        expect(onEdit).toHaveBeenCalledWith(mockGame);
    });

    it('calls onDelete when delete button is clicked and confirmed', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();

        // Mock window.confirm to return true
        vi.spyOn(window, 'confirm').mockImplementation(() => true);

        render(<GameCard game={mockGame} onEdit={onEdit} onDelete={onDelete} />);

        const deleteButton = screen.getByLabelText('Delete game');
        fireEvent.click(deleteButton);

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Test Game Title"?');
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onDelete).toHaveBeenCalledWith('123');

        vi.restoreAllMocks();
    });
});
