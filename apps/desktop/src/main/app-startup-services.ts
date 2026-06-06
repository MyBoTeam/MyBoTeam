import { app, BrowserWindow, ipcMain } from 'electron';
import { isAutoUpdaterEnabled } from './config/build-config';
import { registerNotificationForwarding } from './daemon-bootstrap';
import { registerIPCHandlers } from './ipc/handlers';
import { getLogCollector } from './logging';
import { drainProtocolUrlQueue } from './protocol-handlers';
import { createTray } from './tray';

function logMain(level: 'INFO' | 'WARN' | 'ERROR', msg: string, data?: Record<string, unknown>) {
  try {
    const l = getLogCollector();
    if (l?.log) l.log(level, 'main', msg, data);
  } catch (_e) {
    /* best-effort */
  }
}

export async function setupGoogleOAuthAndIpc(): Promise<void> {
  let startGoogleOAuthFn:
    | typeof import('./google-accounts/google-auth').startGoogleOAuth
    | undefined;
  let cancelGoogleOAuthFn:
    | typeof import('./google-accounts/google-auth').cancelGoogleOAuth
    | undefined;
  try {
    const { startGoogleOAuth, cancelGoogleOAuth } = await import('./google-accounts/index');
    startGoogleOAuthFn = startGoogleOAuth;
    cancelGoogleOAuthFn = cancelGoogleOAuth;
  } catch (err) {
    logMain('WARN', '[Main] Google OAuth helpers unavailable', { err: String(err) });
  }
  registerIPCHandlers(startGoogleOAuthFn, cancelGoogleOAuthFn);
  logMain('INFO', '[Main] IPC handlers registered');
}

export async function setupWindowServices(
  createWindow: () => void,
  getMainWindow: () => BrowserWindow | null,
  isQuittingRef: { value: boolean },
): Promise<void> {
  createWindow();

  const mainWindow = getMainWindow();
  if (!mainWindow) {
    return;
  }

  registerNotificationForwarding(() => getMainWindow());
  logMain('INFO', '[Main] Daemon notification forwarding registered');

  mainWindow.on('close', (event) => {
    if (isQuittingRef.value) {
      return;
    }

    if (process.env.E2E_MOCK_TASK_EVENTS === '1') {
      return;
    }

    event.preventDefault();
    mainWindow.webContents.send('app:close-requested');

    const handler = async (_evt: Electron.IpcMainEvent, decision: string) => {
      ipcMain.removeListener('app:close-response', handler);

      if (decision === 'keep-daemon') {
        logMain('INFO', '[Main] Closing app (daemon keeps running)');
        isQuittingRef.value = true;
        app.quit();
      } else if (decision === 'stop-daemon') {
        logMain('INFO', '[Main] Closing app and stopping daemon');
        try {
          const { suppressReconnect } = await import('./daemon/daemon-connector');
          suppressReconnect();
        } catch {
          /* connector may not be loaded */
        }
        const { requestStopDaemonOnQuit } = await import('./app-shutdown');
        requestStopDaemonOnQuit();
        isQuittingRef.value = true;
        app.quit();
      }
    };
    ipcMain.on('app:close-response', handler);
  });

  createTray(mainWindow);
  logMain('INFO', '[Main] System tray created');

  drainProtocolUrlQueue(mainWindow);

  if (isAutoUpdaterEnabled()) {
    try {
      const { initUpdater, autoCheckForUpdates } = await import('./updater');
      await initUpdater(mainWindow);
      const { initMenu } = await import('./menu');
      initMenu();
      setTimeout(() => autoCheckForUpdates(), 5000);
      logMain('INFO', '[Main] Auto-updater initialized');
    } catch (err) {
      logMain('WARN', '[Main] Auto-updater init failed', { err: String(err) });
    }
  }
}

export function registerActivateHandler(createWindow: () => void): void {
  app.on('activate', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length === 0) {
      createWindow();
      try {
        getLogCollector()?.logEnv?.('INFO', '[Main] Application reactivated; recreated window');
      } catch (_e) {
        /* ignore */
      }
    } else {
      windows[0].show();
      windows[0].focus();
      try {
        getLogCollector()?.logEnv?.(
          'INFO',
          '[Main] Application reactivated; showed existing window',
        );
      } catch (_e) {
        /* ignore */
      }
    }
  });
}
