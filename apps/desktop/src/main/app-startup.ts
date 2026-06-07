import path from 'node:path';
import { app, type BrowserWindow, dialog, shell } from 'electron';
import {
  initAnalyticsAndSkills,
  initPostBootstrap,
  runLegacyMigration,
  trackAppLaunchedIfEnabled,
  validateConnectedProviders,
} from './app-startup-init';
import {
  registerActivateHandler,
  setupGoogleOAuthAndIpc,
  setupWindowServices,
} from './app-startup-services';
import { getBuildId } from './config/build-config';
import { bootstrapDaemon } from './daemon-bootstrap';
import { getLogCollector } from './logging';

function logMain(level: 'INFO' | 'WARN' | 'ERROR', msg: string, data?: Record<string, unknown>) {
  try {
    const l = getLogCollector();
    if (l?.log) l.log(level, 'main', msg, data);
  } catch (_e) {}
}

async function bootstrapDaemonWithRetry(): Promise<'connected' | 'quit'> {
  for (;;) {
    try {
      await bootstrapDaemon();
      logMain('INFO', '[Main] Daemon connected');
      return 'connected';
    } catch (err) {
      const { DaemonRestartError } = await import('./daemon/daemon-connector');

      if (err instanceof DaemonRestartError) {
        logMain('ERROR', '[Main] Failed to restart daemon after upgrade', { error: String(err) });
        await dialog.showMessageBox({
          type: 'warning',
          title: 'Background Service Update',
          message: 'The background service from a previous version could not be stopped.',
          detail:
            'Please fully quit the application (check the system tray), wait a few seconds, ' +
            'and reopen it. If the issue persists, restart your computer.',
          buttons: ['Quit'],
        });
        return 'quit';
      }

      logMain('ERROR', '[Main] Daemon bootstrap failed', { error: String(err) });

      for (;;) {
        const response = await dialog.showMessageBox({
          type: 'error',
          title: 'MyBoTeam cannot start',
          message: 'The background service failed to start.',
          detail:
            'MyBoTeam stores your settings, conversations, and credentials in a background ' +
            'process. Without it the app cannot load.\n\n' +
            `Error: ${err instanceof Error ? err.message : String(err)}`,
          buttons: ['Retry', 'Open Logs', 'Quit'],
          defaultId: 0,
          cancelId: 2,
        });

        if (response.response === 0) {
          break;
        }
        if (response.response === 2) {
          return 'quit';
        }

        try {
          const logDir = path.join(app.getPath('userData'), 'logs');
          const openErr = await shell.openPath(logDir);
          if (openErr) {
            logMain('WARN', '[Main] shell.openPath(logs) returned error', { openErr });
            await shell.openPath(app.getPath('userData'));
          }
        } catch (openErr) {
          logMain('WARN', '[Main] Could not open log directory', { err: String(openErr) });
        }
      }
    }
  }
}

export type CreateWindowFn = () => void;

export async function startApp(
  createWindow: CreateWindowFn,
  getMainWindow: () => BrowserWindow | null,
  isQuittingRef: { value: boolean },
): Promise<void> {
  logMain('INFO', `[Main] Electron app ready, version: ${app.getVersion()}`);

  process.env.MYBOTEAM_BUILD_ID = getBuildId();

  runLegacyMigration();

  const isFirstLaunch = await initAnalyticsAndSkills();

  const outcome = await bootstrapDaemonWithRetry();
  if (outcome === 'quit') {
    logMain('INFO', '[Main] User chose to quit from daemon-failure modal');
    app.quit();
    return;
  }

  await initPostBootstrap();
  await validateConnectedProviders();
  await trackAppLaunchedIfEnabled(isFirstLaunch);

  await setupGoogleOAuthAndIpc();

  await setupWindowServices(createWindow, getMainWindow, isQuittingRef);
  registerActivateHandler(createWindow);
}
