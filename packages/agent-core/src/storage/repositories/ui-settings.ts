import type {
  LanguagePreference,
  ThemeColorPreference,
  ThemePreference,
} from '../../types/storage.js';
import { flushDatabase, getDatabase } from '../database.js';
import { rowFromResult } from '../query-helpers.js';

interface AppSettingsUiRow {
  debug_mode: number;
  onboarding_complete: number;
  theme: string;
  theme_color: string;
  notifications_enabled: number;
  close_behavior: string;
  language: string;
}

function getUiRow(): AppSettingsUiRow {
  const db = getDatabase();
  return rowFromResult<AppSettingsUiRow>(
    db.exec(
      'SELECT debug_mode, onboarding_complete, theme, theme_color, notifications_enabled, close_behavior, language FROM app_settings WHERE id = 1',
    ),
  ) as AppSettingsUiRow;
}

export const VALID_THEMES: ThemePreference[] = ['system', 'light', 'dark'];
export const VALID_THEME_COLORS: ThemeColorPreference[] = [
  'mint',
  'blue',
  'lemon',
  'peach',
  'lavender',
  'neutral',
];

export function getDebugMode(): boolean {
  return getUiRow().debug_mode === 1;
}

export function setDebugMode(enabled: boolean): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET debug_mode = ? WHERE id = 1', [enabled ? 1 : 0]);
  flushDatabase();
}

export function setOnboardingComplete(complete: boolean): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET onboarding_complete = ? WHERE id = 1', [complete ? 1 : 0]);
  flushDatabase();
}

export function getOnboardingComplete(): boolean {
  return getUiRow().onboarding_complete === 1;
}

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

export function setNotificationsEnabled(enabled: boolean): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET notifications_enabled = ? WHERE id = 1', [enabled ? 1 : 0]);
  flushDatabase();
}
export function getNotificationsEnabled(): boolean {
  return getUiRow().notifications_enabled === 1;
}

export type CloseBehavior = 'keep-daemon' | 'stop-daemon';

export function getCloseBehavior(): CloseBehavior {
  const row = getUiRow();
  if (row.close_behavior === 'stop-daemon') {
    return 'stop-daemon';
  }
  return 'keep-daemon';
}

export function setCloseBehavior(behavior: CloseBehavior): void {
  if (behavior !== 'keep-daemon' && behavior !== 'stop-daemon') {
    throw new Error(`Invalid close behavior: ${behavior}`);
  }
  const db = getDatabase();
  db.run('UPDATE app_settings SET close_behavior = ? WHERE id = 1', [behavior]);
  flushDatabase();
}

export const VALID_LANGUAGES: LanguagePreference[] = ['auto', 'en', 'zh-CN', 'ru', 'fr'];

/**
 * Returns the user's persisted UI language preference.
 *
 * Validates the stored value against `VALID_LANGUAGES`; returns `'auto'`
 * as a safe default if the stored value is unrecognized or missing.
 */
export function getLanguage(): LanguagePreference {
  const row = getUiRow();
  const value = row.language as LanguagePreference;
  if (VALID_LANGUAGES.includes(value)) {
    return value;
  }
  return 'auto';
}

/**
 * Persists the user's UI language preference to the database.
 *
 * Validates `language` against `VALID_LANGUAGES` and throws if the value
 * is invalid. The value is written directly to the `app_settings` row.
 */
export function setLanguage(language: LanguagePreference): void {
  if (!VALID_LANGUAGES.includes(language)) {
    throw new Error(`Invalid language value: ${language}`);
  }
  const db = getDatabase();
  db.run('UPDATE app_settings SET language = ? WHERE id = 1', [language]);
  flushDatabase();
}
