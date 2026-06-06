import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COLOR_THEME_KEY } from '@/lib/theme-color';
import { applyClass, initEarlyTheme, resolveTheme, THEME_KEY } from '@/lib/theme-core';

describe('theme-core', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveTheme()', () => {
    it('returns "light" for light preference', () => {
      expect(resolveTheme('light')).toBe('light');
    });

    it('returns "dark" for dark preference', () => {
      expect(resolveTheme('dark')).toBe('dark');
    });

    it('returns "dark" when system prefers dark', () => {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      expect(resolveTheme('system')).toBe('dark');
    });

    it('returns "light" when system prefers light', () => {
      vi.stubGlobal('matchMedia', () => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      expect(resolveTheme('system')).toBe('light');
    });
  });

  describe('applyClass()', () => {
    it('adds "dark" class to documentElement for dark', () => {
      applyClass('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes "dark" class for light', () => {
      document.documentElement.classList.add('dark');
      applyClass('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('initEarlyTheme()', () => {
    it('applies "dark" when stored preference is dark', () => {
      localStorage.setItem(THEME_KEY, 'dark');
      initEarlyTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('applies "light" when stored preference is light', () => {
      localStorage.setItem(THEME_KEY, 'light');
      initEarlyTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('defaults to system when no stored preference', () => {
      vi.stubGlobal('matchMedia', () => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      initEarlyTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('falls back to system when stored preference is invalid', () => {
      localStorage.setItem(THEME_KEY, 'invalid');
      vi.stubGlobal('matchMedia', () => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      initEarlyTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('applies stored color theme when valid', () => {
      localStorage.setItem(THEME_KEY, 'light');
      localStorage.setItem(COLOR_THEME_KEY, 'mint');
      initEarlyTheme();
      expect(document.documentElement.classList.contains('theme-mint')).toBe(true);
    });

    it('uses default color when stored color is invalid', () => {
      localStorage.setItem(THEME_KEY, 'light');
      localStorage.setItem(COLOR_THEME_KEY, 'invalid-color');
      initEarlyTheme();
      expect(document.documentElement.classList.contains('theme-neutral')).toBe(true);
    });
  });
});
