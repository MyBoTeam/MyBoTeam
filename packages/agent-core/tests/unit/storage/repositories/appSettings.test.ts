import { afterEach, describe, expect, it, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  exec: vi.fn(),
  run: vi.fn(),
  getRowsModified: vi.fn(),
}));

vi.mock('../../../../src/storage/database.js', () => ({
  getDatabase: vi.fn(() => mockDb),
  flushDatabase: vi.fn(),
}));

import {
  clearAppSettings,
  getAppSettings,
  getCloudBrowserConfig,
  getMessagingConfig,
  getSandboxConfig,
  setCloudBrowserConfig,
  setMessagingConfig,
  setSandboxConfig,
} from '../../../../src/storage/repositories/appSettings.js';

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    debug_mode: 0,
    onboarding_complete: 0,
    selected_model: null,
    ollama_config: null,
    litellm_config: null,
    azure_foundry_config: null,
    lmstudio_config: null,
    huggingface_local_config: null,
    openai_base_url: null,
    theme: 'system',
    sandbox_config: '{}',
    cloud_browser_config: null,
    messaging_config: null,
    notifications_enabled: 1,
    nim_config: null,
    language: 'auto',
    close_behavior: 'keep-daemon',
    ...overrides,
  };
}

function qResult<T extends Record<string, unknown>>(rows: T | T[]): any[] {
  const arr = Array.isArray(rows) ? rows : [rows];
  if (arr.length === 0) return [];
  const columns = Object.keys(arr[0]);
  const values = arr.map((r) => columns.map((c) => r[c]));
  return [{ columns, values }];
}

describe('appSettings repository', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSandboxConfig', () => {
    it('returns default config when row is empty object', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ sandbox_config: '{}' })));
      const config = getSandboxConfig();
      expect(config.mode).toBe('disabled');
      expect(config.networkRestricted).toBe(false);
    });

    it('returns parsed config when valid', () => {
      mockDb.exec.mockReturnValueOnce(
        qResult(
          makeRow({
            sandbox_config: JSON.stringify({
              mode: 'docker',
              allowedPaths: ['/tmp'],
              networkRestricted: true,
              allowedHosts: ['example.com'],
            }),
          }),
        ),
      );
      const config = getSandboxConfig();
      expect(config.mode).toBe('docker');
      expect(config.allowedPaths).toEqual(['/tmp']);
      expect(config.networkRestricted).toBe(true);
    });

    it('returns default config when parsed data is incomplete', () => {
      mockDb.exec.mockReturnValueOnce(
        qResult(
          makeRow({
            sandbox_config: JSON.stringify({ mode: 'docker' }),
          }),
        ),
      );
      const config = getSandboxConfig();
      expect(config.mode).toBe('disabled');
    });
  });

  describe('setSandboxConfig', () => {
    it('stores JSON-stringified config', () => {
      setSandboxConfig({
        mode: 'docker',
        allowedPaths: ['/tmp'],
        networkRestricted: true,
        allowedHosts: [],
      });
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        JSON.stringify({
          mode: 'docker',
          allowedPaths: ['/tmp'],
          networkRestricted: true,
          allowedHosts: [],
        }),
      ]);
    });
  });

  describe('getCloudBrowserConfig', () => {
    it('returns null when not set', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ cloud_browser_config: null })));
      expect(getCloudBrowserConfig()).toBeNull();
    });

    it('returns parsed config', () => {
      const config = { enabled: true, url: 'https://browser.example.com' };
      mockDb.exec.mockReturnValueOnce(
        qResult(makeRow({ cloud_browser_config: JSON.stringify(config) })),
      );
      expect(getCloudBrowserConfig()).toEqual(config);
    });

    it('returns null on invalid JSON', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ cloud_browser_config: 'not-json' })));
      expect(getCloudBrowserConfig()).toBeNull();
    });
  });

  describe('setCloudBrowserConfig', () => {
    it('stores JSON-stringified config', () => {
      setCloudBrowserConfig({ enabled: true, url: 'https://browser.example.com' });
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        JSON.stringify({ enabled: true, url: 'https://browser.example.com' }),
      ]);
    });

    it('stores null when config is null', () => {
      setCloudBrowserConfig(null);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        null,
      ]);
    });
  });

  describe('getMessagingConfig', () => {
    it('returns null when not set', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ messaging_config: null })));
      expect(getMessagingConfig()).toBeNull();
    });

    it('returns parsed config', () => {
      const config = { slack: { enabled: true, token: 'xoxb-xxx' } };
      mockDb.exec.mockReturnValueOnce(
        qResult(makeRow({ messaging_config: JSON.stringify(config) })),
      );
      expect(getMessagingConfig()).toEqual(config);
    });

    it('returns null on invalid JSON', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ messaging_config: 'bad-json' })));
      expect(getMessagingConfig()).toBeNull();
    });
  });

  describe('setMessagingConfig', () => {
    it('stores JSON-stringified config', () => {
      setMessagingConfig({ slack: { enabled: true, token: 'xoxb-xxx' } });
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        JSON.stringify({ slack: { enabled: true, token: 'xoxb-xxx' } }),
      ]);
    });

    it('stores null when config is null', () => {
      setMessagingConfig(null);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        null,
      ]);
    });
  });

  describe('getAppSettings', () => {
    it('returns all settings aggregated', () => {
      mockDb.exec
        .mockReturnValueOnce(
          qResult(
            makeRow({
              debug_mode: 1,
              onboarding_complete: 1,
              selected_model: JSON.stringify({ provider: 'ollama', modelId: 'llama3' }),
              theme: 'dark',
              language: 'en',
            }),
          ),
        )
        .mockReturnValueOnce(
          qResult(
            makeRow({
              language: 'en',
              close_behavior: 'keep-daemon',
              debug_mode: 1,
              onboarding_complete: 1,
              theme: 'dark',
              notifications_enabled: 1,
            }),
          ),
        );
      const settings = getAppSettings();
      expect(settings.debugMode).toBe(true);
      expect(settings.onboardingComplete).toBe(true);
      expect(settings.selectedModel).toEqual({ provider: 'ollama', modelId: 'llama3' });
      expect(settings.theme).toBe('dark');
      expect(settings.language).toBe('en');
    });
  });

  describe('clearAppSettings', () => {
    it('resets all settings to defaults', () => {
      clearAppSettings();
      expect(mockDb.run).toHaveBeenCalled();
    });
  });
});
