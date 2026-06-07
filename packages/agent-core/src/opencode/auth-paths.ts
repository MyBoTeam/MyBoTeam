import * as os from 'node:os';
import * as path from 'node:path';

export function getOpenCodeDataHome(): string {
  return process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
}

export function getOpenCodeAuthJsonPath(): string {
  return path.join(getOpenCodeDataHome(), 'opencode', 'auth.json');
}

export function getOpenCodeAuthPath(): string {
  return getOpenCodeAuthJsonPath();
}
