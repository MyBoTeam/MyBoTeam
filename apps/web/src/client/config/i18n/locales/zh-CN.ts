import zhCNCommon from '@locales/zh-CN/common.json';
import zhCNErrors from '@locales/zh-CN/errors.json';
import zhCNExecution from '@locales/zh-CN/execution.json';
import zhCNHistory from '@locales/zh-CN/history.json';
import zhCNHome from '@locales/zh-CN/home.json';
import zhCNSettings from '@locales/zh-CN/settings.json';
import zhCNSidebar from '@locales/zh-CN/sidebar.json';

export const zhCNResources = {
  common: zhCNCommon as Record<string, unknown>,
  home: zhCNHome as Record<string, unknown>,
  settings: zhCNSettings as Record<string, unknown>,
  execution: zhCNExecution as Record<string, unknown>,
  history: zhCNHistory as Record<string, unknown>,
  errors: zhCNErrors as Record<string, unknown>,
  sidebar: zhCNSidebar as Record<string, unknown>,
};
