import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));
const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

vi.mock('@main/opencode', () => ({
  cleanupVertexServiceAccountKey: vi.fn(),
}));

vi.mock('@main/providers', () => ({
  registerVertexHandlers: vi.fn(),
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  isDaemonUnavailableError: vi.fn(() => false),
}));

import { registerProviderSettingsHandlers } from '@main/ipc/handlers/provider-config-handlers/provider-settings-handlers';

describe('provider-settings-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerProviderSettingsHandlers(
      (channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers[channel] = handler;
      },
    );
  });

  it('model:get should get selected model', async () => {
    mockDaemonClient.call.mockResolvedValue({ provider: 'openai', model: 'gpt-4' });
    const result = await handlers['model:get']({} as never);
    expect(result).toEqual({ provider: 'openai', model: 'gpt-4' });
  });

  it('model:set should set selected model', async () => {
    await handlers['model:set']({} as never, { provider: 'openai', model: 'gpt-4' });
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setSelectedModel', {
      model: { provider: 'openai', model: 'gpt-4' },
    });
  });

  it('model:set should throw for invalid model', async () => {
    await expect(handlers['model:set']({} as never, null)).rejects.toThrow(
      'Invalid model configuration',
    );
  });

  it('provider-settings:get should get settings', async () => {
    mockDaemonClient.call.mockResolvedValue({ connectedProviders: {} });
    const result = await handlers['provider-settings:get']();
    expect(result).toEqual({ connectedProviders: {} });
  });

  it('provider-settings:set-active should set active provider', async () => {
    await handlers['provider-settings:set-active']({} as never, 'openai');
    expect(mockDaemonClient.call).toHaveBeenCalledWith('provider.setActive', {
      providerId: 'openai',
    });
  });

  it('provider-settings:get-connected should get connected provider', async () => {
    mockDaemonClient.call.mockResolvedValue({ connectedProviders: { openai: { id: 'openai' } } });
    const result = await handlers['provider-settings:get-connected']({} as never, 'openai');
    expect(result).toEqual({ id: 'openai' });
  });

  it('provider-settings:get-connected should return null for missing provider', async () => {
    mockDaemonClient.call.mockResolvedValue({ connectedProviders: {} });
    const result = await handlers['provider-settings:get-connected']({} as never, 'openai');
    expect(result).toBeNull();
  });

  it('provider-settings:set-connected should set connected provider', async () => {
    await handlers['provider-settings:set-connected']({} as never, 'openai', {
      id: 'openai',
      provider: 'openai',
    });
    expect(mockDaemonClient.call).toHaveBeenCalledWith('provider.setConnected', {
      providerId: 'openai',
      provider: { id: 'openai', provider: 'openai' },
    });
  });

  it('provider-settings:remove-connected should remove provider', async () => {
    await handlers['provider-settings:remove-connected']({} as never, 'openai');
    expect(mockDaemonClient.call).toHaveBeenCalledWith('provider.removeConnected', {
      providerId: 'openai',
    });
  });

  it('provider-settings:remove-connected should cleanup vertex key', async () => {
    const { cleanupVertexServiceAccountKey } = await import('@main/opencode');
    await handlers['provider-settings:remove-connected']({} as never, 'vertex');
    expect(cleanupVertexServiceAccountKey).toHaveBeenCalled();
  });

  it('provider-settings:update-model should update model', async () => {
    await handlers['provider-settings:update-model']({} as never, 'openai', 'gpt-4');
    expect(mockDaemonClient.call).toHaveBeenCalledWith('provider.updateModel', {
      providerId: 'openai',
      modelId: 'gpt-4',
    });
  });

  it('provider-settings:set-debug should set debug mode', async () => {
    await handlers['provider-settings:set-debug']({} as never, true);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('provider.setDebugMode', { enabled: true });
  });

  it('provider-settings:get-debug should get debug mode', async () => {
    mockDaemonClient.call.mockResolvedValue({ enabled: true });
    const result = await handlers['provider-settings:get-debug']();
    expect(result).toEqual({ enabled: true });
  });
});
