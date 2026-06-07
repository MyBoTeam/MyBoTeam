import frCommon from '@locales/fr/common.json';
import frErrors from '@locales/fr/errors.json';
import frExecution from '@locales/fr/execution.json';
import frHistory from '@locales/fr/history.json';
import frHome from '@locales/fr/home.json';
import frSettings from '@locales/fr/settings.json';
import frSidebar from '@locales/fr/sidebar.json';

export const frResources = {
  common: frCommon as Record<string, unknown>,
  home: frHome as Record<string, unknown>,
  settings: frSettings as Record<string, unknown>,
  execution: frExecution as Record<string, unknown>,
  history: frHistory as Record<string, unknown>,
  errors: frErrors as Record<string, unknown>,
  sidebar: frSidebar as Record<string, unknown>,
};
