import ruCommon from '@locales/ru/common.json';
import ruErrors from '@locales/ru/errors.json';
import ruExecution from '@locales/ru/execution.json';
import ruHistory from '@locales/ru/history.json';
import ruHome from '@locales/ru/home.json';
import ruSettings from '@locales/ru/settings.json';
import ruSidebar from '@locales/ru/sidebar.json';

export const ruResources = {
  common: ruCommon as Record<string, unknown>,
  home: ruHome as Record<string, unknown>,
  settings: ruSettings as Record<string, unknown>,
  execution: ruExecution as Record<string, unknown>,
  history: ruHistory as Record<string, unknown>,
  errors: ruErrors as Record<string, unknown>,
  sidebar: ruSidebar as Record<string, unknown>,
};
