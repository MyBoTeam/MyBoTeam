import { getDatabase } from '../database.js';
import { rowFromResult } from '../query-helpers.js';

export interface AppSettingsUiRow {
  debug_mode: number;
  onboarding_complete: number;
  theme: string;
  theme_color: string;
  notifications_enabled: number;
  close_behavior: string;
  language: string;
}

export function getUiRow(): AppSettingsUiRow {
  const db = getDatabase();
  return rowFromResult<AppSettingsUiRow>(
    db.exec(
      'SELECT debug_mode, onboarding_complete, theme, theme_color, notifications_enabled, close_behavior, language FROM app_settings WHERE id = 1',
    ),
  ) as AppSettingsUiRow;
}
