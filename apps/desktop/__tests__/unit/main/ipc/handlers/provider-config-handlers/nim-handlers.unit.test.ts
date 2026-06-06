import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));
const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  testNimConnection: vi.fn(),
  fetchNimModels: vi.fn(),
}));

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

vi.mock('@main/store/secureStorage', () => ({
  getApiKey: vi.fn(),
}));

import { registerNimHandlers } from '@main/ipc/handlers/provider-config-handlers/nim-handlers';

describe('nim-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerNimHandlers((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler;
    });
  });

  it('nim:test-connection should call testNimConnection', async () => {
    const { testNimConnection } = await import('@myboteam/agent-core/desktop-main');
    vi.mocked(testNimConnection).mockResolvedValue({ success: true });
    const result = await handlers['nim:test-connection'](
      {} as never,
      'http://localhost:8000',
      'key',
    );
    expect(testNimConnection).toHaveBeenCalledWith('http://localhost:8000', 'key');
  });

  it('nim:fetch-models should call daemon', async () => {
    const { getApiKey } = await import('@main/store/secureStorage');
    (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue('nim-key');
    mockDaemonClient.call.mockResolvedValue({ baseUrl: 'http://localhost:8000' });
    const { fetchNimModels } = await import('@myboteam/agent-core/desktop-main');
    vi.mocked(fetchNimModels).mockResolvedValue({ success: true, models: [] });
    await handlers['nim:fetch-models']({} as never);
    expect(fetchNimModels).toHaveBeenCalledWith({
      config: { baseUrl: 'http://localhost:8000' },
      apiKey: 'nim-key',
    });
  });

  it('nim:get-config should call daemon', async () => {
    await handlers['nim:get-config']({} as never);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.getNimConfig');
  });

  it('nim:set-config should call daemon', async () => {
    await handlers['nim:set-config']({} as never, {
      baseUrl: 'http://localhost:8000',
      enabled: true,
    });
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setNimConfig', {
      config: { baseUrl: 'http://localhost:8000', enabled: true },
    });
  });
});
