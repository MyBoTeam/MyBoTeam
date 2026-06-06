/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('input')).toBeInTheDocument();
  });

  it('renders as an input element', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('input')?.tagName).toBe('INPUT');
  });

  it('applies the type prop', () => {
    render(<Input type="email" />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'email');
  });

  it('does not set type when not provided (defaults to text in HTML)', () => {
    const { container } = render(<Input />);
    // When type prop is not passed, React omits the attribute; HTML defaults to "text"
    expect(container.querySelector('input')).not.toHaveAttribute('type');
  });

  it('applies custom className', () => {
    const { container } = render(<Input className="custom" />);
    expect(container.querySelector('input')).toHaveClass('custom');
  });

  it('passes additional props to the input', () => {
    const { container } = render(<Input placeholder="Enter name" />);
    expect(container.querySelector('input')).toHaveAttribute('placeholder', 'Enter name');
  });
});
