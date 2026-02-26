import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/ui/Button';

describe('Button', () => {
    it('renders correctly with children', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('handles click events', () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Click Me</Button>);

        fireEvent.click(screen.getByText('Click Me'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('disables the button when disabled prop is passed', () => {
        render(<Button disabled>Click Me</Button>);
        const button = screen.getByText('Click Me');

        expect(button).toBeDisabled();
    });

    it('disables the button and shows loader when isLoading is true', () => {
        const { container } = render(<Button isLoading>Click Me</Button>);
        const button = screen.getByText('Click Me');

        expect(button).toBeDisabled();
        // Loader span should be present
        expect(container.querySelector('.loader')).toBeInTheDocument();
    });

    it('applies variant and size classes correctly', () => {
        render(<Button variant="danger" size="lg">Delete</Button>);
        const button = screen.getByText('Delete');

        expect(button).toHaveClass('btn', 'btn-danger', 'btn-lg');
    });

    it('passes additional props to the underlying button element', () => {
        render(<Button data-testid="custom-btn" aria-label="Custom Button">Action</Button>);
        const button = screen.getByTestId('custom-btn');

        expect(button).toHaveAttribute('aria-label', 'Custom Button');
    });
});
