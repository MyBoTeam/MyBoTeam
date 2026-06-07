import type { LanguagePreference } from '../../types/storage.js';
import { flushDatabase, getDatabase } from '../database.js';
import { getUiRow } from './ui-settings-common.js';

export const VALID_LANGUAGES: LanguagePreference[] = ['auto', 'en', 'zh-CN', 'ru', 'fr'];

export function getLanguage(): LanguagePreference {
  const row = getUiRow();
  const value = row.language as LanguagePreference;
  if (VALID_LANGUAGES.includes(value)) {
    return value;
  }
  return 'auto';
}

export function setLanguage(language: LanguagePreference): void {
  if (!VALID_LANGUAGES.includes(language)) {
    throw new Error(`Invalid language value: ${language}`);
  }
  const db = getDatabase();
  db.run('UPDATE app_settings SET language = ? WHERE id = 1', [language]);
  flushDatabase();
}
