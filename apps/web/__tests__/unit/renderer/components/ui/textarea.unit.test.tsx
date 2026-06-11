import { Textarea } from '@myboteam/ui';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Textarea', () => {
  it('renders with data-slot="textarea"', () => {
    const { container } = render(<Textarea />);
    expect(container.querySelector('[data-slot="textarea"]')).toBeInTheDocument();
  });

  it('renders as a textarea element', () => {
    const { container } = render(<Textarea />);
    expect(container.querySelector('[data-slot="textarea"]')?.tagName).toBe('TEXTAREA');
  });

  it('applies custom className', () => {
    const { container } = render(<Textarea className="custom" />);
    expect(container.querySelector('[data-slot="textarea"]')).toHaveClass('custom');
  });

  it('passes additional props', () => {
    const { container } = render(<Textarea placeholder="Enter text" rows={4} />);
    const el = container.querySelector('[data-slot="textarea"]');
    expect(el).toHaveAttribute('placeholder', 'Enter text');
    expect(el).toHaveAttribute('rows', '4');
  });
});
