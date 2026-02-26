import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameForm } from '../../components/forms/GameForm';
import * as rawgService from '../../lib/rawg';

vi.mock('../../lib/rawg', () => ({
    searchGames: vi.fn(),
    getPlatforms: vi.fn()
}));

describe('GameForm Autocomplete', () => {
    it('shows autocomplete dropdown and autofills form on selection', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC', 'Nintendo Switch']);

        (rawgService.searchGames as any).mockResolvedValue([
            { id: 1, name: 'Test Game Result', background_image: 'cover.jpg', genres: [{ name: 'Action' }], platforms: [{ platform: { name: 'Nintendo Switch' } }] }
        ]);

        render(<GameForm onSubmit={onSubmit} onCancel={onCancel} />);

        // Type in the search input
        const searchInput = screen.getByPlaceholderText('Search for a game...');
        fireEvent.change(searchInput, { target: { value: 'Test' } });
        fireEvent.focus(searchInput);

        // Wait for the debounced search to finish and dropdown to appear
        await waitFor(() => {
            expect(screen.getByText('Test Game Result')).toBeInTheDocument();
        }, { timeout: 1000 });

        // Click the suggestion
        fireEvent.click(screen.getByText('Test Game Result'));

        // Verify autofill applied to the regular inputs
        const titleInput = screen.getByLabelText(/Title \*/i);
        expect(titleInput).toHaveValue('Test Game Result');

        const genresInput = screen.getByLabelText(/Genres \(comma separated\) \*/i);
        expect(genresInput).toHaveValue('Action');

        // Verify cover preview is shown
        const coverPreview = screen.getByAltText('Cover Preview');
        expect(coverPreview).toBeInTheDocument();
        expect(coverPreview).toHaveAttribute('src', 'cover.jpg');

        // Verify Platform options are constrained
        const platformSelect = screen.getByLabelText(/Platform \*/i) as HTMLSelectElement;

        // It should have 'Select a platform...' and 'Nintendo Switch' (2 options)
        expect(platformSelect.options).toHaveLength(2);
        expect(platformSelect.options[1].value).toBe('Nintendo Switch');

        // Ensure PC is no longer an option since the game isn't on PC
        const pcOption = Array.from(platformSelect.options).find(opt => opt.value === 'PC');
        expect(pcOption).toBeUndefined();
    });
});
