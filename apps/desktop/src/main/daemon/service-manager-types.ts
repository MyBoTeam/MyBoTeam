import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

export const LAUNCH_AGENT_LABEL = 'ai.myboteam.daemon';
export const SYSTEMD_SERVICE_NAME = 'myboteam-daemon.service';

export function getDaemonNodePath(): string {
  if (app.isPackaged) {
    const platformArch = `${process.platform}-${process.arch}`;
    const nodejsBase = path.join(process.resourcesPath, 'nodejs', platformArch);
    const nodeBinary = process.platform === 'win32' ? 'node.exe' : path.join('bin', 'node');

    const directPath = path.join(nodejsBase, nodeBinary);
    if (fs.existsSync(directPath)) {
      return directPath;
    }

    try {
      const children = fs.readdirSync(nodejsBase, { withFileTypes: true });
      for (const child of children) {
        if (!child.isDirectory()) {
          continue;
        }
        const nested = path.join(nodejsBase, child.name, nodeBinary);
        if (fs.existsSync(nested)) {
          return nested;
        }
      }
    } catch {
      // intentionally empty
    }
  }
  return process.execPath;
}

export function getDaemonEntryPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'daemon', 'index.js');
  }
  return path.join(app.getAppPath(), '..', 'daemon', 'dist', 'index.js');
}

export function getDataDir(): string {
  return app.getPath('userData');
}
