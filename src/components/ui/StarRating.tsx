import React, { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

interface StarRatingProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ label, value, onChange, className = '' }) => {
    const [hovered, setHovered] = useState(0);
    const selected = value === '' ? 0 : Number(value);

    return (
        <div className={`star-rating-group ${className}`}>
            <span className="input-label">{label}</span>
            <div className="star-rating-row">
                {Array.from({ length: 10 }, (_, i) => {
                    const starIdx = i + 1;
                    const filled = starIdx <= (hovered || selected);

                    return (
                        <button
                            key={starIdx}
                            type="button"
                            className={`star-btn${filled ? ' star-filled' : ''}`}
                            onClick={() => onChange(starIdx === selected ? '' : String(starIdx))}
                            onMouseEnter={() => setHovered(starIdx)}
                            onMouseLeave={() => setHovered(0)}
                            aria-label={`Rate ${starIdx} out of 10`}
                        >
                            <Star
                                size={22}
                                strokeWidth={1.5}
                                fill={filled ? 'var(--accent-blue)' : 'none'}
                                color={filled ? 'var(--accent-blue)' : 'var(--text-muted)'}
                            />
                        </button>
                    );
                })}
                {selected > 0 && (
                    <span className="star-rating-value">{selected}/10</span>
                )}
            </div>
        </div>
    );
};
