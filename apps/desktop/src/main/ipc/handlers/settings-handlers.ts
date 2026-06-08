import type { IpcMainInvokeEvent } from 'electron';
import { BrowserWindow, nativeTheme } from 'electron';
import { getDaemonClient } from '../../daemon-bootstrap';
import { registerAuthHandlers } from './settings-handlers/auth-handlers';
import { registerCloudBrowserHandlers } from './settings-handlers/cloud-browser-handlers';
import { registerDaemonControlHandlers } from './settings-handlers/daemon-control-handlers';
import { registerOnboardingHandlers } from './settings-handlers/onboarding-handlers';
import { registerOpenCodeHandlers } from './settings-handlers/opencode-handlers';
import { registerSandboxHandlers } from './settings-handlers/sandbox-handlers';
import { type Language, SUPPORTED_LANGUAGES } from './settings-types';
import { handle, isDaemonUnavailableError } from './utils';
import { registerWhatsAppHandlers } from './whatsapp-handlers';

export function registerSettingsHandlers(): void {
  handle('settings:notifications-enabled', async (_event: IpcMainInvokeEvent) => {
    try {
      const snap = await getDaemonClient().call('settings.getAll');
      return snap.notificationsEnabled;
    } catch (err) {
      if (isDaemonUnavailableError(err)) return false;
      throw err;
    }
  });

  handle(
    'settings:set-notifications-enabled',
    async (_event: IpcMainInvokeEvent, enabled: boolean) => {
      if (typeof enabled !== 'boolean') {
        throw new Error('Invalid notifications-enabled flag');
      }
      await getDaemonClient().call('settings.setNotificationsEnabled', { enabled });
    },
  );

  handle('settings:debug-mode', async (_event: IpcMainInvokeEvent) => {
    try {
      const snap = await getDaemonClient().call('settings.getAll');
      return snap.app.debugMode;
    } catch (err) {
      if (isDaemonUnavailableError(err)) return false;
      throw err;
    }
  });

  handle('settings:set-debug-mode', async (_event: IpcMainInvokeEvent, enabled: boolean) => {
    if (typeof enabled !== 'boolean') {
      throw new Error('Invalid debug mode flag');
    }
    await getDaemonClient().call('settings.setDebugMode', { enabled });
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('settings:debug-mode-changed', { enabled });
    }
  });

  handle('settings:theme', async (_event: IpcMainInvokeEvent) => {
    const snap = await getDaemonClient().call('settings.getAll');
    return snap.app.theme;
  });

  handle('settings:set-theme', async (_event: IpcMainInvokeEvent, theme: string) => {
    if (!['system', 'light', 'dark'].includes(theme)) {
      throw new Error('Invalid theme value');
    }
    await getDaemonClient().call('settings.setTheme', {
      theme: theme as 'system' | 'light' | 'dark',
    });
    nativeTheme.themeSource = theme as 'system' | 'light' | 'dark';

    const resolved =
      theme === 'system' ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : theme;

    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('settings:theme-changed', { theme, resolved });
    }
  });

  handle('settings:theme-color', async () => {
    const snap = await getDaemonClient().call('settings.getAll');
    return snap.app.themeColor || 'neutral';
  });

  handle('settings:set-theme-color', async (_event: IpcMainInvokeEvent, color: string) => {
    const validColors = ['mint', 'blue', 'lemon', 'peach', 'lavender', 'neutral'];
    if (!validColors.includes(color)) {
      throw new Error('Invalid theme color value');
    }
    await getDaemonClient().call('settings.setThemeColor', {
      themeColor: color as 'mint' | 'blue' | 'lemon' | 'peach' | 'lavender' | 'neutral',
    });
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('settings:theme-color-changed', { themeColor: color });
    }
  });

  handle('settings:language', async (_event: IpcMainInvokeEvent) => {
    const snap = await getDaemonClient().call('settings.getAll');
    return snap.app.language;
  });

  handle('settings:set-language', async (_event: IpcMainInvokeEvent, language: string) => {
    if (!SUPPORTED_LANGUAGES.includes(language as Language)) {
      throw new Error('Invalid language value');
    }
    await getDaemonClient().call('settings.setLanguage', { language: language as Language });
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('settings:language-changed', { language });
    }
  });

  handle('settings:app-settings', async (_event: IpcMainInvokeEvent) => {
    const snap = await getDaemonClient().call('settings.getAll');
    return snap.app;
  });

  handle('scheduler:list', async (_event: IpcMainInvokeEvent, workspaceId?: string) => {
    const client = getDaemonClient();
    return client.call('task.listScheduled', { workspaceId });
  });

  handle(
    'scheduler:create',
    async (_event: IpcMainInvokeEvent, cron: string, prompt: string, workspaceId?: string) => {
      const client = getDaemonClient();
      return client.call('task.schedule', { cron, prompt, workspaceId });
    },
  );

  handle('scheduler:delete', async (_event: IpcMainInvokeEvent, scheduleId: string) => {
    const client = getDaemonClient();
    return client.call('task.cancelScheduled', { scheduleId });
  });

  handle(
    'scheduler:set-enabled',
    async (_event: IpcMainInvokeEvent, scheduleId: string, enabled: boolean) => {
      const client = getDaemonClient();
      return client.call('task.setScheduleEnabled', { scheduleId, enabled });
    },
  );

  registerDaemonControlHandlers(handle);
  registerCloudBrowserHandlers(handle);
  registerSandboxHandlers(handle);
  registerAuthHandlers(handle);
  registerOnboardingHandlers(handle);
  registerOpenCodeHandlers(handle);
  registerWhatsAppHandlers(handle);

  handle('app:get-build-capabilities', async () => {
    const { isAnalyticsEnabled } = await import('../../config/build-config');
    return {
      hasAnalytics: isAnalyticsEnabled(),
    };
  });
}
