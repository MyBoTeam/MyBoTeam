import type { BundledNodePathsExtended, PlatformConfig } from '@myboteam/agent-core/desktop-main';
import {
  getBundledNodePaths as coreGetBundledNodePaths,
  isBundledNodeAvailable as coreIsBundledNodeAvailable,
  logBundledNodeInfo as coreLogBundledNodeInfo,
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

export function getBundledNodePaths(): BundledNodePathsExtended | null {
  return coreGetBundledNodePaths(getElectronPlatformConfig());
}

export function isBundledNodeAvailable(): boolean {
  return coreIsBundledNodeAvailable(getElectronPlatformConfig());
}

export function logBundledNodeInfo(): void {
  coreLogBundledNodeInfo(getElectronPlatformConfig());
}
