import * as os from 'node:os';
import * as path from 'node:path';
import type { PlatformConfig } from '../types.js';

export function getDefaultUserDataPath(appName: string): string {
  const platform = process.platform;
  const home = os.homedir();

  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', appName);
  }
  if (platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), appName);
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), appName);
}

export function getDefaultTempPath(): string {
  return os.tmpdir();
}

export function createDefaultPlatformConfig(
  appName: string,
  overrides?: Partial<PlatformConfig>,
): PlatformConfig {
  return {
    userDataPath: getDefaultUserDataPath(appName),
    tempPath: getDefaultTempPath(),
    isPackaged: false,
    platform: process.platform,
    arch: process.arch,
    ...overrides,
  };
}
