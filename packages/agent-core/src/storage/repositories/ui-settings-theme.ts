import type { ThemeColorPreference, ThemePreference } from '../../types/storage.js';
import { flushDatabase, getDatabase } from '../database.js';
import { getUiRow } from './ui-settings-common.js';

export const VALID_THEMES: ThemePreference[] = ['system', 'light', 'dark'];

export const VALID_THEME_COLORS: ThemeColorPreference[] = [
  'mint',
  'blue',
  'lemon',
  'peach',
  'lavender',
  'neutral',
];

export function getTheme(): ThemePreference {
  const row = getUiRow();
  const value = row.theme as ThemePreference;
  if (VALID_THEMES.includes(value)) {
    return value;
  }
  return 'system';
}

export function setTheme(theme: ThemePreference): void {
  if (!VALID_THEMES.includes(theme)) {
    throw new Error(`Invalid theme value: ${theme}`);
  }
  const db = getDatabase();
  db.run('UPDATE app_settings SET theme = ? WHERE id = 1', [theme]);
  flushDatabase();
}

export function getThemeColor(): ThemeColorPreference {
  const row = getUiRow();
  const value = row.theme_color as ThemeColorPreference;
  if (VALID_THEME_COLORS.includes(value)) {
    return value;
  }
  return 'neutral';
}

export function setThemeColor(themeColor: ThemeColorPreference): void {
  if (!VALID_THEME_COLORS.includes(themeColor)) {
    throw new Error(`Invalid theme color value: ${themeColor}`);
  }
  const db = getDatabase();
  db.run('UPDATE app_settings SET theme_color = ? WHERE id = 1', [themeColor]);
  flushDatabase();
}
