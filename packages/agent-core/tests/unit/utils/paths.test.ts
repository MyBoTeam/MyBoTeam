import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlatformConfig } from '../../../src/types.js';
import {
  createDefaultPlatformConfig,
  getDefaultTempPath,
  getDefaultUserDataPath,
  resolveAppPath,
  resolveResourcesPath,
  resolveUserDataPath,
} from '../../../src/utils/paths.js';

describe('getDefaultUserDataPath', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns macOS path when platform is darwin', () => {
    vi.stubGlobal('process', { ...process, platform: 'darwin' });
    const result = getDefaultUserDataPath('MyBot');
    expect(result).toBe(path.join(os.homedir(), 'Library', 'Application Support', 'MyBot'));
  });

  it('returns Windows path when platform is win32', () => {
    vi.stubGlobal('process', { ...process, platform: 'win32' });
    const result = getDefaultUserDataPath('MyBot');
    expect(result).toContain('MyBot');
  });

  it('returns Linux/XDG path as fallback', () => {
    vi.stubGlobal('process', { ...process, platform: 'linux' });
    const result = getDefaultUserDataPath('MyBot');
    expect(result).toContain('MyBot');
  });
});

describe('getDefaultTempPath', () => {
  it('returns os.tmpdir()', () => {
    expect(getDefaultTempPath()).toBe(os.tmpdir());
  });
});

describe('createDefaultPlatformConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates config with default values', () => {
    vi.stubGlobal('process', { ...process, platform: 'darwin', arch: 'arm64' });
    const config = createDefaultPlatformConfig('MyBot');
    expect(config.userDataPath).toBeTruthy();
    expect(config.tempPath).toBe(os.tmpdir());
    expect(config.isPackaged).toBe(false);
    expect(config.platform).toBe('darwin');
    expect(config.arch).toBe('arm64');
  });

  it('merges overrides', () => {
    const config = createDefaultPlatformConfig('MyBot', { isPackaged: true });
    expect(config.isPackaged).toBe(true);
  });

  it('does not include resourcesPath unless provided', () => {
    const config = createDefaultPlatformConfig('MyBot');
    expect(config.resourcesPath).toBeUndefined();
  });

  it('does not include appPath unless provided', () => {
    const config = createDefaultPlatformConfig('MyBot');
    expect(config.appPath).toBeUndefined();
  });
});

describe('resolveUserDataPath', () => {
  it('joins userDataPath with segments', () => {
    const config: PlatformConfig = {
      userDataPath: '/data/myapp',
      tempPath: '/tmp',
      isPackaged: false,
      platform: 'darwin',
      arch: 'arm64',
    };
    expect(resolveUserDataPath(config, 'sub', 'dir')).toBe('/data/myapp/sub/dir');
  });

  it('handles single segment', () => {
    const config: PlatformConfig = {
      userDataPath: '/data',
      tempPath: '/tmp',
      isPackaged: false,
      platform: 'linux',
      arch: 'x64',
    };
    expect(resolveUserDataPath(config, 'cache')).toBe('/data/cache');
  });
});

describe('resolveResourcesPath', () => {
  it('returns path when resourcesPath is set', () => {
    const config: PlatformConfig = {
      userDataPath: '/data',
      tempPath: '/tmp',
      isPackaged: true,
      resourcesPath: '/app/resources',
      platform: 'linux',
      arch: 'x64',
    };
    expect(resolveResourcesPath(config, 'icons')).toBe('/app/resources/icons');
  });

  it('returns null when resourcesPath is not set', () => {
    const config: PlatformConfig = {
      userDataPath: '/data',
      tempPath: '/tmp',
      isPackaged: false,
      platform: 'linux',
      arch: 'x64',
    };
    expect(resolveResourcesPath(config, 'icons')).toBeNull();
  });
});

describe('resolveAppPath', () => {
  it('returns path when appPath is set', () => {
    const config: PlatformConfig = {
      userDataPath: '/data',
      tempPath: '/tmp',
      isPackaged: true,
      appPath: '/app',
      platform: 'darwin',
      arch: 'arm64',
    };
    expect(resolveAppPath(config, 'bin', 'tool')).toBe('/app/bin/tool');
  });

  it('returns null when appPath is not set', () => {
    const config: PlatformConfig = {
      userDataPath: '/data',
      tempPath: '/tmp',
      isPackaged: false,
      platform: 'linux',
      arch: 'x64',
    };
    expect(resolveAppPath(config, 'bin')).toBeNull();
  });
});
