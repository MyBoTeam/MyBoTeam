import { join } from 'node:path';

const PID_FILE_NAME = 'daemon.pid';

export function getPidFilePath(dataDir: string): string {
  return join(dataDir, PID_FILE_NAME);
}
