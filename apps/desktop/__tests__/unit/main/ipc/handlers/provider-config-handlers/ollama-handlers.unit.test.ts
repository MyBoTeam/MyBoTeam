import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));
const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  testOllamaConnection: vi.fn(),
  validateHttpUrl: vi.fn(),
}));

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

import { registerOllamaHandlers } from '@main/ipc/handlers/provider-config-handlers/ollama-handlers';

describe('ollama-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerOllamaHandlers((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler;
    });
  });

  it('ollama:test-connection should call testOllamaConnection', async () => {
    const { testOllamaConnection } = await import('@myboteam/agent-core/desktop-main');
    vi.mocked(testOllamaConnection).mockResolvedValue({ success: true });
    const result = await handlers['ollama:test-connection']({} as never, 'http://localhost:11434');
    expect(testOllamaConnection).toHaveBeenCalledWith('http://localhost:11434');
    expect(result).toEqual({ success: true });
  });

  it('ollama:get-config should call daemon', async () => {
    mockDaemonClient.call.mockResolvedValue({ baseUrl: 'http://localhost:11434' });
    const result = await handlers['ollama:get-config']({} as never);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.getOllamaConfig');
    expect(result).toEqual({ baseUrl: 'http://localhost:11434' });
  });

  it('ollama:set-config should store valid config', async () => {
    const config = { baseUrl: 'http://localhost:11434', enabled: true };
    await handlers['ollama:set-config']({} as never, config);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setOllamaConfig', { config });
  });

  it('ollama:set-config should accept null config', async () => {
    await handlers['ollama:set-config']({} as never, null);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setOllamaConfig', {
      config: null,
    });
  });

  it('ollama:set-config should throw for missing baseUrl', async () => {
    await expect(handlers['ollama:set-config']({} as never, { enabled: true })).rejects.toThrow(
      'Invalid Ollama configuration',
    );
  });

  it('ollama:set-config should validate models array', async () => {
    const invalid = { baseUrl: 'http://localhost:11434', enabled: true, models: 'not-array' };
    await expect(handlers['ollama:set-config']({} as never, invalid)).rejects.toThrow(
      'Invalid Ollama configuration: models must be an array',
    );
  });
});
