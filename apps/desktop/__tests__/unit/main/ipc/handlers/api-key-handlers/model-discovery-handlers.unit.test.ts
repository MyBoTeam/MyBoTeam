import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  fetchOpenRouterModels: vi.fn(),
  fetchProviderModels: vi.fn(),
  DEFAULT_PROVIDERS: [
    {
      id: 'openai',
      name: 'OpenAI',
      modelsEndpoint: { url: 'https://api.openai.com/v1/models', apiKeyHeader: 'Authorization' },
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      modelsEndpoint: { url: 'https://api.anthropic.com/v1/models', apiKeyHeader: 'x-api-key' },
    },
    {
      id: 'zai',
      name: 'ZuAI',
      modelsEndpoint: { url: 'https://api.zuai.com/v1/models', apiKeyHeader: 'Authorization' },
    },
  ],
  ZAI_ENDPOINTS: { us: 'https://api.zuai.com/us', eu: 'https://api.zuai.com/eu' },
}));

vi.mock('@main/daemon/daemon-connector', () => ({
  ensureDaemonRunning: vi.fn(() => ({ call: vi.fn().mockResolvedValue('daemon-token') })),
}));

vi.mock('@main/store/secureStorage', () => ({
  getApiKey: vi.fn(),
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  API_KEY_VALIDATION_TIMEOUT_MS: 5000,
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handlers[channel] = handler;
  }),
}));

import { registerModelDiscoveryHandlers } from '@main/ipc/handlers/api-key-handlers/model-discovery-handlers';
import { getApiKey } from '@main/store/secureStorage';

describe('model-discovery-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    registerModelDiscoveryHandlers();
  });

  describe('openrouter:fetch-models', () => {
    it('should fetch OpenRouter models with stored API key', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue('sk-or-123');
      const { fetchOpenRouterModels } = await import('@myboteam/agent-core/desktop-main');
      vi.mocked(fetchOpenRouterModels).mockResolvedValue({ success: true, models: [] });
      await handlers['openrouter:fetch-models']({} as never);
      expect(fetchOpenRouterModels).toHaveBeenCalledWith('sk-or-123', 5000);
    });
  });

  describe('provider:fetch-models', () => {
    it('should return error for unknown provider', async () => {
      const result = await handlers['provider:fetch-models']({} as never, 'unknown');
      expect(result).toEqual({
        success: false,
        error: 'No models endpoint configured for this provider',
      });
    });

    it('should fetch models for a known provider with API key', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue('sk-123');
      const { fetchProviderModels } = await import('@myboteam/agent-core/desktop-main');
      vi.mocked(fetchProviderModels).mockResolvedValue({ success: true, models: [] });
      await handlers['provider:fetch-models']({} as never, 'openai');
      expect(fetchProviderModels).toHaveBeenCalled();
    });

    it('should return error when no API key found', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await handlers['provider:fetch-models']({} as never, 'anthropic');
      expect(result).toEqual({ success: false, error: 'No API key found for this provider' });
    });

    it('should use baseUrl override for openai', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue('sk-123');
      const { fetchProviderModels } = await import('@myboteam/agent-core/desktop-main');
      vi.mocked(fetchProviderModels).mockResolvedValue({ success: true, models: [] });
      await handlers['provider:fetch-models']({} as never, 'openai', {
        baseUrl: 'https://my-proxy.com',
      });
      expect(fetchProviderModels).toHaveBeenCalledWith(
        expect.objectContaining({ urlOverride: 'https://my-proxy.com/models' }),
      );
    });
  });
});
