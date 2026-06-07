import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalWindow = globalThis.window;

describe('MyBoTeam API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
    (globalThis as unknown as { window: typeof window }).window = originalWindow;
  });

  describe('isRunningInElectron', () => {
    it('should return true when myboteamShell.isElectron is true', async () => {
      (globalThis as unknown as { window: { myboteamShell: { isElectron: boolean } } }).window = {
        myboteamShell: { isElectron: true },
      };

      const { isRunningInElectron } = await import('@/config/myboteam');
      expect(isRunningInElectron()).toBe(true);
    });

    it('should return false when myboteamShell.isElectron is false', async () => {
      (globalThis as unknown as { window: { myboteamShell: { isElectron: boolean } } }).window = {
        myboteamShell: { isElectron: false },
      };

      const { isRunningInElectron } = await import('@/config/myboteam');
      expect(isRunningInElectron()).toBe(false);
    });

    it('should return false when myboteamShell is unavailable', async () => {
      const unavailableScenarios = [
        { myboteamShell: undefined },
        { myboteamShell: null },
        { myboteamShell: { version: '1.0.0' } },
        {},
      ];

      for (const scenario of unavailableScenarios) {
        vi.resetModules();
        (globalThis as unknown as { window: Record<string, unknown> }).window = scenario;
        const { isRunningInElectron } = await import('@/config/myboteam');
        expect(isRunningInElectron()).toBe(false);
      }
    });

    it('should use strict equality for isElectron check', async () => {
      (globalThis as unknown as { window: { myboteamShell: { isElectron: number } } }).window = {
        myboteamShell: { isElectron: 1 },
      };

      const { isRunningInElectron } = await import('@/config/myboteam');
      expect(isRunningInElectron()).toBe(false);
    });
  });

  describe('getShellVersion', () => {
    it('should return version when available', async () => {
      (globalThis as unknown as { window: { myboteamShell: { version: string } } }).window = {
        myboteamShell: { version: '1.2.3' },
      };

      const { getShellVersion } = await import('@/config/myboteam');
      expect(getShellVersion()).toBe('1.2.3');
    });

    it('should return null when version is unavailable', async () => {
      const unavailableScenarios = [
        { myboteamShell: undefined },
        { myboteamShell: { isElectron: true } },
        {},
      ];

      for (const scenario of unavailableScenarios) {
        vi.resetModules();
        (globalThis as unknown as { window: Record<string, unknown> }).window = scenario;
        const { getShellVersion } = await import('@/config/myboteam');
        expect(getShellVersion()).toBeNull();
      }
    });

    it('should handle various version formats', async () => {
      const versions = ['0.0.1', '1.0.0', '2.5.10', '1.0.0-beta.1', '1.0.0-rc.2'];

      for (const version of versions) {
        vi.resetModules();
        (globalThis as unknown as { window: { myboteamShell: { version: string } } }).window = {
          myboteamShell: { version },
        };
        const { getShellVersion } = await import('@/config/myboteam');
        expect(getShellVersion()).toBe(version);
      }
    });
  });

  describe('getShellPlatform', () => {
    it('should return platform when available', async () => {
      const platforms = ['darwin', 'linux', 'win32'];

      for (const platform of platforms) {
        vi.resetModules();
        (globalThis as unknown as { window: { myboteamShell: { platform: string } } }).window = {
          myboteamShell: { platform },
        };
        const { getShellPlatform } = await import('@/config/myboteam');
        expect(getShellPlatform()).toBe(platform);
      }
    });

    it('should return null when platform is unavailable', async () => {
      const unavailableScenarios = [
        { myboteamShell: undefined },
        { myboteamShell: { isElectron: true } },
        {},
      ];

      for (const scenario of unavailableScenarios) {
        vi.resetModules();
        (globalThis as unknown as { window: Record<string, unknown> }).window = scenario;
        const { getShellPlatform } = await import('@/config/myboteam');
        expect(getShellPlatform()).toBeNull();
      }
    });
  });

  describe('getMyBoTeam', () => {
    it('should return myboteam API when available', async () => {
      const mockApi = {
        getVersion: vi.fn(),
        startTask: vi.fn(),
        validateBedrockCredentials: vi.fn(),
        saveBedrockCredentials: vi.fn(),
        getBedrockCredentials: vi.fn(),
      };
      (globalThis as unknown as { window: { myboteam: typeof mockApi } }).window = {
        myboteam: mockApi,
      };

      const { getMyBoTeam } = await import('@/config/myboteam');
      const result = getMyBoTeam();

      expect(result.getVersion).toBeDefined();
      expect(result.startTask).toBeDefined();
      expect(result.validateBedrockCredentials).toBeDefined();
      expect(result.saveBedrockCredentials).toBeDefined();
      expect(result.getBedrockCredentials).toBeDefined();
    });

    it('should throw when myboteam API is not available', async () => {
      const unavailableScenarios = [{ myboteam: undefined }, {}];

      for (const scenario of unavailableScenarios) {
        vi.resetModules();
        (globalThis as unknown as { window: Record<string, unknown> }).window = scenario;
        const { getMyBoTeam } = await import('@/config/myboteam');
        expect(() => getMyBoTeam()).toThrow('MyBoTeam API not available - not running in Electron');
      }
    });
  });

  describe('useMyBoTeam', () => {
    it('should return myboteam API when available', async () => {
      const mockApi = { getVersion: vi.fn(), startTask: vi.fn() };
      (globalThis as unknown as { window: { myboteam: typeof mockApi } }).window = {
        myboteam: mockApi,
      };

      const { useMyBoTeam } = await import('@/config/myboteam');
      expect(useMyBoTeam()).toBe(mockApi);
    });

    it('should throw when myboteam API is not available', async () => {
      (globalThis as unknown as { window: { myboteam?: unknown } }).window = {
        myboteam: undefined,
      };

      const { useMyBoTeam } = await import('@/config/myboteam');
      expect(() => useMyBoTeam()).toThrow('MyBoTeam API not available - not running in Electron');
    });
  });

  describe('Complete Shell Object', () => {
    it('should recognize complete shell object with all properties', async () => {
      const completeShell = {
        version: '1.0.0',
        platform: 'darwin',
        isElectron: true as const,
      };
      (globalThis as unknown as { window: { myboteamShell: typeof completeShell } }).window = {
        myboteamShell: completeShell,
      };

      const { isRunningInElectron, getShellVersion, getShellPlatform } = await import(
        '@/config/myboteam'
      );

      expect(isRunningInElectron()).toBe(true);
      expect(getShellVersion()).toBe('1.0.0');
      expect(getShellPlatform()).toBe('darwin');
    });

    it('should handle partial shell object gracefully', async () => {
      const partialShell = { version: '1.0.0', isElectron: true as const };
      (globalThis as unknown as { window: { myboteamShell: typeof partialShell } }).window = {
        myboteamShell: partialShell,
      };

      const { isRunningInElectron, getShellVersion, getShellPlatform } = await import(
        '@/config/myboteam'
      );

      expect(isRunningInElectron()).toBe(true);
      expect(getShellVersion()).toBe('1.0.0');
      expect(getShellPlatform()).toBeNull();
    });
  });
});
