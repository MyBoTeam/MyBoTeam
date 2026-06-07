import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Header from '@/layouts/main/components/Header';

vi.mock('@/config/myboteam', () => {
  const mockMyBoTeam = {
    getTheme: vi.fn().mockResolvedValue('system'),
    setTheme: vi.fn().mockResolvedValue(undefined),
    onThemeChange: undefined,
    onDaemonReconnected: vi.fn().mockReturnValue(() => {}),
    onDaemonReconnectFailed: vi.fn().mockReturnValue(() => {}),
    getBuildCapabilities: vi.fn().mockResolvedValue({ hasFreeMode: true, hasAnalytics: false }),
    isFullScreen: vi.fn().mockResolvedValue(false),
    onFullScreenChanged: vi.fn().mockReturnValue(() => {}),
    getThemeColor: vi.fn().mockResolvedValue('neutral'),
    onThemeColorChange: vi.fn().mockReturnValue(() => {}),
  };
  return {
    getMyBoTeam: () => mockMyBoTeam,
    useMyBoTeam: () => mockMyBoTeam,
  };
});

describe('Header Integration', () => {
  describe('rendering', () => {
    it('should render the header element', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render the logo/brand link', () => {
      // Arrange & Act
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const brandLink = screen.getByRole('link', { name: /myboteam/i });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute('href', '/');
    });

    it('should render the brand text', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('MyBoTeam')).toBeInTheDocument();
    });
  });

  describe('navigation elements', () => {
    it('should render the navigation', () => {
      // Arrange & Act
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render Home navigation link', () => {
      // Arrange & Act
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should render History navigation link', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const historyLink = screen.getByRole('link', { name: /history/i });
      expect(historyLink).toBeInTheDocument();
      expect(historyLink).toHaveAttribute('href', '/history');
    });

    it('should render Settings navigation link', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('should render all three navigation links', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const nav = screen.getByRole('navigation');
      const links = nav.querySelectorAll('a');
      expect(links).toHaveLength(3);
    });
  });

  describe('active state', () => {
    it('should mark Home link as active when on home route', () => {
      // Arrange & Act
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink.className).toContain('bg-accent');
    });

    it('should mark History link as active when on history route', () => {
      render(
        <MemoryRouter initialEntries={['/history']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const historyLink = screen.getByRole('link', { name: /history/i });
      expect(historyLink.className).toContain('bg-accent');
    });

    it('should mark Settings link as active when on settings route', () => {
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink.className).toContain('bg-accent');
    });

    it('should not mark Home link as active when on other routes', () => {
      render(
        <MemoryRouter initialEntries={['/history']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink.className).toContain('text-muted-foreground');
    });

    it('should have nav link styles on all navigation links', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const homeLink = screen.getByRole('link', { name: /^home$/i });
      const historyLink = screen.getByRole('link', { name: /history/i });
      const settingsLink = screen.getByRole('link', { name: /settings/i });

      expect(homeLink.className).toContain('rounded-md');
      expect(historyLink.className).toContain('rounded-md');
      expect(settingsLink.className).toContain('rounded-md');
    });
  });

  describe('layout and structure', () => {
    it('should have drag region class for window dragging', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const header = screen.getByRole('banner');
      expect(header.className).toContain('drag-region');
    });

    it('should have no-drag class on logo link', () => {
      // Arrange & Act
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const brandLink = screen.getByRole('link', { name: /myboteam/i });
      expect(brandLink.className).toContain('no-drag');
    });

    it('should have no-drag class on navigation', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const nav = screen.getByRole('navigation');
      expect(nav.className).toContain('no-drag');
    });

    it('should render logo icon SVG', () => {
      // Arrange & Act
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert
      const brandLink = screen.getByRole('link', { name: /myboteam/i });
      const svg = brandLink.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('deep routes', () => {
    it('should not highlight any nav link on execution routes', () => {
      render(
        <MemoryRouter initialEntries={['/execution/task-123']}>
          <Header />
        </MemoryRouter>,
      );

      // Assert - None of the standard routes should be active
      const homeLink = screen.getByRole('link', { name: /^home$/i });
      const historyLink = screen.getByRole('link', { name: /history/i });
      const settingsLink = screen.getByRole('link', { name: /settings/i });

      expect(homeLink.className).not.toContain('nav-link-active');
      expect(historyLink.className).not.toContain('nav-link-active');
      expect(settingsLink.className).not.toContain('nav-link-active');
    });
  });
});
