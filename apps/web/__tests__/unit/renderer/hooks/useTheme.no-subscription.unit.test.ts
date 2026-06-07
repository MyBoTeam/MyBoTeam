import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/theme', () => ({
  applyTheme: vi.fn(),
  initTheme: vi.fn(),
  cleanupTheme: vi.fn(),
}));

const mockGetThemeFails = vi.fn(() => Promise.reject(new Error('not available')));

vi.mock('@/lib/myboteam', () => ({
  getMyBoTeam: () => ({
    getTheme: mockGetThemeFails,
    setTheme: vi.fn(),
    getThemeColor: vi.fn(() => Promise.reject(new Error('not available'))),
    setThemeColor: vi.fn(),
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

describe('useTheme hook - without subscription', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  async function renderThemeHook() {
    const hook = renderHook(() => useTheme());
    await act(async () => {});
    return hook;
  }

  it('handles getTheme failure gracefully', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = await renderThemeHook();

    expect(result.current.theme).toBe('system');
    expect(result.current.isDark).toBe(false);
  });
});
