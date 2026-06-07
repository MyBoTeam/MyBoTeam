import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { getBuildConfig, getBuildId } from '../config/build-config';
import { getNodePath } from '../utils/bundled-node';
import { getDaemonEntryPath, getDataDir, log } from './daemon-connector';

let logWatcher: fs.FSWatcher | null = null;

export function tailDaemonLog(): void {
  if (app.isPackaged) {
    return;
  }

  stopTailingDaemonLog();

  const dataDir = getDataDir();
  const logPath = getDaemonLogPath(dataDir);

  if (!fs.existsSync(logPath)) {
    return;
  }

  const CYAN = '\x1b[36m';
  const RESET = '\x1b[0m';

  let fileSize = fs.statSync(logPath).size;

  logWatcher = fs.watch(logPath, () => {
    try {
      const newSize = fs.statSync(logPath).size;
      if (newSize <= fileSize) {
        fileSize = newSize;
        return;
      }

      const buf = Buffer.alloc(newSize - fileSize);
      const fd = fs.openSync(logPath, 'r');
      fs.readSync(fd, buf, 0, buf.length, fileSize);
      fs.closeSync(fd);
      fileSize = newSize;

      const lines = buf.toString().trimEnd().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          process.stdout.write(`${CYAN}[Daemon]${RESET} ${line}\n`);
        }
      }
    } catch {}
  });
}

export function stopTailingDaemonLog(): void {
  if (logWatcher) {
    logWatcher.close();
    logWatcher = null;
  }
}

function getDevNodePath(): string {
  try {
    return getNodePath();
  } catch {}

  const pnpmNode = process.env.npm_node_execpath;
  if (pnpmNode && fs.existsSync(pnpmNode)) {
    return pnpmNode;
  }

  return 'node';
}

export function spawnDaemon(dataDir: string): void {
  const nodeBin = app.isPackaged ? getNodePath() : getDevNodePath();
  const entryPath = getDaemonEntryPath();

  log('INFO', `[DaemonConnector] Spawning daemon: ${nodeBin} ${entryPath} --data-dir ${dataDir}`);

  const daemonEnv: Record<string, string | undefined> = {
    ...process.env,
    MYBOTEAM_BUILD_ID: getBuildId(),
  };
  delete daemonEnv.ELECTRON_RUN_AS_NODE;

  const bc = getBuildConfig();
  if (bc.myboteamGatewayUrl) {
    daemonEnv.MYBOTEAM_GATEWAY_URL = bc.myboteamGatewayUrl;
  }
  if (app.isPackaged) {
    daemonEnv.MYBOTEAM_IS_PACKAGED = '1';
    daemonEnv.MYBOTEAM_RESOURCES_PATH = process.resourcesPath;
    daemonEnv.MYBOTEAM_APP_PATH = app.getAppPath();
  } else {
    daemonEnv.MYBOTEAM_APP_PATH = app.getAppPath();
    daemonEnv.MYBOTEAM_RESOURCES_PATH = path.join(app.getAppPath(), 'resources');
  }

  const logPath = getDaemonLogPath(dataDir);
  const logFd = fs.openSync(logPath, 'a');
  try {
    const child = spawn(nodeBin, [entryPath, '--data-dir', dataDir], {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env: daemonEnv,
    });
    child.unref();
    log('INFO', `[DaemonConnector] Daemon spawned (detached, pid=${child.pid})`);
  } finally {
    fs.closeSync(logFd);
  }
}

export function getDaemonLogPath(dataDir: string): string {
  const logsDir = path.join(dataDir, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const logPath = path.join(logsDir, `daemon-${today}.log`);

  try {
    const files = fs
      .readdirSync(logsDir)
      .filter((f) => f.startsWith('daemon-') && f.endsWith('.log'));
    if (files.length > 7) {
      files.sort();
      for (const old of files.slice(0, files.length - 7)) {
        fs.unlinkSync(path.join(logsDir, old));
      }
    }
  } catch {}

  return logPath;
}
