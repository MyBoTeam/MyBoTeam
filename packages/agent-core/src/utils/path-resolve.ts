import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PlatformConfig } from '../types.js';

export function resolveUserDataPath(config: PlatformConfig, ...segments: string[]): string {
  return path.join(config.userDataPath, ...segments);
}

export function resolveResourcesPath(config: PlatformConfig, ...segments: string[]): string | null {
  if (!config.resourcesPath) {
    return null;
  }
  return path.join(config.resourcesPath, ...segments);
}

export function resolveAppPath(config: PlatformConfig, ...segments: string[]): string | null {
  if (!config.appPath) {
    return null;
  }
  return path.join(config.appPath, ...segments);
}

export function getMcpToolsPath(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(currentDir, '..', '..', 'mcp-tools');
}
