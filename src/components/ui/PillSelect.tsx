import React from 'react';
import './PillSelect.css';

export interface PillOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    color?: string;
}

interface PillSelectProps {
    label: string;
    name?: string;
    value: string;
    onChange: (value: string) => void;
    options: PillOption[];
    required?: boolean;
    className?: string;
}

export const PillSelect: React.FC<PillSelectProps> = ({
    label,
    name,
    value,
    onChange,
    options,
    required,
    className = ''
}) => {
    return (
        <div className={`pill-select-group ${className}`}>
            <span className="input-label">
                {label}
                {required && ' *'}
            </span>
            <div className="pill-select-options" role="radiogroup" aria-label={label}>
                {options.map((opt) => {
                    const isSelected = value === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`pill-option${isSelected ? ' pill-selected' : ''}`}
                            onClick={() => onChange(opt.value)}
                            name={name}
                            style={opt.color ? { '--pill-color': opt.color } as React.CSSProperties : undefined}
                        >
                            {opt.icon && <span className="pill-icon">{opt.icon}</span>}
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
