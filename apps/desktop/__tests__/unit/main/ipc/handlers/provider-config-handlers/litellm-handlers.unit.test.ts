import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));
const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  testLiteLLMConnection: vi.fn(),
  fetchLiteLLMModels: vi.fn(),
  validateHttpUrl: vi.fn(),
}));

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

vi.mock('@main/store/secureStorage', () => ({
  getApiKey: vi.fn(),
}));

import { registerLiteLLMHandlers } from '@main/ipc/handlers/provider-config-handlers/litellm-handlers';
import { getApiKey } from '@main/store/secureStorage';

describe('litellm-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerLiteLLMHandlers((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler;
    });
  });

  it('litellm:test-connection should call testLiteLLMConnection', async () => {
    const { testLiteLLMConnection } = await import('@myboteam/agent-core/desktop-main');
    vi.mocked(testLiteLLMConnection).mockResolvedValue({ success: true });
    const result = await handlers['litellm:test-connection'](
      {} as never,
      'http://localhost:4000',
      'sk-123',
    );
    expect(testLiteLLMConnection).toHaveBeenCalledWith('http://localhost:4000', 'sk-123');
  });

  it('litellm:fetch-models should call daemon and fetch', async () => {
    (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue('sk-456');
    mockDaemonClient.call.mockResolvedValue({ baseUrl: 'http://localhost:4000' });
    const { fetchLiteLLMModels } = await import('@myboteam/agent-core/desktop-main');
    vi.mocked(fetchLiteLLMModels).mockResolvedValue({ success: true, models: [] });
    await handlers['litellm:fetch-models']({} as never);
    expect(fetchLiteLLMModels).toHaveBeenCalledWith({
      config: { baseUrl: 'http://localhost:4000' },
      apiKey: 'sk-456',
    });
  });

  it('litellm:get-config should call daemon', async () => {
    await handlers['litellm:get-config']({} as never);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.getLiteLLMConfig');
  });

  it('litellm:set-config should store valid config', async () => {
    const config = { baseUrl: 'http://localhost:4000', enabled: true };
    await handlers['litellm:set-config']({} as never, config);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setLiteLLMConfig', { config });
  });

  it('litellm:set-config should throw for missing baseUrl', async () => {
    await expect(handlers['litellm:set-config']({} as never, { enabled: true })).rejects.toThrow(
      'Invalid LiteLLM configuration',
    );
  });
});
