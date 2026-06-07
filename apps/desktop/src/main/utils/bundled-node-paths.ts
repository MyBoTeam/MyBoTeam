import type { PlatformConfig } from '@myboteam/agent-core/desktop-main';
import {
  getNodePath as coreGetNodePath,
  getNpmPath as coreGetNpmPath,
  getNpxPath as coreGetNpxPath,
} from '@myboteam/agent-core/desktop-main';
import { app } from 'electron';

function getElectronPlatformConfig(): PlatformConfig {
  return {
    userDataPath: app.getPath('userData'),
    tempPath: app.getPath('temp'),
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    appPath: app.getAppPath(),
    platform: process.platform,
    arch: process.arch,
  };
}

export function getNodePath(): string {
  return coreGetNodePath(getElectronPlatformConfig());
}

export function getNpmPath(): string {
  return coreGetNpmPath(getElectronPlatformConfig());
}

export function getNpxPath(): string {
  return coreGetNpxPath(getElectronPlatformConfig());
}
