import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Separator } from '@/components/ui/separator';

describe('Separator', () => {
  it('renders with data-slot="separator"', () => {
    const { container } = render(<Separator />);
    expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument();
  });

  it('defaults to horizontal orientation', () => {
    const { container } = render(<Separator />);
    const el = container.querySelector('[data-slot="separator"]');
    expect(el).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />);
    const el = container.querySelector('[data-slot="separator"]');
    expect(el).toHaveAttribute('data-orientation', 'vertical');
  });

  it('renders without crashing when decorative', () => {
    const { container } = render(<Separator decorative={true} />);
    expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument();
  });

  it('renders without crashing when not decorative', () => {
    const { container } = render(<Separator decorative={false} />);
    expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Separator className="custom" />);
    expect(container.querySelector('[data-slot="separator"]')).toHaveClass('custom');
  });
});
