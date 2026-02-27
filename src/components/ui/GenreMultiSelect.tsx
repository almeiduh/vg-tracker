import React, { useState, useRef, useEffect } from 'react';
import './GenreMultiSelect.css';

interface GenreMultiSelectProps {
    options: string[];
    value: string[];
    onChange: (selected: string[]) => void;
    label?: string;
    id?: string;
    className?: string;
}

export const GenreMultiSelect: React.FC<GenreMultiSelectProps> = ({
    options,
    value,
    onChange,
    label,
    id,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerId = id || 'genre-multi-select';

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

    const toggleGenre = (genre: string) => {
        if (value.includes(genre)) {
            onChange(value.filter(g => g !== genre));
        } else {
            onChange([...value, genre]);
        }
    };

    const removeGenre = (genre: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(g => g !== genre));
    };

    return (
        <div className={`genre-multi-select ${className}`} ref={containerRef}>
            {label && (
                <label htmlFor={triggerId} className="input-label">{label}</label>
            )}
            <button
                type="button"
                id={triggerId}
                className={`genre-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(prev => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                {value.length === 0 ? (
                    <span className="genre-select-placeholder">Select genres…</span>
                ) : (
                    value.map(genre => (
                        <span key={genre} className="genre-chip">
                            {genre}
                            <button
                                type="button"
                                className="genre-chip-remove"
                                onClick={(e) => removeGenre(genre, e)}
                                aria-label={`Remove ${genre}`}
                            >
                                ×
                            </button>
                        </span>
                    ))
                )}
            </button>

            {isOpen && (
                <div className="genre-dropdown-panel" role="listbox" aria-multiselectable="true">
                    {options.length === 0 ? (
                        <div className="genre-dropdown-empty">No genres available</div>
                    ) : (
                        options.map(genre => {
                            const isSelected = value.includes(genre);
                            return (
                                <div
                                    key={genre}
                                    className={`genre-dropdown-item ${isSelected ? 'selected' : ''}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => toggleGenre(genre)}
                                >
                                    <span className="genre-checkbox">
                                        <span className="genre-checkbox-check">✓</span>
                                    </span>
                                    {genre}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};
