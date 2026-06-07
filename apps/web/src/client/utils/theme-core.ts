import { applyColorTheme, COLOR_THEME_KEY, isValidColor } from './theme-color.js';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_KEY = 'theme';

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

export function applyClass(resolved: 'light' | 'dark'): void {
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function initEarlyTheme(): void {
  let stored = 'system';
  try {
    stored = localStorage.getItem(THEME_KEY) || 'system';
  } catch (_e) {}
  const preference = (
    ['system', 'light', 'dark'].includes(stored) ? stored : 'system'
  ) as ThemePreference;
  applyClass(resolveTheme(preference));

  let storedColor = 'neutral';
  try {
    const stored = localStorage.getItem(COLOR_THEME_KEY);
    if (stored && isValidColor(stored)) storedColor = stored;
  } catch {}
  applyColorTheme(storedColor);
}
