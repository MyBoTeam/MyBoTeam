import type { CloudBrowserConfig } from '@myboteam/agent-core/common';
import { ipcRenderer, webUtils } from 'electron';

export const appCoreHandlers = {
  getFilePath: (file: File): string => webUtils.getPathForFile(file),

  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  getPlatform: (): Promise<string> => ipcRenderer.invoke('app:platform'),
  getAppInfo: (): Promise<{
    version: string;
    platform: string;
    arch: string;
    electronVersion: string;
    nodeVersion: string;
  }> => ipcRenderer.invoke('app:info'),

  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:open-external', url),

  getNotificationsEnabled: (): Promise<boolean> =>
    ipcRenderer.invoke('settings:notifications-enabled'),
  setNotificationsEnabled: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('settings:set-notifications-enabled', enabled),
  getDebugMode: (): Promise<boolean> => ipcRenderer.invoke('settings:debug-mode'),
  setDebugMode: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('settings:set-debug-mode', enabled),
  getTheme: (): Promise<string> => ipcRenderer.invoke('settings:theme'),
  setTheme: (theme: string): Promise<void> => ipcRenderer.invoke('settings:set-theme', theme),
  getLanguage: (): Promise<string> => ipcRenderer.invoke('settings:language'),
  setLanguage: (language: string): Promise<void> =>
    ipcRenderer.invoke('settings:set-language', language),
  onThemeChange: (callback: (data: { theme: string; resolved: string }) => void) => {
    const listener = (_: unknown, data: { theme: string; resolved: string }) => callback(data);
    ipcRenderer.on('settings:theme-changed', listener);
    return () => ipcRenderer.removeListener('settings:theme-changed', listener);
  },
  getThemeColor: (): Promise<string> => ipcRenderer.invoke('settings:theme-color'),
  setThemeColor: (color: string): Promise<void> =>
    ipcRenderer.invoke('settings:set-theme-color', color),
  onThemeColorChange: (callback: (data: { themeColor: string }) => void) => {
    const listener = (_: unknown, data: { themeColor: string }) => callback(data);
    ipcRenderer.on('settings:theme-color-changed', listener);
    return () => ipcRenderer.removeListener('settings:theme-color-changed', listener);
  },
  onDebugModeChange: (callback: (data: { enabled: boolean }) => void) => {
    const listener = (_: unknown, data: { enabled: boolean }) => callback(data);
    ipcRenderer.on('settings:debug-mode-changed', listener);
    return () => ipcRenderer.removeListener('settings:debug-mode-changed', listener);
  },
  getAppSettings: (): Promise<{
    debugMode: boolean;
    onboardingComplete: boolean;
    theme: string;
    language: string;
  }> => ipcRenderer.invoke('settings:app-settings'),
  getCloudBrowserConfig: (): Promise<CloudBrowserConfig | null> =>
    ipcRenderer.invoke('settings:cloud-browser-config:get'),
  setCloudBrowserConfig: (config: CloudBrowserConfig | null): Promise<void> =>
    ipcRenderer.invoke('settings:cloud-browser-config:set', config ? JSON.stringify(config) : null),
  getOpenAiBaseUrl: (): Promise<string> => ipcRenderer.invoke('settings:openai-base-url:get'),
  setOpenAiBaseUrl: (baseUrl: string): Promise<void> =>
    ipcRenderer.invoke('settings:openai-base-url:set', baseUrl),

  getOnboardingComplete: (): Promise<boolean> => ipcRenderer.invoke('onboarding:complete'),
  setOnboardingComplete: (complete: boolean): Promise<void> =>
    ipcRenderer.invoke('onboarding:set-complete', complete),

  checkOpenCodeCli: (): Promise<{
    installed: boolean;
    version: string | null;
    installCommand: string;
  }> => ipcRenderer.invoke('opencode:check'),
  getOpenCodeVersion: (): Promise<string | null> => ipcRenderer.invoke('opencode:version'),

  getBuildCapabilities: (): Promise<{ hasFreeMode: boolean; hasAnalytics: boolean }> =>
    ipcRenderer.invoke('app:get-build-capabilities'),

  isE2EMode: (): Promise<boolean> => ipcRenderer.invoke('app:is-e2e-mode'),
};
