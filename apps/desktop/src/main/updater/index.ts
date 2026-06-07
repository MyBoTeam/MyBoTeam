import fs from 'node:fs';
import path from 'node:path';
import * as Sentry from '@sentry/electron/main';
import { app, type BrowserWindow, dialog } from 'electron';
import type { AppUpdater } from 'electron-updater';
import { trackUpdateCheck, trackUpdateFailed, trackUpdateInstallStart } from '../analytics/events';
import { getFeedUrl } from './feed-config';
import { registerAutoUpdaterListeners } from './listeners';
import { log } from './logger';
import { checkForUpdatesManual } from './manual-manifest';
import { isTrustedUpdateInfo } from './origin';
import { getDownloadedVersion, setMainWindow, setUserCheckInFlight } from './state';
import { recordCheckedNow, shouldAutoCheck } from './store';

export { getUpdateState, setOnUpdateDownloaded } from './state';
export { shouldAutoCheck } from './store';

let _autoUpdater: AppUpdater | null = null;
async function lazyAutoUpdater(): Promise<AppUpdater> {
  if (!_autoUpdater) {
    const mod = (await import('electron-updater')) as typeof import('electron-updater') & {
      default?: { autoUpdater?: AppUpdater };
    };
    const namedAutoUpdater = Object.hasOwn(mod, 'autoUpdater') ? mod.autoUpdater : undefined;
    const autoUpdater = namedAutoUpdater ?? mod.default?.autoUpdater;
    if (!autoUpdater) {
      throw new Error('electron-updater autoUpdater export unavailable');
    }
    _autoUpdater = autoUpdater;
  }
  return _autoUpdater;
}

export async function initUpdater(window: BrowserWindow): Promise<void> {
  setMainWindow(window);

  if (!getFeedUrl()) {
    return;
  }

  if (process.platform === 'win32') {
    return;
  }
  if (process.platform === 'linux' && !process.env.APPIMAGE) {
    return;
  }

  try {
    const autoUpdater = await lazyAutoUpdater();

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    if (!app.isPackaged) {
      const appPath = app.getAppPath();
      fs.mkdirSync(appPath, { recursive: true });
      fs.writeFileSync(
        path.join(appPath, 'dev-app-update.yml'),
        `provider: generic\nurl: ${getFeedUrl()}\n`,
      );
      autoUpdater.forceDevUpdateConfig = true;
    }

    autoUpdater.setFeedURL({ provider: 'generic', url: getFeedUrl() });

    registerAutoUpdaterListeners(autoUpdater, quitAndInstall);
  } catch (err) {
    Sentry.captureException(err, { tags: { component: 'updater', phase: 'init' } });
    throw err;
  }
}

export async function checkForUpdates(silent: boolean): Promise<void> {
  if (!getFeedUrl()) {
    return;
  }

  if (process.platform === 'win32') {
    await checkForUpdatesManual(silent, 'win');
    return;
  }
  if (process.platform === 'linux' && !process.env.APPIMAGE) {
    const arch: 'x64' | 'arm64' = process.arch === 'arm64' ? 'arm64' : 'x64';
    await checkForUpdatesManual(silent, 'linux', arch);
    return;
  }

  try {
    setUserCheckInFlight(!silent);
    trackUpdateCheck();
    const autoUpdater = await lazyAutoUpdater();
    const result = await autoUpdater.checkForUpdates();
    if (result?.updateInfo && !isTrustedUpdateInfo(result.updateInfo, getFeedUrl())) {
      return;
    }
    recordCheckedNow();
  } catch (err: unknown) {
    setUserCheckInFlight(false);
    const message = err instanceof Error ? err.message : String(err);
    if (!silent) {
      dialog.showErrorBox('Update Check Failed', message);
    }
    log('ERROR', '[Updater] checkForUpdates failed', { err: message });
    trackUpdateFailed('check_failed', message);
    Sentry.captureException(err, { tags: { component: 'updater', phase: 'check' } });
  }
}

export async function quitAndInstall(): Promise<void> {
  trackUpdateInstallStart(getDownloadedVersion() ?? '');
  const autoUpdater = await lazyAutoUpdater();

  autoUpdater.quitAndInstall(false, true);
}

export function autoCheckForUpdates(): void {
  if (!getFeedUrl()) {
    return;
  }
  if (!shouldAutoCheck()) {
    return;
  }
  void checkForUpdates(true);
}
