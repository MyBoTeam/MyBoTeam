import { flushDatabase, getDatabase } from '../database.js';
import { getUiRow } from './ui-settings-common.js';

export function getDebugMode(): boolean {
  return getUiRow().debug_mode === 1;
}

export function setDebugMode(enabled: boolean): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET debug_mode = ? WHERE id = 1', [enabled ? 1 : 0]);
  flushDatabase();
}

export function getOnboardingComplete(): boolean {
  return getUiRow().onboarding_complete === 1;
}

export function setOnboardingComplete(complete: boolean): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET onboarding_complete = ? WHERE id = 1', [complete ? 1 : 0]);
  flushDatabase();
}
