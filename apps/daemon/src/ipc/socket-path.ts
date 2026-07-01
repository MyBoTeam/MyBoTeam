import { createHash } from 'node:crypto';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

export function getDefaultSocketPath(): string {
  const dir = join(homedir(), '.myboteam');
  if (platform() === 'win32') {
    const hash = createHash('sha256').update(dir).digest('hex').slice(0, 12);
    return `\\\\.\\pipe\\myboteam-daemon-${hash}`;
  }
  return join(dir, 'daemon.sock');
}
