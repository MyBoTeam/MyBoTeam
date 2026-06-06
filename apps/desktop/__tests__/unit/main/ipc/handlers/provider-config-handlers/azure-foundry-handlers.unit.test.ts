import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));
const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  testAzureFoundryConnection: vi.fn(),
  validateHttpUrl: vi.fn(),
}));

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

vi.mock('@main/store/secureStorage', () => ({
  storeApiKey: vi.fn(),
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  API_KEY_VALIDATION_TIMEOUT_MS: 5000,
}));

import { registerAzureFoundryHandlers } from '@main/ipc/handlers/provider-config-handlers/azure-foundry-handlers';

describe('azure-foundry-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerAzureFoundryHandlers((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler;
    });
  });

  it('azure-foundry:get-config should call daemon', async () => {
    mockDaemonClient.call.mockResolvedValue({ baseUrl: 'https://example.openai.azure.com' });
    const result = await handlers['azure-foundry:get-config']({} as never);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.getAzureFoundryConfig');
    expect(result).toEqual({ baseUrl: 'https://example.openai.azure.com' });
  });

  it('azure-foundry:set-config should store valid config', async () => {
    const config = {
      baseUrl: 'https://example.openai.azure.com',
      deploymentName: 'gpt-4',
      authType: 'api-key' as const,
      enabled: true,
    };
    await handlers['azure-foundry:set-config']({} as never, config);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setAzureFoundryConfig', {
      config,
    });
  });

  it('azure-foundry:set-config should throw for missing baseUrl', async () => {
    await expect(
      handlers['azure-foundry:set-config']({} as never, {
        deploymentName: 'gpt-4',
        authType: 'api-key',
        enabled: true,
      }),
    ).rejects.toThrow('baseUrl is required');
  });

  it('azure-foundry:set-config should throw for missing deploymentName', async () => {
    await expect(
      handlers['azure-foundry:set-config']({} as never, {
        baseUrl: 'https://example.com',
        authType: 'api-key',
        enabled: true,
      }),
    ).rejects.toThrow('deploymentName is required');
  });

  it('azure-foundry:set-config should throw for invalid authType', async () => {
    await expect(
      handlers['azure-foundry:set-config']({} as never, {
        baseUrl: 'https://example.com',
        deploymentName: 'gpt-4',
        authType: 'invalid',
        enabled: true,
      }),
    ).rejects.toThrow('authType must be api-key or entra-id');
  });

  it('azure-foundry:set-config should accept null config', async () => {
    await handlers['azure-foundry:set-config']({} as never, null);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setAzureFoundryConfig', {
      config: null,
    });
  });

  it('azure-foundry:test-connection should call testAzureFoundryConnection', async () => {
    const { testAzureFoundryConnection } = await import('@myboteam/agent-core/desktop-main');
    vi.mocked(testAzureFoundryConnection).mockResolvedValue({ success: true });
    await handlers['azure-foundry:test-connection']({} as never, {
      endpoint: 'https://example.com',
      deploymentName: 'gpt-4',
      authType: 'api-key',
      apiKey: 'sk-123',
    });
    expect(testAzureFoundryConnection).toHaveBeenCalled();
  });

  it('azure-foundry:save-config should save config and api key', async () => {
    const { storeApiKey } = await import('@main/store/secureStorage');
    await handlers['azure-foundry:save-config']({} as never, {
      endpoint: 'https://example.com',
      deploymentName: 'gpt-4',
      authType: 'api-key',
      apiKey: 'sk-123',
    });
    expect(storeApiKey).toHaveBeenCalledWith('azure-foundry', 'sk-123');
    expect(mockDaemonClient.call).toHaveBeenCalledWith(
      'settings.setAzureFoundryConfig',
      expect.any(Object),
    );
  });

  it('azure-foundry:save-config should work without apiKey for entra-id', async () => {
    await handlers['azure-foundry:save-config']({} as never, {
      endpoint: 'https://example.com',
      deploymentName: 'gpt-4',
      authType: 'entra-id',
    });
    const { storeApiKey } = await import('@main/store/secureStorage');
    expect(storeApiKey).not.toHaveBeenCalled();
  });
});
