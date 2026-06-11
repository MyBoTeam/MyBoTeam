import { ScrollArea } from '@myboteam/ui';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ScrollArea', () => {
  it('renders children', () => {
    render(<ScrollArea>content</ScrollArea>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders as a div', () => {
    const { container } = render(<ScrollArea>test</ScrollArea>);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ScrollArea className="custom">x</ScrollArea>);
    expect(screen.getByText('x')).toHaveClass('custom');
    expect(screen.getByText('x')).toHaveClass('overflow-y-auto');
  });
});
