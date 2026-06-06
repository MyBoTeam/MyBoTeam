import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockExistsSync = vi.hoisted(() => vi.fn());
const mockMkdirSync = vi.hoisted(() => vi.fn());
const mockWriteFileSync = vi.hoisted(() => vi.fn());
const mockUnlinkSync = vi.hoisted(() => vi.fn());
const mockExecSync = vi.hoisted(() => vi.fn());
const mockGetPath = vi.hoisted(() => vi.fn());
const mockGetAppPath = vi.hoisted(() => vi.fn());
const mockGetLoginItemSettings = vi.hoisted(() => vi.fn(() => ({ openAtLogin: false })));
const mockSetLoginItemSettings = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    writeFileSync: mockWriteFileSync,
    unlinkSync: mockUnlinkSync,
  },
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  writeFileSync: mockWriteFileSync,
  unlinkSync: mockUnlinkSync,
}));

vi.mock('node:path', () => ({
  default: { join: (...args: string[]) => args.join('/') },
  join: (...args: string[]) => args.join('/'),
  resolve: (...args: string[]) => args.join('/'),
}));

vi.mock('node:child_process', () => ({
  default: { execSync: mockExecSync },
  execSync: mockExecSync,
}));

vi.mock('electron', () => ({
  app: {
    getPath: mockGetPath,
    getAppPath: mockGetAppPath,
    getLoginItemSettings: mockGetLoginItemSettings,
    setLoginItemSettings: mockSetLoginItemSettings,
    isPackaged: false,
  },
}));

import {
  disableAutoStart,
  enableAutoStart,
  isAutoStartEnabled,
} from '@main/daemon/service-manager';

const realProcess = globalThis.process;

describe('service-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPath.mockReturnValue('/mock/userData');
    mockGetAppPath.mockReturnValue('/mock/app');
    mockExistsSync.mockReturnValue(true);
    mockExecSync.mockReturnValue('');
  });

  describe('isAutoStartEnabled', () => {
    it('should check LaunchAgent on macOS', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'darwin' });
      vi.stubEnv('HOME', '/Users/mockuser');
      try {
        mockExistsSync.mockReturnValue(true);
        expect(isAutoStartEnabled()).toBe(true);
        expect(mockExistsSync).toHaveBeenCalledWith(
          '/Users/mockuser/Library/LaunchAgents/ai.myboteam.daemon.plist',
        );
      } finally {
        vi.stubGlobal('process', realProcess);
        vi.unstubAllEnvs();
      }
    });

    it('should return false when LaunchAgent not installed on macOS', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'darwin' });
      vi.stubEnv('HOME', '/Users/mockuser');
      try {
        mockExistsSync.mockReturnValue(false);
        expect(isAutoStartEnabled()).toBe(false);
      } finally {
        vi.stubGlobal('process', realProcess);
        vi.unstubAllEnvs();
      }
    });

    it('should check login items on Windows', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'win32' });

      try {
        const result = isAutoStartEnabled();
        expect(mockGetLoginItemSettings).toHaveBeenCalled();
      } finally {
        vi.stubGlobal('process', realProcess);
      }
    });

    it('should check systemd on linux', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'linux' });
      mockExecSync.mockReturnValue({ toString: () => 'enabled', trim: () => 'enabled' });

      try {
        const result = isAutoStartEnabled();
        expect(result).toBe(true);
      } finally {
        vi.stubGlobal('process', realProcess);
      }
    });

    it('should return false for linux when systemctl fails', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'linux' });
      mockExecSync.mockImplementation(() => {
        throw new Error('not enabled');
      });

      try {
        const result = isAutoStartEnabled();
        expect(result).toBe(false);
      } finally {
        vi.stubGlobal('process', realProcess);
      }
    });
  });

  describe('enableAutoStart - macOS', () => {
    beforeEach(() => {
      vi.stubGlobal('process', { ...realProcess, platform: 'darwin' });
      vi.stubEnv('HOME', '/Users/mockuser');
    });
    afterEach(() => {
      vi.stubGlobal('process', realProcess);
      vi.unstubAllEnvs();
    });

    it('should install LaunchAgent on macOS (dev mode)', () => {
      enableAutoStart();

      expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringContaining('Library/LaunchAgents'), {
        recursive: true,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.plist'),
        expect.stringContaining('ai.myboteam.daemon'),
        { mode: 0o644 },
      );
      expect(mockExecSync).toHaveBeenCalled();
    });

    it('should handle launchctl errors', () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('launchctl load')) {
          throw new Error('Launchctl failed');
        }
        return '';
      });

      expect(() => enableAutoStart()).toThrow('Launchctl failed');
    });
  });

  describe('enableAutoStart - Linux', () => {
    it('should install systemd service', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'linux' });

      try {
        enableAutoStart();

        expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringContaining('systemd/user'), {
          recursive: true,
        });
        expect(mockWriteFileSync).toHaveBeenCalled();
        expect(mockExecSync).toHaveBeenCalledWith('systemctl --user daemon-reload', {
          stdio: 'pipe',
        });
      } finally {
        vi.stubGlobal('process', realProcess);
      }
    });

    it('should handle systemctl errors', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'linux' });
      mockExecSync.mockImplementation(() => {
        throw new Error('systemctl failed');
      });

      try {
        expect(() => enableAutoStart()).toThrow('systemctl failed');
      } finally {
        vi.stubGlobal('process', realProcess);
      }
    });
  });

  describe('enableAutoStart - Windows', () => {
    it('should set login item in dev mode', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'win32' });

      try {
        enableAutoStart();
        expect(mockSetLoginItemSettings).toHaveBeenCalledWith({
          openAtLogin: true,
          openAsHidden: true,
        });
      } finally {
        vi.stubGlobal('process', realProcess);
      }
    });
  });

  describe('disableAutoStart - macOS', () => {
    beforeEach(() => {
      vi.stubGlobal('process', { ...realProcess, platform: 'darwin' });
      vi.stubEnv('HOME', '/Users/mockuser');
    });
    afterEach(() => {
      vi.stubGlobal('process', realProcess);
      vi.unstubAllEnvs();
    });

    it('should uninstall LaunchAgent', () => {
      mockExistsSync.mockReturnValue(true);

      disableAutoStart();

      expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('launchctl unload'), {
        stdio: 'pipe',
      });
      expect(mockUnlinkSync).toHaveBeenCalled();
    });

    it('should handle missing LaunchAgent file', () => {
      mockExistsSync.mockReturnValue(false);

      disableAutoStart();

      expect(mockUnlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('disableAutoStart - Linux', () => {
    it('should uninstall systemd service', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'linux' });
      mockExistsSync.mockReturnValue(true);

      try {
        disableAutoStart();

        expect(mockExecSync).toHaveBeenCalledWith(
          'systemctl --user disable myboteam-daemon.service',
          { stdio: 'pipe' },
        );
        expect(mockUnlinkSync).toHaveBeenCalled();
      } finally {
        vi.stubGlobal('process', realProcess);
      }
    });

    it('should handle systemctl errors gracefully', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'linux' });
      mockExecSync.mockImplementation(() => {
        throw new Error('failed');
      });

      try {
        expect(() => disableAutoStart()).not.toThrow();
      } finally {
        vi.stubGlobal('process', realProcess);
      }
    });
  });

  describe('disableAutoStart - Windows', () => {
    it('should disable login item', () => {
      vi.stubGlobal('process', { ...realProcess, platform: 'win32' });

      try {
        disableAutoStart();
        expect(mockSetLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: false });
      } finally {
        vi.stubGlobal('process', realProcess);
      }
    });
  });
});
