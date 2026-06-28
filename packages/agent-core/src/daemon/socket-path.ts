import { platform } from 'node:os';
import { basename, join } from 'node:path';

const PID_FILE_NAME = 'daemon.pid';
const SOCKET_FILE_NAME = 'daemon.sock';
const NAMED_PIPE_PREFIX = '\\\\.\\pipe\\';

export function getPidFilePath(dataDir: string): string {
  return join(dataDir, PID_FILE_NAME);
}

/**
 * Get the socket path for the daemon.
 * Uses Unix domain socket on POSIX systems, Windows named pipe on Windows.
 * On Windows, pipe name is derived from dataDir to avoid collisions.
 *
 * Source: v0.2.0 socket-path.ts lines 5-28, Accomplish socket-path.ts
 */
export function getSocketPath(dataDir?: string): string {
  const dir = dataDir ?? process.env.DATA_DIR ?? join(process.cwd(), 'data');

  if (platform() === 'win32') {
    // Windows named pipe - derive name from dataDir to avoid collisions
    const pipeName = `myboteam-${basename(dir)}`;
    return `${NAMED_PIPE_PREFIX}${pipeName}`;
  }

  // Unix domain socket
  return join(dir, SOCKET_FILE_NAME);
}
