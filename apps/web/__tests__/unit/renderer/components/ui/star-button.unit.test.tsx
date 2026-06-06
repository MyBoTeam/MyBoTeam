/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

import { StarButton } from '@/components/ui/StarButton';

describe('StarButton', () => {
  it('renders as a button', () => {
    render(<StarButton isFavorite={false} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows aria-pressed false when not favorite', () => {
    render(<StarButton isFavorite={false} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows aria-pressed true when favorite', () => {
    render(<StarButton isFavorite={true} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<StarButton isFavorite={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('prevents default event propagation on click', () => {
    const onToggle = vi.fn();
    render(<StarButton isFavorite={false} onToggle={onToggle} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('sets data-testid when provided', () => {
    render(<StarButton isFavorite={false} onToggle={() => {}} data-testid="star-btn" />);
    expect(screen.getByTestId('star-btn')).toBeInTheDocument();
  });

  it('renders with accessible label', () => {
    render(<StarButton isFavorite={false} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Favorite');
  });
});
