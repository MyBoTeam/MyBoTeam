import { Badge } from '@myboteam/ui';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Badge', () => {
  it('renders', () => {
    const { container } = render(<Badge>tag</Badge>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom">x</Badge>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders as div by default', () => {
    const { container } = render(<Badge>tag</Badge>);
    expect(container.firstChild?.tagName).toBe('DIV');
  });

  it('renders with variant classes', () => {
    const { container } = render(<Badge variant="destructive">bad</Badge>);
    const el = container.firstChild;
    expect(el?.className).toContain('destructive');
  });

  it('renders with default variant when none specified', () => {
    const { container } = render(<Badge>default</Badge>);
    const el = container.firstChild;
    expect(el?.className).toContain('bg-primary');
  });

  it('renders with children when asChild is passed', () => {
    render(
      <Badge asChild>
        <button>clickable</button>
      </Badge>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
  });
});
