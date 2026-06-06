import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  validateBedrockCredentials: vi.fn(),
  fetchBedrockModels: vi.fn(),
}));

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => ({ logEnv: vi.fn() })),
}));

vi.mock('@main/store/secureStorage', () => ({
  getApiKey: vi.fn(),
  storeApiKey: vi.fn(),
}));

vi.mock('@main/ipc/validation', () => ({
  normalizeIpcError: vi.fn((e) => (e instanceof Error ? e.message : String(e))),
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handlers[channel] = handler;
  }),
}));

import { registerBedrockHandlers } from '@main/ipc/handlers/api-key-handlers/bedrock-handlers';
import { getApiKey, storeApiKey } from '@main/store/secureStorage';

describe('bedrock-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    registerBedrockHandlers();
  });

  describe('bedrock:validate', () => {
    it('should call validateBedrockCredentials', async () => {
      const mod = await import('@myboteam/agent-core/desktop-main');
      vi.mocked(mod.validateBedrockCredentials).mockResolvedValue({ success: true });
      const result = await handlers['bedrock:validate']({} as never, 'creds-json');
      expect(mod.validateBedrockCredentials).toHaveBeenCalledWith('creds-json');
    });
  });

  describe('bedrock:fetch-models', () => {
    it('should fetch models from parsed credentials', async () => {
      const mod = await import('@myboteam/agent-core/desktop-main');
      vi.mocked(mod.fetchBedrockModels).mockResolvedValue({ success: true, models: [] });
      const result = await handlers['bedrock:fetch-models'](
        {} as never,
        JSON.stringify({ region: 'us-east-1' }),
      );
      expect(mod.fetchBedrockModels).toHaveBeenCalledWith({ region: 'us-east-1' });
    });
  });

  describe('bedrock:save', () => {
    it('should save apiKey credentials', async () => {
      const creds = { authType: 'apiKey', apiKey: 'sk-1234567890' };
      const result = await handlers['bedrock:save']({} as never, JSON.stringify(creds));
      expect(storeApiKey).toHaveBeenCalledWith('bedrock', JSON.stringify(creds));
      expect(result.provider).toBe('bedrock');
    });

    it('should save accessKeys credentials', async () => {
      const creds = {
        authType: 'accessKeys',
        accessKeyId: 'AKIA12345678',
        secretAccessKey: 'secret',
      };
      const result = await handlers['bedrock:save']({} as never, JSON.stringify(creds));
      expect(result.label).toBe('AWS Access Keys');
    });

    it('should save profile credentials', async () => {
      const creds = { authType: 'profile', profileName: 'my-profile' };
      const result = await handlers['bedrock:save']({} as never, JSON.stringify(creds));
      expect(result.label).toBe('AWS Profile: my-profile');
    });

    it('should throw for missing apiKey', async () => {
      await expect(
        handlers['bedrock:save']({} as never, JSON.stringify({ authType: 'apiKey', apiKey: '' })),
      ).rejects.toThrow('API Key is required');
    });

    it('should throw for missing accessKeyId', async () => {
      await expect(
        handlers['bedrock:save'](
          {} as never,
          JSON.stringify({ authType: 'accessKeys', accessKeyId: '', secretAccessKey: '' }),
        ),
      ).rejects.toThrow('Access Key ID');
    });

    it('should throw for missing profileName', async () => {
      await expect(
        handlers['bedrock:save'](
          {} as never,
          JSON.stringify({ authType: 'profile', profileName: '' }),
        ),
      ).rejects.toThrow('Profile name');
    });

    it('should throw for invalid authType', async () => {
      await expect(
        handlers['bedrock:save']({} as never, JSON.stringify({ authType: 'invalid' })),
      ).rejects.toThrow('Invalid authentication type');
    });
  });

  describe('bedrock:get-credentials', () => {
    it('should return parsed credentials', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue(
        JSON.stringify({ region: 'us-east-1' }),
      );
      const result = await handlers['bedrock:get-credentials']({} as never);
      expect(result).toEqual({ region: 'us-east-1' });
    });

    it('should return null when no stored credentials', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await handlers['bedrock:get-credentials']({} as never);
      expect(result).toBeNull();
    });
  });
});
