import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { getLogCollector } from '../logging';
import {
  getDaemonEntryPath,
  getDaemonNodePath,
  getDataDir,
  SYSTEMD_SERVICE_NAME,
} from './service-manager-types';

function logD(level: 'INFO' | 'WARN' | 'ERROR', msg: string): void {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'daemon', msg);
    }
  } catch (_e) {}
}

function getSystemdServiceDir(): string {
  const configDir = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || '~', '.config');
  return path.join(configDir, 'systemd', 'user');
}

function getSystemdServicePath(): string {
  return path.join(getSystemdServiceDir(), SYSTEMD_SERVICE_NAME);
}

function getSystemdServiceContent(): string {
  const nodePath = getDaemonNodePath();
  const entryPath = getDaemonEntryPath();
  const dataDir = getDataDir();

  const lines = [
    '[Unit]',
    'Description=MyBoTeam AI Daemon',
    'After=default.target',
    '',
    '[Service]',
    'Type=simple',
    `ExecStart=${nodePath} ${entryPath} --data-dir ${dataDir}`,
  ];

  if (app.isPackaged) {
    lines.push(
      `Environment=MYBOTEAM_IS_PACKAGED=1`,
      `Environment=MYBOTEAM_RESOURCES_PATH=${process.resourcesPath}`,
      `Environment=MYBOTEAM_APP_PATH=${app.getAppPath()}`,
    );
  }

  lines.push('Restart=on-failure', 'RestartSec=5', '', '[Install]', 'WantedBy=default.target', '');

  return lines.join('\n');
}

export function installSystemdService(): void {
  const serviceDir = getSystemdServiceDir();
  const servicePath = getSystemdServicePath();

  fs.mkdirSync(serviceDir, { recursive: true });
  fs.writeFileSync(servicePath, getSystemdServiceContent(), { mode: 0o644 });
  logD('INFO', `[ServiceManager] Wrote systemd service to: ${servicePath}`);

  try {
    execSync('systemctl --user daemon-reload', { stdio: 'pipe' });
    execSync(`systemctl --user enable ${SYSTEMD_SERVICE_NAME}`, { stdio: 'pipe' });
    logD('INFO', '[ServiceManager] systemd user service enabled');
  } catch (err) {
    logD('ERROR', `[ServiceManager] Failed to enable systemd service: ${String(err)}`);
    throw err;
  }
}

export function uninstallSystemdService(): void {
  const servicePath = getSystemdServicePath();

  try {
    execSync(`systemctl --user disable ${SYSTEMD_SERVICE_NAME}`, { stdio: 'pipe' });
    execSync(`systemctl --user stop ${SYSTEMD_SERVICE_NAME}`, { stdio: 'pipe' });
    logD('INFO', '[ServiceManager] systemd user service disabled and stopped');
  } catch {}

  if (fs.existsSync(servicePath)) {
    fs.unlinkSync(servicePath);
    logD('INFO', `[ServiceManager] Removed service file: ${servicePath}`);
  }

  try {
    execSync('systemctl --user daemon-reload', { stdio: 'pipe' });
  } catch {}
}

export function isSystemdServiceEnabled(): boolean {
  try {
    const result = execSync(`systemctl --user is-enabled ${SYSTEMD_SERVICE_NAME}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return result.trim() === 'enabled';
  } catch {
    return false;
  }
}
