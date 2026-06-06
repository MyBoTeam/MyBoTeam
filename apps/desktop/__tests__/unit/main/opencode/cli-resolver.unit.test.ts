import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockIsPackaged = vi.hoisted(() => vi.fn(() => false));
const mockGetAppPath = vi.hoisted(() => vi.fn(() => '/mock/app/path'));

vi.mock('electron', () => ({
  app: {
    get isPackaged() {
      return mockIsPackaged();
    },
    getAppPath: mockGetAppPath,
  },
}));

const mockCoreResolveCliPath = vi.hoisted(() => vi.fn());
const mockCoreIsCliAvailable = vi.hoisted(() => vi.fn());
const mockExistsSync = vi.hoisted(() => vi.fn());
const mockReadFileSync = vi.hoisted(() => vi.fn());

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  resolveCliPath: mockCoreResolveCliPath,
  isCliAvailable: mockCoreIsCliAvailable,
}));

vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}));

import {
  getBundledOpenCodeVersion,
  getOpenCodeCliPath,
  isOpenCodeBundled,
  isOpenCodeCliAvailable,
} from '@main/opencode/cli-resolver';

describe('CLI Resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_ROOT = '/mock/app/root';
    Object.defineProperty(process, 'resourcesPath', {
      value: '/mock/resources',
      writable: false,
      configurable: true,
    });
    mockGetAppPath.mockReturnValue('/mock/app/path');
  });

  describe('getOpenCodeCliPath', () => {
    it('should resolve CLI path when core returns a path', () => {
      mockCoreResolveCliPath.mockReturnValue({ cliPath: '/usr/local/bin/opencode' });
      const result = getOpenCodeCliPath();
      expect(result).toEqual({ command: '/usr/local/bin/opencode', args: [] });
    });

    it('should throw when core returns null', () => {
      mockCoreResolveCliPath.mockReturnValue(null);
      expect(() => getOpenCodeCliPath()).toThrow('OpenCode CLI executable not found');
    });
  });

  describe('isOpenCodeBundled', () => {
    it('should return true when CLI is available', () => {
      mockCoreIsCliAvailable.mockReturnValue(true);
      expect(isOpenCodeBundled()).toBe(true);
    });

    it('should return false when CLI is not available', () => {
      mockCoreIsCliAvailable.mockReturnValue(false);
      expect(isOpenCodeBundled()).toBe(false);
    });
  });

  describe('isOpenCodeCliAvailable', () => {
    it('should return true when CLI is available', () => {
      mockCoreIsCliAvailable.mockReturnValue(true);
      expect(isOpenCodeCliAvailable()).toBe(true);
    });

    it('should return false when CLI is not available', () => {
      mockCoreIsCliAvailable.mockReturnValue(false);
      expect(isOpenCodeCliAvailable()).toBe(false);
    });
  });

  describe('getBundledOpenCodeVersion', () => {
    it('should return null when CLI path cannot be resolved', () => {
      mockCoreResolveCliPath.mockReturnValue(null);
      expect(getBundledOpenCodeVersion()).toBeNull();
    });

    it('should return version from CLI --version output when not packaged', async () => {
      mockCoreResolveCliPath.mockReturnValue({ cliPath: '/usr/local/bin/opencode' });
      mockIsPackaged.mockReturnValue(false);
      const execFileSync = (await import('node:child_process')).execFileSync as ReturnType<
        typeof vi.fn
      >;
      execFileSync.mockReturnValue('opencode 0.5.1\n');
      expect(getBundledOpenCodeVersion()).toBe('0.5.1');
    });

    it('should return null on exec error', async () => {
      mockCoreResolveCliPath.mockReturnValue({ cliPath: '/usr/local/bin/opencode' });
      mockIsPackaged.mockReturnValue(false);
      const execFileSync = (await import('node:child_process')).execFileSync as ReturnType<
        typeof vi.fn
      >;
      execFileSync.mockImplementation(() => {
        throw new Error('command not found');
      });
      expect(getBundledOpenCodeVersion()).toBeNull();
    });
  });
});
