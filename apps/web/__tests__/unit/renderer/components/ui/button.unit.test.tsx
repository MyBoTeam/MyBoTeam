import { Button } from '@myboteam/ui';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Button', () => {
  it('renders as button by default', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Click me');
  });

  it('renders as a slot child when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link button</a>
      </Button>,
    );
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('Link button');
    expect(link).toHaveAttribute('data-slot', 'button');
  });

  it('applies variant and size classes', () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('bg-destructive');
  });
});
