import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));
const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  testLMStudioConnection: vi.fn(),
  fetchLMStudioModels: vi.fn(),
  sanitizeString: vi.fn((s: string) => s),
  testCustomConnection: vi.fn(),
  validateLMStudioConfig: vi.fn(),
}));

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

import { registerLMStudioHandlers } from '@main/ipc/handlers/provider-config-handlers/lmstudio-handlers';

describe('lmstudio-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerLMStudioHandlers((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler;
    });
  });

  it('lmstudio:test-connection should call testLMStudioConnection', async () => {
    const { testLMStudioConnection } = await import('@myboteam/agent-core/desktop-main');
    vi.mocked(testLMStudioConnection).mockResolvedValue({ success: true });
    const result = await handlers['lmstudio:test-connection']({} as never, 'http://localhost:1234');
    expect(testLMStudioConnection).toHaveBeenCalledWith({ url: 'http://localhost:1234' });
  });

  it('lmstudio:fetch-models should return error when no config', async () => {
    mockDaemonClient.call.mockResolvedValue(null);
    const result = await handlers['lmstudio:fetch-models']({} as never);
    expect(result).toEqual({ success: false, error: 'No LM Studio configured' });
  });

  it('lmstudio:fetch-models should fetch when config exists', async () => {
    mockDaemonClient.call.mockResolvedValue({ baseUrl: 'http://localhost:1234' });
    const { fetchLMStudioModels } = await import('@myboteam/agent-core/desktop-main');
    vi.mocked(fetchLMStudioModels).mockResolvedValue({ success: true, models: [] });
    await handlers['lmstudio:fetch-models']({} as never);
    expect(fetchLMStudioModels).toHaveBeenCalledWith({ baseUrl: 'http://localhost:1234' });
  });

  it('lmstudio:get-config should call daemon', async () => {
    await handlers['lmstudio:get-config']({} as never);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.getLMStudioConfig');
  });

  it('lmstudio:set-config should store valid config', async () => {
    await handlers['lmstudio:set-config']({} as never, {
      baseUrl: 'http://localhost:1234',
      enabled: true,
    });
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setLMStudioConfig', {
      config: { baseUrl: 'http://localhost:1234', enabled: true },
    });
  });

  it('custom:test-connection should test custom connection', async () => {
    const { testCustomConnection } = await import('@myboteam/agent-core/desktop-main');
    vi.mocked(testCustomConnection).mockResolvedValue({ success: true });
    const result = await handlers['custom:test-connection'](
      {} as never,
      'http://localhost:8080',
      'key-123',
    );
    expect(testCustomConnection).toHaveBeenCalledWith('http://localhost:8080', 'key-123');
  });
});
