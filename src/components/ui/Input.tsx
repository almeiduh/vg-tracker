import React from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', id, ...props }, ref) => {
        const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
        return (
            <div className={`input-group ${error ? 'has-error' : ''} ${className}`}>
                <label htmlFor={inputId} className="input-label">{label}</label>
                <input ref={ref} id={inputId} className="input-field glass-card" {...props} />
                {error && <span className="input-error-text">{error}</span>}
            </div>
        );
    }
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, className = '', id, ...props }, ref) => {
        const selectId = id || `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
        return (
            <div className={`input-group ${error ? 'has-error' : ''} ${className}`}>
                <label htmlFor={selectId} className="input-label">{label}</label>
                <select ref={ref} id={selectId} className="input-field glass-card" {...props}>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {error && <span className="input-error-text">{error}</span>}
            </div>
        );
    }
);
Select.displayName = 'Select';
