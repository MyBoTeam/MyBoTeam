import { getMyBoTeam } from './myboteam';
import { applyClass, resolveTheme, THEME_KEY, type ThemePreference } from './theme-core';

export type { ThemeColor } from './theme-color.js';
export { applyColorTheme, COLOR_THEME_KEY } from './theme-color.js';

let mediaQuery: MediaQueryList | null = null;
let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;
let themeChangeCleanup: (() => void) | null = null;

function cleanupSystemListener(): void {
  if (mediaQuery && mediaListener) {
    mediaQuery.removeEventListener('change', mediaListener);
    mediaQuery = null;
    mediaListener = null;
  }
}

function setupSystemListener(): void {
  cleanupSystemListener();
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaListener = (e: MediaQueryListEvent) => {
    applyClass(e.matches ? 'dark' : 'light');
  };
  mediaQuery.addEventListener('change', mediaListener);
}

export function applyTheme(preference: string): void {
  const validated = (
    ['system', 'light', 'dark'].includes(preference) ? preference : 'system'
  ) as ThemePreference;

  localStorage.setItem(THEME_KEY, validated);

  const resolved = resolveTheme(validated);
  applyClass(resolved);

  if (validated === 'system') {
    setupSystemListener();
  } else {
    cleanupSystemListener();
  }
}

export function initTheme(): void {
  const myboteam = getMyBoTeam();

  myboteam.getTheme().then((preference) => {
    applyTheme(preference);
  });

  if (myboteam.onThemeChange) {
    themeChangeCleanup = myboteam.onThemeChange(({ theme }) => {
      applyTheme(theme);
    });
  }
}

export function cleanupTheme(): void {
  cleanupSystemListener();
  if (themeChangeCleanup) {
    themeChangeCleanup();
    themeChangeCleanup = null;
  }
}
