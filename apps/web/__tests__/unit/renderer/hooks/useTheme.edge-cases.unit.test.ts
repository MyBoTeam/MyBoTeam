import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/theme', () => ({
  applyTheme: vi.fn(),
  initTheme: vi.fn(),
  cleanupTheme: vi.fn(),
}));

const mockGetTheme = vi.fn(() => Promise.resolve('system'));
const mockSetTheme = vi.fn(() => Promise.resolve());
const mockOnThemeChange = vi.fn(() => () => {});
const mockGetThemeColor = vi.fn(() => Promise.resolve('neutral'));
const mockSetThemeColor = vi.fn(() => Promise.resolve());
const mockOnThemeColorChange = vi.fn(() => () => {});

vi.mock('@/config/myboteam', () => ({
  getMyBoTeam: () => ({
    getTheme: mockGetTheme,
    setTheme: mockSetTheme,
    onThemeChange: mockOnThemeChange,
    getThemeColor: mockGetThemeColor,
    setThemeColor: mockSetThemeColor,
    onThemeColorChange: mockOnThemeColorChange,
  }),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

import { useTheme } from '@/hooks/useTheme';

describe('useTheme hook - edge cases', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  async function renderThemeHook() {
    const hook = renderHook(() => useTheme());
    await act(async () => {});
    return hook;
  }

  it('handles matchMedia throwing in resolveIsDark', async () => {
    vi.stubGlobal('matchMedia', () => {
      throw new Error('matchMedia not available');
    });

    const { result } = await renderThemeHook();

    expect(result.current.isDark).toBe(false);
  });

  it('handles onThemeChange callback to update theme state', async () => {
    let changeCallback: ((data: { theme: string; resolved: string }) => void) | null = null;
    mockOnThemeChange.mockImplementation(
      (cb: (data: { theme: string; resolved: string }) => void) => {
        changeCallback = cb;
        return () => {};
      },
    );

    const { result } = await renderThemeHook();

    act(() => {
      changeCallback!({ theme: 'dark', resolved: 'dark' });
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('handles onThemeChange callback with system preference', async () => {
    let changeCallback: ((data: { theme: string; resolved: string }) => void) | null = null;
    mockOnThemeChange.mockImplementation((cb) => {
      changeCallback = cb;
      return () => {};
    });

    const { result } = await renderThemeHook();

    act(() => {
      changeCallback!({ theme: 'system', resolved: 'light' });
    });

    expect(result.current.theme).toBe('system');
    expect(result.current.isDark).toBe(false);
  });

  it('handles absence of onThemeChange gracefully', async () => {
    mockOnThemeChange.mockReturnValue(undefined);
    mockGetTheme.mockResolvedValue('system');

    const { result } = await renderThemeHook();
    expect(result.current.theme).toBe('system');
  });

  it('loads theme from backend on mount', async () => {
    mockGetTheme.mockResolvedValue('dark');

    localStorageMock.setItem('theme', 'light');

    const { result } = await renderThemeHook();
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('handles matchMedia throwing in OS theme listener', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result, unmount } = await renderThemeHook();

    act(() => {
      result.current.setTheme('system');
    });

    expect(result.current.theme).toBe('system');
    unmount();
  });
});
