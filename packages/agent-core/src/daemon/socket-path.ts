import { createHash } from 'node:crypto';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

const DAEMON_DIR_NAME = '.myboteam';
const SOCKET_FILE_NAME = 'daemon.sock';
const PID_FILE_NAME = 'daemon.pid';
const WINDOWS_PIPE_BASE = 'myboteam-daemon';

export function getDaemonDir(): string {
  return join(homedir(), DAEMON_DIR_NAME);
}

export function getSocketPath(dataDir?: string): string {
  const dir = dataDir ?? getDaemonDir();
  if (platform() === 'win32') {
    const hash = createHash('sha256').update(dir).digest('hex').slice(0, 12);
    return `\\\\.\\pipe\\${WINDOWS_PIPE_BASE}-${hash}`;
  }
  return join(dir, SOCKET_FILE_NAME);
}

export function getPidFilePath(dataDir?: string): string {
  const dir = dataDir ?? getDaemonDir();
  return join(dir, PID_FILE_NAME);
}
