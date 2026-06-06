import type { SettingsChangePayload, SettingsSnapshot } from '@myboteam/agent-core';

export const SETTINGS_CHANGED = 'settings.changed' as const;

export type { SettingsChangePayload, SettingsSnapshot };
