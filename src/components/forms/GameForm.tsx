import React, { useState, useEffect, useRef } from 'react';
import { Heart, ListTodo, PlayCircle, PauseCircle, CheckCircle, Monitor, Package, Cloud } from 'lucide-react';
import type { Game, GameStatus, GameFormat } from '../../types/game';
import { Input, Select } from '../ui/Input';
import { PillSelect } from '../ui/PillSelect';
import { StarRating } from '../ui/StarRating';
import { Button } from '../ui/Button';
import { searchGames, getPlatforms } from '../../lib/rawg';
import { searchSteamGridDb, getGameGrids } from '../../lib/steamgriddb';
import type { SteamGridDbGrid } from '../../lib/steamgriddb';

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
    { value: 'Wishlist', label: 'Wishlist', icon: <Heart size={16} />, color: 'var(--accent-pink)' },
    { value: 'Backlog', label: 'Backlog', icon: <ListTodo size={16} />, color: 'var(--warning-alt)' },
    { value: 'Playing', label: 'Playing', icon: <PlayCircle size={16} />, color: 'var(--success)' },
    { value: 'On Hold', label: 'On Hold', icon: <PauseCircle size={16} />, color: 'var(--warning)' },
    { value: 'Played', label: 'Played', icon: <CheckCircle size={16} />, color: 'var(--success)' },
];

const FORMAT_OPTIONS = [
    { value: 'Digital', label: 'Digital', icon: <Monitor size={16} /> },
    { value: 'Physical', label: 'Physical', icon: <Package size={16} /> },
    { value: 'Cloud', label: 'Cloud', icon: <Cloud size={16} /> },
];

export const GameForm: React.FC<GameFormProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        title: '',
        genres: [] as string[],
        platform: '',
        rating: '' as string | number,
        status: 'Backlog' as GameStatus,
        purchasing_price: '0',
        selling_price: '0',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        hours_played: '',
        cover_url: '' as string | null,
        format: 'Digital' as GameFormat
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

    // Transient RAWG average playtime (not persisted)
    const [averagePlaytime, setAveragePlaytime] = useState<number | null>(null);

    // Selected game details from RAWG (display only)
    const [selectedGame, setSelectedGame] = useState<RawgGameResult | null>(null);

    // Cover carousel state
    const [coverOptions, setCoverOptions] = useState<SteamGridDbGrid[]>([]);
    const [selectedCoverIdx, setSelectedCoverIdx] = useState<number | null>(null);
    const [isLoadingCovers, setIsLoadingCovers] = useState(false);

    // Fetch global platforms and genres on mount
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
                cover_url: initialData.cover_url ?? null,
                format: initialData.format ?? 'Digital'
            });

            // In edit mode, try to fetch game details from RAWG based on the title
            searchGames(initialData.title, 1)
                .then(results => {
                    if (results && results.length > 0) {
                        const game = results[0];
                        setSelectedGame(game);
                        setAveragePlaytime(game.playtime > 0 ? game.playtime : null);
                    }
                })
                .catch(console.error);

            // In edit mode, fetch cover options from SteamGridDB
            setIsLoadingCovers(true);
            searchSteamGridDb(initialData.title).then(sgdbGame => {
                if (!sgdbGame) {
                    setIsLoadingCovers(false);
                    return;
                }
                getGameGrids(sgdbGame.id).then(grids => {
                    const options = grids.slice(0, 5);
                    setCoverOptions(options);
                    setIsLoadingCovers(false);
                    setSelectedCoverIdx(options.findIndex(g => g.url === initialData.cover_url));
                });
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
        setSelectedGame(game);

        // Extract restricted platforms
        let gamePlatforms: string[] | null = null;
        if (game.platforms && game.platforms.length > 0) {
            gamePlatforms = game.platforms.map(p => p.platform.name);
            setRestrictedPlatforms(gamePlatforms);
        } else {
            setRestrictedPlatforms(null);
        }

        // Capture average playtime from RAWG (transient, not persisted)
        setAveragePlaytime(game.playtime > 0 ? game.playtime : null);

        setFormData(prev => {
            const isCurrentPlatformValid = gamePlatforms ? gamePlatforms.includes(prev.platform) : true;

            return {
                ...prev,
                title: game.name,
                genres: game.genres.map(g => g.name),
                cover_url: null,
                platform: isCurrentPlatformValid ? prev.platform : ''
            };
        });
        setSearchQuery('');
        setShowDropdown(false);
        setSelectedCoverIdx(null);
        setCoverOptions([]);

        // Fetch cover options from SteamGridDB
        setIsLoadingCovers(true);
        searchSteamGridDb(game.name).then(sgdbGame => {
            if (!sgdbGame) {
                setIsLoadingCovers(false);
                return;
            }
            getGameGrids(sgdbGame.id).then(grids => {
                const options = grids.slice(0, 5);
                setCoverOptions(options);
                setIsLoadingCovers(false);
                if (options.length > 0) {
                    setSelectedCoverIdx(0);
                    setFormData(prev => ({ ...prev, cover_url: options[0].url }));
                }
            });
        });
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

            if (['Playing', 'Played', 'On Hold'].includes(formData.status) && formData.start_date === '') throw new Error('Start date is required');
            if (formData.status === 'Played' && formData.end_date === '') throw new Error('End date is required when status is Played');

            const parsedRating = formData.rating === '' ? null : Number(formData.rating);
            const parsedPurchasingPrice = Number(formData.purchasing_price);
            const parsedSellingPrice = Number(formData.selling_price);

            if (parsedPurchasingPrice < 0) {
                throw new Error('Purchasing price must be greater than or equal to 0');
            }
            if (parsedSellingPrice < 0) {
                throw new Error('Selling price must be greater than or equal to 0');
            }

            let startIso = null;
            if (formData.start_date !== '') {
                const [year, month, day] = formData.start_date.split('-').map(Number);
                const startDate = new Date(year, month - 1, day);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Ignore time variations for date comparison
                if (startDate > today) {
                    throw new Error('Start date cannot be in the future');
                }
                startIso = startDate.toISOString();
            }


            await onSubmit({
                title: formData.title.trim(),
                genres: formData.genres,
                platform: formData.platform.trim(),
                status: formData.status,
                rating: parsedRating,
                purchasing_price: parsedPurchasingPrice,
                selling_price: parsedSellingPrice,
                start_date: startIso,
                end_date: formData.end_date === '' ? null : new Date(formData.end_date).toISOString(),
                hours_played: formData.hours_played === '' ? null : Number(formData.hours_played),
                cover_url: formData.cover_url,
                format: formData.format
            });
        } catch (err: any) {
            setError(err.message || 'Failed to submit form');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="game-form">

            {/* RAWG Autocomplete Search */}
            <div className="form-search-section" ref={searchContainerRef}>
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
                                    <div className="search-dropdown-info">
                                        <span className="search-dropdown-title">{game.name}</span>
                                        <span className="search-dropdown-meta">
                                            {game.genres.map(g => g.name).join(', ')}
                                            {game.platforms && game.platforms.length > 0 && (
                                                <> · {game.platforms.map(p => p.platform.name).join(', ')}</>
                                            )}
                                        </span>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>

            {/* Selected Game Info */}
            {formData.title && (
                <div className="selected-game-info">
                    <div className="selected-game-info-row">
                        <span className="selected-game-info-label">Title</span>
                        <span className="selected-game-info-value">{formData.title}</span>
                    </div>
                    {formData.genres.length > 0 && (
                        <div className="selected-game-info-row">
                            <span className="selected-game-info-label">Genres</span>
                            <span className="selected-game-info-value">{formData.genres.join(', ')}</span>
                        </div>
                    )}
                    {selectedGame?.released && (
                        <div className="selected-game-info-row">
                            <span className="selected-game-info-label">Released</span>
                            <span className="selected-game-info-value">{selectedGame.released}</span>
                        </div>
                    )}
                    {(selectedGame?.metacritic ?? null) !== null && (
                        <div className="selected-game-info-row">
                            <span className="selected-game-info-label">Metacritic</span>
                            <span className="selected-game-info-value">{selectedGame!.metacritic}/100</span>
                        </div>
                    )}
                    {selectedGame?.developers && selectedGame.developers.length > 0 && (
                        <div className="selected-game-info-row">
                            <span className="selected-game-info-label">Developer</span>
                            <span className="selected-game-info-value">{selectedGame.developers.map(d => d.name).join(', ')}</span>
                        </div>
                    )}
                    {selectedGame?.publishers && selectedGame.publishers.length > 0 && (
                        <div className="selected-game-info-row">
                            <span className="selected-game-info-label">Publisher</span>
                            <span className="selected-game-info-value">{selectedGame.publishers.map(p => p.name).join(', ')}</span>
                        </div>
                    )}
                    {selectedGame?.description_raw && (
                        <div className="selected-game-info-description">{selectedGame.description_raw}</div>
                    )}
                    {averagePlaytime !== null && (
                        <div className="selected-game-info-row">
                            <span className="selected-game-info-label">Avg. Time to Beat</span>
                            <span className="selected-game-info-value">{averagePlaytime}h</span>
                        </div>
                    )}
                </div>
            )}

            {/* Cover Carousel */}
            {(coverOptions.length > 0 || isLoadingCovers) && (
                <div className="cover-section col-span-full">
                    <label className="cover-section-label">Cover Image</label>
                    {isLoadingCovers ? (
                        <div className="cover-loading">
                            <Loader2 className="spinner" size={18} />
                            <span>Loading covers...</span>
                        </div>
                    ) : (
                        <>
                            <div className="cover-carousel">
                                {coverOptions.map((grid, idx) => (
                                    <button
                                        key={grid.id}
                                        type="button"
                                        className={`cover-option${selectedCoverIdx === idx ? ' selected' : ''}`}
                                        onClick={() => {
                                            setSelectedCoverIdx(idx);
                                            setFormData(prev => ({ ...prev, cover_url: grid.url }));
                                        }}
                                    >
                                        <img src={grid.thumb || grid.url} alt={`Cover ${idx + 1}`} className="cover-option-img" />
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="form-grid">

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

                <PillSelect
                    label="Status"
                    value={formData.status}
                    onChange={(value) => setFormData(prev => ({ ...prev, status: value as GameStatus }))}
                    options={STATUS_OPTIONS}
                    className="col-span-full"
                />

                <PillSelect
                    label="Format"
                    value={formData.format}
                    onChange={(value) => setFormData(prev => ({ ...prev, format: value as GameFormat }))}
                    options={FORMAT_OPTIONS}
                    className="col-span-full"
                />

                <StarRating
                    label="Rating"
                    value={String(formData.rating)}
                    onChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}
                    className="col-span-full"
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
                    label={`Start Date${['Playing', 'Played', 'On Hold'].includes(formData.status) ? ' *' : ''}`}
                    name="start_date"
                    type="date"
                    required={['Playing', 'Played', 'On Hold'].includes(formData.status)}
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.start_date}
                    onChange={handleChange}
                />

                <Input
                    label="End Date (Finished)"
                    name="end_date"
                    type="date"
                    min={formData.start_date ? (() => { const d = new Date(formData.start_date); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() : undefined}
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

            {error && <div className="form-error glass-panel">{error}</div>}

            <div className="form-actions">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                    {initialData ? 'Update Game' : 'Add Game'}
                </Button>
            </div>
        </form>
    );
};
