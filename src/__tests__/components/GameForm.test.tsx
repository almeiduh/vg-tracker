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
    searchSteamGridDb: vi.fn().mockResolvedValue(null),
    getGameGrids: vi.fn().mockResolvedValue([]),
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

        // Verify search result shows platforms in metadata
        expect(screen.getByText(/Nintendo Switch/)).toBeInTheDocument();

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

describe('GameForm Cover Carousel', () => {
    it('fetches and displays cover options from SteamGridDB after selecting a game', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC', 'Nintendo Switch']);
        (rawgService.getGenres as any).mockResolvedValue(['Action', 'RPG', 'Adventure']);
        (rawgService.searchGames as any).mockResolvedValue([
            { id: 1, name: 'Test Game Result', background_image: null, genres: [{ name: 'Action' }], platforms: [{ platform: { name: 'Nintendo Switch' } }] }
        ]);

        const steamgriddb = await import('../../lib/steamgriddb');
        (steamgriddb.searchSteamGridDb as any).mockResolvedValue({ id: 42, name: 'Test Game Result', types: ['grid'] });
        (steamgriddb.getGameGrids as any).mockResolvedValue([
            { id: 1, url: 'https://cdn.example.com/cover1.jpg', thumb: 'https://cdn.example.com/thumb1.jpg', dimensions: '600x900' },
            { id: 2, url: 'https://cdn.example.com/cover2.jpg', thumb: 'https://cdn.example.com/thumb2.jpg', dimensions: '600x900' },
            { id: 3, url: 'https://cdn.example.com/cover3.jpg', thumb: 'https://cdn.example.com/thumb3.jpg', dimensions: '342x482' },
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

        // Wait for cover carousel to appear
        await waitFor(() => {
            expect(screen.getByText('Cover Image')).toBeInTheDocument();
        });

        // Should show 3 cover options
        const coverImages = screen.getAllByRole('button').filter(
            btn => btn.classList.contains('cover-option')
        );
        expect(coverImages).toHaveLength(3);

        // Click the second cover option
        fireEvent.click(coverImages[1]);

        // Selected class should be on the second option
        expect(coverImages[1].classList.contains('selected')).toBe(true);
        expect(coverImages[0].classList.contains('selected')).toBe(false);
    });

    it('shows loading state while fetching covers', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC']);
        (rawgService.getGenres as any).mockResolvedValue(['Action']);
        (rawgService.searchGames as any).mockResolvedValue([
            { id: 1, name: 'Test Game', background_image: null, genres: [{ name: 'Action' }], platforms: [] }
        ]);

        const steamgriddb = await import('../../lib/steamgriddb');
        // Don't resolve immediately to see loading state
        (steamgriddb.searchSteamGridDb as any).mockImplementation(() => new Promise(() => {}));

        render(<GameForm onSubmit={onSubmit} onCancel={onCancel} />);

        // Search and select a game
        const searchInput = screen.getByPlaceholderText('Search for a game...');
        fireEvent.change(searchInput, { target: { value: 'Test' } });
        fireEvent.focus(searchInput);

        await waitFor(() => {
            expect(screen.getByText('Test Game')).toBeInTheDocument();
        }, { timeout: 1000 });

        fireEvent.click(screen.getByText('Test Game'));

        // Should show loading state
        await waitFor(() => {
            expect(screen.getByText('Loading covers...')).toBeInTheDocument();
        });
    });
});

async function selectGameViaRawg(name: string = 'Test Game') {
    (rawgService.searchGames as any).mockResolvedValue([
        { id: 1, name, background_image: null, genres: [{ name: 'Action' }], platforms: [{ platform: { name: 'PC' } }] }
    ]);

    const searchInput = screen.getByPlaceholderText('Search for a game...');
    fireEvent.change(searchInput, { target: { value: name } });
    fireEvent.focus(searchInput);

    await waitFor(() => {
        expect(screen.getByText(name)).toBeInTheDocument();
    }, { timeout: 1000 });

    fireEvent.click(screen.getByText(name));

    // Select the constrained platform
    fireEvent.change(screen.getByLabelText(/Platform \*/i), { target: { value: 'PC' } });
}

describe('GameForm Validations', () => {
    it('shows error if purchasing price is negative', async () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        (rawgService.getPlatforms as any).mockResolvedValue(['PC']);
        (rawgService.getGenres as any).mockResolvedValue(['Action']);

        render(<GameForm onSubmit={onSubmit} onCancel={onCancel} />);

        await waitFor(() => {
            expect(rawgService.getPlatforms).toHaveBeenCalled();
        });

        await selectGameViaRawg();

        fireEvent.change(screen.getByLabelText(/Selling Price/i), { target: { value: '0' } });

        const priceInput = screen.getByLabelText(/Purchasing Price/i);
        fireEvent.change(priceInput, { target: { value: '-5' } });

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

        await waitFor(() => {
            expect(rawgService.getPlatforms).toHaveBeenCalled();
        });

        await selectGameViaRawg();

        fireEvent.change(screen.getByLabelText(/Purchasing Price/i), { target: { value: '0' } });

        const priceInput = screen.getByLabelText(/Selling Price/i);
        fireEvent.change(priceInput, { target: { value: '-10' } });

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

        await waitFor(() => {
            expect(rawgService.getPlatforms).toHaveBeenCalled();
        });

        await selectGameViaRawg();

        fireEvent.change(screen.getByLabelText(/Purchasing Price/i), { target: { value: '0' } });
        fireEvent.change(screen.getByLabelText(/Selling Price/i), { target: { value: '0' } });

        const dateInput = screen.getByLabelText(/Start Date/i);
        fireEvent.change(dateInput, { target: { value: '2030-06-15' } });

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

        await selectGameViaRawg();

        const purchasingInput = screen.getByLabelText(/Purchasing Price/i);
        const sellingInput = screen.getByLabelText(/Selling Price/i);
        fireEvent.change(purchasingInput, { target: { value: '' } });
        fireEvent.change(sellingInput, { target: { value: '' } });

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

        fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-02-15' } });

        const endDateInput = screen.getByLabelText(/End Date/i);
        expect(endDateInput).toHaveAttribute('min', '2026-02-16');
    });
});
