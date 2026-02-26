import React, { useState, useEffect, useRef } from 'react';
import type { Game, GameStatus } from '../../types/game';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { searchGames, getPlatforms } from '../../lib/rawg';
import type { RawgGameResult } from '../../lib/rawg';
import { Search, Loader2 } from 'lucide-react';
import './GameForm.css';

interface GameFormProps {
    initialData?: Game;
    onSubmit: (data: Omit<Game, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

const STATUS_OPTIONS = [
    { value: 'Backlog', label: 'Backlog' },
    { value: 'Playing', label: 'Playing' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Played', label: 'Played' },
];

export const GameForm: React.FC<GameFormProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        title: '',
        genres: [] as string[],
        platform: '',
        rating: '' as string | number,
        status: 'Backlog' as GameStatus,
        purchasing_price: '',
        selling_price: '',
        start_date: '',
        end_date: '',
        hours_played: '',
        cover_url: '' as string | null
    });

    const [error, setError] = useState<string | null>(null);

    // Autocomplete state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<RawgGameResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Platform constraint state
    const [platformOptions, setPlatformOptions] = useState<{ value: string, label: string }[]>([]);
    const [restrictedPlatforms, setRestrictedPlatforms] = useState<string[] | null>(null);

    // Fetch global platforms on mount
    useEffect(() => {
        getPlatforms().then(platforms => {
            const options = platforms.map(p => ({ value: p, label: p }));
            // Ensure some common fallbacks if API fails or is empty
            if (options.length === 0) {
                options.push(
                    { value: 'PC', label: 'PC' },
                    { value: 'PlayStation 5', label: 'PlayStation 5' },
                    { value: 'Nintendo Switch', label: 'Nintendo Switch' },
                    { value: 'Xbox Series X', label: 'Xbox Series X' }
                );
            }
            setPlatformOptions(options);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                genres: initialData.genres || [],
                platform: initialData.platform,
                rating: initialData.rating ?? '',
                status: initialData.status,
                purchasing_price: initialData.purchasing_price?.toString() ?? '',
                selling_price: initialData.selling_price?.toString() ?? '',
                start_date: initialData.start_date ? initialData.start_date.split('T')[0] : '',
                end_date: initialData.end_date ? initialData.end_date.split('T')[0] : '',
                hours_played: initialData.hours_played?.toString() ?? '',
                cover_url: initialData.cover_url ?? null
            });
        }
    }, [initialData]);

    // Handle clicking outside autocomplete dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setShowDropdown(true);

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        searchDebounceRef.current = setTimeout(async () => {
            try {
                const results = await searchGames(query);
                setSearchResults(results);
            } catch (err) {
                console.error("Failed to fetch search results", err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce
    };

    const handleSelectGame = (game: RawgGameResult) => {
        // Extract restricted platforms
        let gamePlatforms: string[] | null = null;
        if (game.platforms && game.platforms.length > 0) {
            gamePlatforms = game.platforms.map(p => p.platform.name);
            setRestrictedPlatforms(gamePlatforms);
        } else {
            setRestrictedPlatforms(null);
        }

        setFormData(prev => {
            // Check if current platform is valid in the new restricted list
            const isCurrentPlatformValid = gamePlatforms ? gamePlatforms.includes(prev.platform) : true;

            return {
                ...prev,
                title: game.name,
                genres: game.genres.map(g => g.name),
                cover_url: game.background_image,
                platform: isCurrentPlatformValid ? prev.platform : ''
            };
        });
        setSearchQuery('');
        setShowDropdown(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (!formData.title.trim()) throw new Error('Title is required');
            if (formData.genres.length === 0) throw new Error('At least one genre is required');
            if (!formData.platform.trim()) throw new Error('Platform is required');

            await onSubmit({
                title: formData.title.trim(),
                genres: formData.genres,
                platform: formData.platform.trim(),
                status: formData.status,
                rating: formData.rating === '' ? null : Number(formData.rating),
                purchasing_price: formData.purchasing_price === '' ? null : Number(formData.purchasing_price),
                selling_price: formData.selling_price === '' ? null : Number(formData.selling_price),
                start_date: formData.start_date === '' ? null : new Date(formData.start_date).toISOString(),
                end_date: formData.end_date === '' ? null : new Date(formData.end_date).toISOString(),
                hours_played: formData.hours_played === '' ? null : Number(formData.hours_played),
                cover_url: formData.cover_url
            });
        } catch (err: any) {
            setError(err.message || 'Failed to submit form');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="game-form">
            {error && <div className="form-error glass-panel">{error}</div>}

            {/* RAWG Autocomplete Search */}
            <div className="form-search-section glass-panel" ref={searchContainerRef}>
                <label className="input-label">Auto-fill from RAWG Database</label>
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="form-input search-input"
                        placeholder="Search for a game..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => setShowDropdown(true)}
                    />
                    {isSearching && <Loader2 className="search-loader spinner" size={18} />}
                </div>

                {showDropdown && searchQuery.trim().length > 0 && (
                    <ul className="search-dropdown glass-card">
                        {!isSearching && searchResults.length === 0 ? (
                            <li className="search-dropdown-item empty">No games found</li>
                        ) : (
                            searchResults.map(game => (
                                <li
                                    key={game.id}
                                    className="search-dropdown-item"
                                    onClick={() => handleSelectGame(game)}
                                >
                                    {game.background_image && (
                                        <img src={game.background_image} alt={game.name} className="search-dropdown-img" />
                                    )}
                                    <div className="search-dropdown-info">
                                        <span className="search-dropdown-title">{game.name}</span>
                                        <span className="search-dropdown-genres">
                                            {game.genres.map(g => g.name).join(', ')}
                                        </span>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>

            <div className="form-grid">
                {/* Cover Preview (if selected) */}
                {formData.cover_url && (
                    <div className="cover-preview-container col-span-full">
                        <img src={formData.cover_url} alt="Cover Preview" className="form-cover-preview" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, cover_url: null }))}
                            className="remove-cover-btn danger-hover"
                        >
                            Remove Cover
                        </Button>
                    </div>
                )}

                <Input
                    label="Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g. The Legend of Zelda: Tears of the Kingdom"
                    className="col-span-full"
                />

                <Input
                    label="Genres (comma separated) *"
                    name="genres"
                    value={formData.genres.join(', ')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, genres: val.split(',').map(g => g.trim()).filter(Boolean) }));
                    }}
                    required
                    placeholder="e.g. Action RPG, Fantasy"
                />

                <Select
                    label="Platform *"
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    required
                    options={[
                        { value: '', label: 'Select a platform...' },
                        ...platformOptions.filter(opt =>
                            !restrictedPlatforms || restrictedPlatforms.includes(opt.value)
                        )
                    ]}
                />

                <Select
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={STATUS_OPTIONS}
                />

                <Input
                    label="Rating (1-10)"
                    name="rating"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.rating}
                    onChange={handleChange}
                />

                <Input
                    label="Purchasing Price (€)"
                    name="purchasing_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasing_price}
                    onChange={handleChange}
                />

                <Input
                    label="Selling Price (€)"
                    name="selling_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={handleChange}
                />

                <Input
                    label="Start Date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                />

                <Input
                    label="End Date (Finished)"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                />

                <Input
                    label="Hours Played"
                    name="hours_played"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.hours_played}
                    onChange={handleChange}
                />
            </div>

            <div className="form-actions">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                    {initialData ? 'Update Game' : 'Add Game'}
                </Button>
            </div>
        </form>
    );
};
