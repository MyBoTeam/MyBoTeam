import { flushDatabase, getDatabase } from '../database.js';
import { getUiRow } from './ui-settings-common.js';

export {
  getDebugMode,
  getOnboardingComplete,
  setDebugMode,
  setOnboardingComplete,
} from './ui-settings-debug.js';

export {
  getLanguage,
  setLanguage,
  VALID_LANGUAGES,
} from './ui-settings-language.js';

export {
  getTheme,
  getThemeColor,
  setTheme,
  setThemeColor,
  VALID_THEME_COLORS,
  VALID_THEMES,
} from './ui-settings-theme.js';

export type CloseBehavior = 'keep-daemon' | 'stop-daemon';

export function getNotificationsEnabled(): boolean {
  return getUiRow().notifications_enabled === 1;
}

export function setNotificationsEnabled(enabled: boolean): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET notifications_enabled = ? WHERE id = 1', [enabled ? 1 : 0]);
  flushDatabase();
}

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
