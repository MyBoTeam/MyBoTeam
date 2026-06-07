import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { getLogCollector } from '../logging';
import {
  getDaemonEntryPath,
  getDaemonNodePath,
  getDataDir,
  LAUNCH_AGENT_LABEL,
} from './service-manager-types';

function getLaunchAgentDir(): string {
  return path.join(process.env.HOME || '~', 'Library', 'LaunchAgents');
}

function getLaunchAgentPath(): string {
  return path.join(getLaunchAgentDir(), `${LAUNCH_AGENT_LABEL}.plist`);
}

function getLaunchAgentContent(): string {
  const nodePath = getDaemonNodePath();
  const entryPath = getDaemonEntryPath();
  const dataDir = getDataDir();

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    `  <key>Label</key><string>${LAUNCH_AGENT_LABEL}</string>`,
    '  <key>ProgramArguments</key>',
    '  <array>',
    `    <string>${nodePath}</string>`,
    `    <string>${entryPath}</string>`,
    `    <string>--data-dir</string>`,
    `    <string>${dataDir}</string>`,
    '  </array>',
    '  <key>KeepAlive</key><true/>',
    '  <key>RunAtLoad</key><true/>',
  ];

  const envDict = ['  <key>EnvironmentVariables</key>', '  <dict>'];
  if (app.isPackaged) {
    envDict.push('    <key>MYBOTEAM_IS_PACKAGED</key><string>1</string>');
  } else {
    envDict.push('    <key>ELECTRON_RUN_AS_NODE</key><string>1</string>');
  }
  envDict.push(
    `    <key>MYBOTEAM_RESOURCES_PATH</key><string>${app.isPackaged ? process.resourcesPath : `${app.getAppPath()}/resources`}</string>`,
    `    <key>MYBOTEAM_APP_PATH</key><string>${app.getAppPath()}</string>`,
    '  </dict>',
  );
  lines.push(...envDict);

  lines.push(
    '  <key>StandardOutPath</key>',
    `  <string>${path.join(dataDir, 'logs', 'daemon-service.log')}</string>`,
    '  <key>StandardErrorPath</key>',
    `  <string>${path.join(dataDir, 'logs', 'daemon-service.log')}</string>`,
    '</dict>',
    '</plist>',
    '',
  );

  return lines.join('\n');
}

export function installLaunchAgent(): void {
  const agentDir = getLaunchAgentDir();
  const agentPath = getLaunchAgentPath();

  fs.mkdirSync(agentDir, { recursive: true });
  fs.writeFileSync(agentPath, getLaunchAgentContent(), { mode: 0o644 });
  logD('INFO', `[ServiceManager] Wrote LaunchAgent to: ${agentPath}`);

  try {
    execSync(`launchctl unload "${agentPath}" 2>/dev/null || true`, { stdio: 'pipe' });
    execSync(`launchctl load "${agentPath}"`, { stdio: 'pipe' });
    logD('INFO', '[ServiceManager] LaunchAgent loaded');
  } catch (err) {
    logD('ERROR', `[ServiceManager] Failed to load LaunchAgent: ${String(err)}`);
    throw err;
  }
}

export function uninstallLaunchAgent(): void {
  const agentPath = getLaunchAgentPath();

  try {
    execSync(`launchctl unload "${agentPath}" 2>/dev/null || true`, { stdio: 'pipe' });
    logD('INFO', '[ServiceManager] LaunchAgent unloaded');
  } catch {
    // May not be loaded
  }

  if (fs.existsSync(agentPath)) {
    fs.unlinkSync(agentPath);
    logD('INFO', `[ServiceManager] Removed LaunchAgent: ${agentPath}`);
  }
}

export function isLaunchAgentInstalled(): boolean {
  return fs.existsSync(getLaunchAgentPath());
}

function logD(level: 'INFO' | 'WARN' | 'ERROR', msg: string): void {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'daemon', msg);
    }
  } catch (_e) {
    /* best-effort */
  }
}
