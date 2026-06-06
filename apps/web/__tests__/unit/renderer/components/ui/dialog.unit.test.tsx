/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DialogFooter, DialogHeader } from '@/components/ui/dialog';

describe('DialogHeader', () => {
  it('renders with data-slot="dialog-header"', () => {
    const { container } = render(<DialogHeader>header</DialogHeader>);
    expect(container.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<DialogHeader>My Header</DialogHeader>);
    expect(screen.getByText('My Header')).toBeInTheDocument();
  });
});

describe('DialogFooter', () => {
  it('renders with data-slot="dialog-footer"', () => {
    const { container } = render(<DialogFooter>footer</DialogFooter>);
    expect(container.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<DialogFooter>Actions</DialogFooter>);
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
