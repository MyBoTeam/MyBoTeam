import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('renders with data-slot="skeleton"', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
  });

  it('renders as a div', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('[data-slot="skeleton"]')?.tagName).toBe('DIV');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom" />);
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass('custom');
  });
});
