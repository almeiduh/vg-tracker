import React, { useState, useEffect } from 'react';
import type { Game, GameStatus } from '../../types/game';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
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
        genre: '',
        platform: '',
        rating: '' as string | number,
        status: 'Backlog' as GameStatus,
        purchasing_price: '',
        selling_price: '',
        start_date: '',
        end_date: '',
        hours_played: ''
    });

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                genre: initialData.genre,
                platform: initialData.platform,
                rating: initialData.rating ?? '',
                status: initialData.status,
                purchasing_price: initialData.purchasing_price?.toString() ?? '',
                selling_price: initialData.selling_price?.toString() ?? '',
                start_date: initialData.start_date ? initialData.start_date.split('T')[0] : '',
                end_date: initialData.end_date ? initialData.end_date.split('T')[0] : '',
                hours_played: initialData.hours_played?.toString() ?? ''
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (!formData.title.trim()) throw new Error('Title is required');
            if (!formData.genre.trim()) throw new Error('Genre is required');
            if (!formData.platform.trim()) throw new Error('Platform is required');

            await onSubmit({
                title: formData.title.trim(),
                genre: formData.genre.trim(),
                platform: formData.platform.trim(),
                status: formData.status,
                rating: formData.rating === '' ? null : Number(formData.rating),
                purchasing_price: formData.purchasing_price === '' ? null : Number(formData.purchasing_price),
                selling_price: formData.selling_price === '' ? null : Number(formData.selling_price),
                start_date: formData.start_date === '' ? null : new Date(formData.start_date).toISOString(),
                end_date: formData.end_date === '' ? null : new Date(formData.end_date).toISOString(),
                hours_played: formData.hours_played === '' ? null : Number(formData.hours_played)
            });
        } catch (err: any) {
            setError(err.message || 'Failed to submit form');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="game-form">
            {error && <div className="form-error glass-panel">{error}</div>}

            <div className="form-grid">
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
                    label="Genre *"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Action RPG"
                />

                <Input
                    label="Platform *"
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Nintendo Switch"
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
