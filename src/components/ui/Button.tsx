import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={`btn btn-${variant} btn-${size} ${className}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? <span className="loader"></span> : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
