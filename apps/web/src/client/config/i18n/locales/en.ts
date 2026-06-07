import enCommon from '@locales/en/common.json';
import enErrors from '@locales/en/errors.json';
import enExecution from '@locales/en/execution.json';
import enHistory from '@locales/en/history.json';
import enHome from '@locales/en/home.json';
import enSettings from '@locales/en/settings.json';
import enSidebar from '@locales/en/sidebar.json';

export const enResources = {
  common: enCommon as Record<string, unknown>,
  home: enHome as Record<string, unknown>,
  settings: enSettings as Record<string, unknown>,
  execution: enExecution as Record<string, unknown>,
  history: enHistory as Record<string, unknown>,
  errors: enErrors as Record<string, unknown>,
  sidebar: enSidebar as Record<string, unknown>,
};
