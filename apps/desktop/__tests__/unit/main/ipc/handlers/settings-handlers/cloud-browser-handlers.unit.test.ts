import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));
const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

import { registerCloudBrowserHandlers } from '@main/ipc/handlers/settings-handlers/cloud-browser-handlers';

describe('cloud-browser-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerCloudBrowserHandlers((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler;
    });
  });

  it('settings:cloud-browser-config:get should call daemon', async () => {
    mockDaemonClient.call.mockResolvedValue({ activeProvider: null });
    const result = await handlers['settings:cloud-browser-config:get']({} as never);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.getCloudBrowserConfig');
    expect(result).toEqual({ activeProvider: null });
  });

  it('settings:cloud-browser-config:set should accept null', async () => {
    await handlers['settings:cloud-browser-config:set']({} as never, null);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setCloudBrowserConfig', {
      config: null,
    });
  });

  it('settings:cloud-browser-config:set should store valid config', async () => {
    await handlers['settings:cloud-browser-config:set'](
      {} as never,
      JSON.stringify({ activeProvider: null }),
    );
    expect(mockDaemonClient.call).toHaveBeenCalled();
  });

  it('settings:cloud-browser-config:set should throw for non-string config', async () => {
    await expect(
      handlers['settings:cloud-browser-config:set']({} as never, 123 as unknown as string),
    ).rejects.toThrow('Invalid cloud browser config');
  });

  it('settings:cloud-browser-config:set should throw for malformed JSON', async () => {
    await expect(
      handlers['settings:cloud-browser-config:set']({} as never, 'not-json'),
    ).rejects.toThrow('malformed JSON');
  });

  it('settings:cloud-browser-config:set should throw for non-object parsed value', async () => {
    await expect(
      handlers['settings:cloud-browser-config:set']({} as never, '"string"'),
    ).rejects.toThrow('expected object');
  });

  it('settings:cloud-browser-config:set should throw for invalid activeProvider', async () => {
    await expect(
      handlers['settings:cloud-browser-config:set'](
        {} as never,
        JSON.stringify({ activeProvider: 'invalid' }),
      ),
    ).rejects.toThrow('activeProvider must be a valid provider');
  });

  it('settings:cloud-browser-config:set should throw when activeProvider has no providers entry', async () => {
    await expect(
      handlers['settings:cloud-browser-config:set'](
        {} as never,
        JSON.stringify({ activeProvider: 'browserbase', providers: {} }),
      ),
    ).rejects.toThrow('no corresponding entry in providers');
  });

  it('settings:cloud-browser-config:set should accept full valid config', async () => {
    const config = {
      activeProvider: 'browserbase',
      providers: { browserbase: { apiKey: 'sk-123' } },
    };
    await handlers['settings:cloud-browser-config:set']({} as never, JSON.stringify(config));
    expect(mockDaemonClient.call).toHaveBeenCalled();
  });

  it('settings:cloud-browser-config:set should validate providers must be object', async () => {
    await expect(
      handlers['settings:cloud-browser-config:set'](
        {} as never,
        JSON.stringify({ activeProvider: null, providers: [] }),
      ),
    ).rejects.toThrow('providers must be a plain object');
  });
});
