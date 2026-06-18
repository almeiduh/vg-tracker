import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameForm } from '../../components/forms/GameForm';
import * as rawgService from '../../lib/rawg';

vi.mock('../../lib/rawg', () => ({
    searchGames: vi.fn(),
    getPlatforms: vi.fn(),
    getGenres: vi.fn()
}));

vi.mock('../../lib/steamgriddb', () => ({
    getBestCoverUrl: vi.fn().mockResolvedValue(null),
}));

describe('GameForm Autocomplete', () => {
    it('shows autocomplete dropdown and autofills form on selection', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC', 'Nintendo Switch']);
        (rawgService.getGenres as any).mockResolvedValue(['Action', 'RPG', 'Adventure']);

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

        // Verify genres auto-filled as chips
        expect(screen.getByText('Action')).toBeInTheDocument();

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

describe('GameForm GenreMultiSelect', () => {
    it('renders genre options fetched from RAWG in the dropdown', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC']);
        (rawgService.getGenres as any).mockResolvedValue(['Action', 'RPG', 'Adventure']);
        (rawgService.searchGames as any).mockResolvedValue([]);

        render(<GameForm onSubmit={onSubmit} onCancel={onCancel} />);

        // Wait for genres to load
        await waitFor(() => {
            expect(rawgService.getGenres).toHaveBeenCalled();
        });

        // Open the genre dropdown
        const genreTrigger = screen.getByText('Select genres…');
        fireEvent.click(genreTrigger);

        // All options should be visible
        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('RPG')).toBeInTheDocument();
        expect(screen.getByText('Adventure')).toBeInTheDocument();
    });

    it('allows selecting and deselecting genres', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC']);
        (rawgService.getGenres as any).mockResolvedValue(['Action', 'RPG']);
        (rawgService.searchGames as any).mockResolvedValue([]);

        render(<GameForm onSubmit={onSubmit} onCancel={onCancel} />);

        // Wait for genres to load
        await waitFor(() => {
            expect(rawgService.getGenres).toHaveBeenCalled();
        });

        // Open dropdown and select Action
        const genreTrigger = screen.getByText('Select genres…');
        fireEvent.click(genreTrigger);

        const actionOption = screen.getByRole('option', { name: /Action/i });
        fireEvent.click(actionOption);

        // The chip should appear in the trigger (along with possibly the dropdown option)
        const actionChips = screen.getAllByText('Action');
        expect(actionChips.length).toBeGreaterThan(0);

        // Deselect it via the remove button on the chip
        const removeBtn = screen.getByLabelText('Remove Action');
        fireEvent.click(removeBtn);

        // Should show placeholder again
        expect(screen.getByText('Select genres…')).toBeInTheDocument();
    });
});

describe('GameForm Validations', () => {
    it('shows error if purchasing price is negative', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC']);
        (rawgService.getGenres as any).mockResolvedValue(['Action']);

        render(<GameForm onSubmit={onSubmit} onCancel={onCancel} />);

        // Wait for required data
        await waitFor(() => {
            expect(rawgService.getPlatforms).toHaveBeenCalled();
        });

        // Fill required fields
        fireEvent.change(screen.getByLabelText(/Title \*/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/Platform \*/i), { target: { value: 'PC' } });

        // Add a genre
        const genreTrigger = screen.getByText('Select genres…');
        fireEvent.click(genreTrigger);
        fireEvent.click(screen.getByRole('option', { name: /Action/i }));

        // Fill other required fields
        fireEvent.change(screen.getByLabelText(/Selling Price/i), { target: { value: '0' } });

        // Insert invalid negative purchasing price
        const priceInput = screen.getByLabelText(/Purchasing Price/i);
        fireEvent.change(priceInput, { target: { value: '-5' } });

        // Submit form
        fireEvent.submit(screen.getByText('Add Game').closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Purchasing price must be greater than or equal to 0')).toBeInTheDocument();
        });

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows error if selling price is negative', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC']);
        (rawgService.getGenres as any).mockResolvedValue(['Action']);

        render(<GameForm onSubmit={onSubmit} onCancel={onCancel} />);

        // Wait for required data
        await waitFor(() => {
            expect(rawgService.getPlatforms).toHaveBeenCalled();
        });

        // Fill required fields
        fireEvent.change(screen.getByLabelText(/Title \*/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/Platform \*/i), { target: { value: 'PC' } });

        // Add a genre
        const genreTrigger = screen.getByText('Select genres…');
        fireEvent.click(genreTrigger);
        fireEvent.click(screen.getByRole('option', { name: /Action/i }));

        // Fill other required fields
        fireEvent.change(screen.getByLabelText(/Purchasing Price/i), { target: { value: '0' } });

        // Insert invalid negative selling price
        const priceInput = screen.getByLabelText(/Selling Price/i);
        fireEvent.change(priceInput, { target: { value: '-10' } });

        // Submit form
        fireEvent.submit(screen.getByText('Add Game').closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Selling price must be greater than or equal to 0')).toBeInTheDocument();
        });

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows error if start date is in the future', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC']);
        (rawgService.getGenres as any).mockResolvedValue(['Action']);

        render(<GameForm onSubmit={onSubmit} onCancel={onCancel} />);

        // Wait for required data
        await waitFor(() => {
            expect(rawgService.getPlatforms).toHaveBeenCalled();
        });

        // Fill required fields
        fireEvent.change(screen.getByLabelText(/Title \*/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/Platform \*/i), { target: { value: 'PC' } });

        // Add a genre
        const genreTrigger = screen.getByText('Select genres…');
        fireEvent.click(genreTrigger);
        fireEvent.click(screen.getByRole('option', { name: /Action/i }));

        // Fill other required fields
        fireEvent.change(screen.getByLabelText(/Purchasing Price/i), { target: { value: '0' } });
        fireEvent.change(screen.getByLabelText(/Selling Price/i), { target: { value: '0' } });

        // Insert future start date (tomorrow)
        const dateInput = screen.getByLabelText(/Start Date/i);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        fireEvent.change(dateInput, { target: { value: tomorrow.toISOString().split('T')[0] } });

        // Submit form
        fireEvent.submit(screen.getByText('Add Game').closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Start date cannot be in the future')).toBeInTheDocument();
        });

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('defaults purchasing or selling price to 0 if missing', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC']);
        (rawgService.getGenres as any).mockResolvedValue(['Action']);

        render(<GameForm onSubmit={onSubmit} onCancel={onCancel} />);

        await waitFor(() => {
            expect(rawgService.getPlatforms).toHaveBeenCalled();
        });

        fireEvent.change(screen.getByLabelText(/Title \*/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/Platform \*/i), { target: { value: 'PC' } });

        fireEvent.click(screen.getByText('Select genres…'));
        fireEvent.click(screen.getByRole('option', { name: /Action/i }));

        // Clear the form value since there are defaults
        const purchasingInput = screen.getByLabelText(/Purchasing Price/i);
        const sellingInput = screen.getByLabelText(/Selling Price/i);
        fireEvent.change(purchasingInput, { target: { value: '' } });
        fireEvent.change(sellingInput, { target: { value: '' } });

        // Submit form
        fireEvent.submit(screen.getByText('Add Game').closest('form')!);

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
                purchasing_price: 0,
                selling_price: 0,
                format: 'Digital'
            }));
        });
    });

    it('restricts end date to be after start date via min attribute', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC']);
        (rawgService.getGenres as any).mockResolvedValue(['Action']);

        render(<GameForm onSubmit={onSubmit} onCancel={onCancel} />);

        await waitFor(() => {
            expect(rawgService.getPlatforms).toHaveBeenCalled();
        });

        // Set start date
        fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-02-15' } });

        // End date input should have min set to 2026-02-16 (start + 1 day)
        const endDateInput = screen.getByLabelText(/End Date/i);
        expect(endDateInput).toHaveAttribute('min', '2026-02-16');
    });
});
