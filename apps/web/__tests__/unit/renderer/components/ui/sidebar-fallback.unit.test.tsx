import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: () => 'Loading...',
  }),
}));

import { SidebarFallback } from '@/components/layout/SidebarFallback';

describe('SidebarFallback', () => {
  it('renders loading message', () => {
    render(<SidebarFallback />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
