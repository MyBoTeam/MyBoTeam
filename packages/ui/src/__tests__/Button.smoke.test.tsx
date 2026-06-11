import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui/button';

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-destructive/10');
  });

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button', { name: /outline/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('border-border');
  });

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button', { name: /ghost/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('hover:bg-muted');
  });

  it('renders with link variant', () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole('button', { name: /link/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('text-primary');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button', { name: /small/i })).toHaveClass('h-7');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button', { name: /large/i })).toHaveClass('h-9');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button', { name: /icon/i })).toHaveClass('size-8');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button', { name: /custom/i })).toHaveClass('custom-class');
  });

  it('forwards additional props', () => {
    render(
      <Button data-testid="test-btn" disabled>
        Disabled
      </Button>,
    );
    const button = screen.getByTestId('test-btn');
    expect(button).toBeDisabled();
  });
});
