import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExecSync = vi.hoisted(() => vi.fn());
const mockReadFileSync = vi.hoisted(() => vi.fn());
const originalPlatform = process.platform;

vi.mock('node:child_process', () => ({
  execSync: mockExecSync,
}));

vi.mock('node:fs', () => ({
  default: {
    readFileSync: mockReadFileSync,
  },
  readFileSync: mockReadFileSync,
}));

import { computeDeviceFingerprint } from '@main/identity/device-fingerprint';

function setPlatform(p: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value: p, configurable: true });
}

describe('device-fingerprint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  describe('computeDeviceFingerprint', () => {
    describe('on macOS (darwin)', () => {
      beforeEach(() => setPlatform('darwin'));

      it('should compute fingerprint from ioreg output', () => {
        mockExecSync.mockReturnValueOnce('"IOPlatformUUID" = "ABC123-DEF456"');
        const result = computeDeviceFingerprint();
        expect(mockExecSync).toHaveBeenCalledWith('ioreg -rd1 -c IOPlatformExpertDevice', {
          encoding: 'utf8',
          timeout: 5_000,
        });
        expect(result).toMatch(/^[a-f0-9]{32}$/);
      });

      it('should return null when ioreg fails', () => {
        mockExecSync.mockImplementationOnce(() => {
          throw new Error('command not found');
        });
        const result = computeDeviceFingerprint();
        expect(result).toBeNull();
      });

      it('should return null when UUID not found in output', () => {
        mockExecSync.mockReturnValueOnce('no UUID here');
        const result = computeDeviceFingerprint();
        expect(result).toBeNull();
      });
    });

    describe('on Windows (win32)', () => {
      beforeEach(() => setPlatform('win32'));

      it('should compute fingerprint from PowerShell MachineGuid', () => {
        mockExecSync.mockReturnValueOnce('1234-ABCD-5678-EFGH\n');
        const result = computeDeviceFingerprint();
        expect(mockExecSync).toHaveBeenCalledWith(
          'powershell -NoProfile -Command "(Get-ItemProperty -Path \'HKLM:\\SOFTWARE\\Microsoft\\Cryptography\' -Name MachineGuid).MachineGuid"',
          { encoding: 'utf8', timeout: 5_000 },
        );
        expect(result).toMatch(/^[a-f0-9]{32}$/);
      });

      it('should return null when PowerShell fails', () => {
        mockExecSync.mockImplementationOnce(() => {
          throw new Error('powershell not found');
        });
        const result = computeDeviceFingerprint();
        expect(result).toBeNull();
      });

      it('should return null when GUID is empty', () => {
        mockExecSync.mockReturnValueOnce('  \n');
        const result = computeDeviceFingerprint();
        expect(result).toBeNull();
      });
    });

    describe('on Linux', () => {
      beforeEach(() => setPlatform('linux'));

      it('should compute fingerprint from /etc/machine-id', () => {
        mockReadFileSync.mockReturnValueOnce('abc123machineid\n');
        const result = computeDeviceFingerprint();
        expect(mockReadFileSync).toHaveBeenCalledWith('/etc/machine-id', 'utf8');
        expect(result).toMatch(/^[a-f0-9]{32}$/);
      });

      it('should fall back to /var/lib/dbus/machine-id when /etc/machine-id fails', () => {
        mockReadFileSync.mockImplementationOnce(() => {
          throw new Error('ENOENT');
        });
        mockReadFileSync.mockReturnValueOnce('dbus-machine-id-here\n');
        const result = computeDeviceFingerprint();
        expect(mockReadFileSync).toHaveBeenCalledWith('/var/lib/dbus/machine-id', 'utf8');
        expect(result).toMatch(/^[a-f0-9]{32}$/);
      });

      it('should return null when both machine-id files fail', () => {
        mockReadFileSync.mockImplementation(() => {
          throw new Error('ENOENT');
        });
        const result = computeDeviceFingerprint();
        expect(result).toBeNull();
      });
    });

    describe('on unsupported platform', () => {
      beforeEach(() => setPlatform('freebsd'));

      it('should return null', () => {
        const result = computeDeviceFingerprint();
        expect(result).toBeNull();
      });
    });
  });
});
