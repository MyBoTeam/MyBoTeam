import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCandidateAppRoots,
  getLinuxPackageNames,
  getOpenCodePlatformInfo,
  getWindowsPackageNames,
} from '../../../src/opencode/cli-path-utils.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getLinuxPackageNames', () => {
  it('returns arm64 packages for arm64 arch', () => {
    const OLD_ARCH = process.arch;
    Object.defineProperty(process, 'arch', { value: 'arm64' });

    const names = getLinuxPackageNames();
    expect(names).toContain('opencode-linux-arm64');
    expect(names).toContain('opencode-linux-arm64-musl');

    Object.defineProperty(process, 'arch', { value: OLD_ARCH });
  });

  it('returns x64 packages for x64 arch', () => {
    const OLD_ARCH = process.arch;
    Object.defineProperty(process, 'arch', { value: 'x64' });

    const names = getLinuxPackageNames();
    expect(names).toContain('opencode-linux-x64');

    Object.defineProperty(process, 'arch', { value: OLD_ARCH });
  });
});

describe('getOpenCodePlatformInfo', () => {
  it('returns win32 info for win32 platform', () => {
    const OLD_PLATFORM = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const info = getOpenCodePlatformInfo();
    expect(info.binaryName).toBe('opencode.exe');
    expect(info.packageNames).toBeInstanceOf(Array);

    Object.defineProperty(process, 'platform', { value: OLD_PLATFORM });
  });

  it('returns linux info for linux platform', () => {
    const OLD_PLATFORM = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const info = getOpenCodePlatformInfo();
    expect(info.binaryName).toBe('opencode');

    Object.defineProperty(process, 'platform', { value: OLD_PLATFORM });
  });

  it('returns darwin info for darwin platform', () => {
    const OLD_PLATFORM = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin' });

    const info = getOpenCodePlatformInfo();
    expect(info.binaryName).toBe('opencode');

    Object.defineProperty(process, 'platform', { value: OLD_PLATFORM });
  });
});

describe('getCandidateAppRoots', () => {
  it('includes APP_ROOT when set', () => {
    const OLD_ROOT = process.env.APP_ROOT;
    process.env.APP_ROOT = '/custom/app';

    const roots = getCandidateAppRoots();
    expect(roots).toContain('/custom/app');

    process.env.APP_ROOT = OLD_ROOT;
  });

  it('includes resolved appPath and parent dirs', () => {
    const roots = getCandidateAppRoots('/base/app');
    expect(roots).toContain('/base/app');
  });

  it('deduplicates roots', () => {
    const OLD_ROOT = process.env.APP_ROOT;
    process.env.APP_ROOT = '/base';

    const roots = getCandidateAppRoots('/base');
    const uniqueRoots = new Set(roots);
    expect(uniqueRoots.size).toBe(roots.length);

    process.env.APP_ROOT = OLD_ROOT;
  });

  it('returns empty array when no inputs', () => {
    const OLD_ROOT = process.env.APP_ROOT;
    delete process.env.APP_ROOT;

    const roots = getCandidateAppRoots();
    expect(roots).toEqual([]);

    process.env.APP_ROOT = OLD_ROOT;
  });
});

describe('getWindowsPackageNames', () => {
  it('returns windows package names', () => {
    const names = getWindowsPackageNames();
    expect(names).toBeInstanceOf(Array);
    expect(names.length).toBeGreaterThan(0);
  });
});
