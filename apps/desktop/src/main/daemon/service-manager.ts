import { app } from 'electron';
import { getLogCollector } from '../logging';
import {
  installSystemdService,
  isSystemdServiceEnabled,
  uninstallSystemdService,
} from './service-manager-linux';
import {
  installLaunchAgent,
  isLaunchAgentInstalled,
  uninstallLaunchAgent,
} from './service-manager-macos';
import { getDaemonEntryPath, getDaemonNodePath, getDataDir } from './service-manager-types';

function logD(level: 'INFO' | 'WARN' | 'ERROR', msg: string): void {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'daemon', msg);
    }
  } catch (_e) {}
}

export function isAutoStartEnabled(): boolean {
  if (process.platform === 'linux') {
    return isSystemdServiceEnabled();
  }
  if (process.platform === 'darwin') {
    return isLaunchAgentInstalled();
  }

  const settings = app.getLoginItemSettings();
  return settings.openAtLogin;
}

export function enableAutoStart(): void {
  logD('INFO', `[ServiceManager] Enabling auto-start for platform: ${process.platform}`);

  if (process.platform === 'linux') {
    installSystemdService();
    return;
  }
  if (process.platform === 'darwin') {
    installLaunchAgent();
    return;
  }

  if (app.isPackaged) {
    const nodePath = getDaemonNodePath();
    const entryPath = getDaemonEntryPath();
    const dataDir = getDataDir();
    app.setLoginItemSettings({
      openAtLogin: true,
      path: nodePath,
      args: [
        entryPath,
        '--data-dir',
        dataDir,
        '--packaged',
        '--resources-path',
        process.resourcesPath,
        '--app-path',
        app.getAppPath(),
      ],
    });
    logD('INFO', '[ServiceManager] Auto-start enabled: daemon binary via login item');
  } else {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
    });
    logD('INFO', '[ServiceManager] Auto-start enabled: Electron hidden (dev mode)');
  }
}

export function disableAutoStart(): void {
  logD('INFO', `[ServiceManager] Disabling auto-start for platform: ${process.platform}`);

  if (process.platform === 'linux') {
    uninstallSystemdService();
    return;
  }
  if (process.platform === 'darwin') {
    uninstallLaunchAgent();
    return;
  }

  app.setLoginItemSettings({ openAtLogin: false });
  logD('INFO', '[ServiceManager] Auto-start disabled');
}
