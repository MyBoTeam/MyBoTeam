import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('undici', () => ({
  ProxyAgent: class ProxyAgent {},
  Agent: class Agent {},
  fetch: vi.fn(),
  setGlobalDispatcher: vi.fn(),
  getGlobalDispatcher: vi.fn(),
}));

vi.mock('@/config/myboteam', () => ({
  getMyBoTeam: () => ({}),
}));

describe('daemonStore without reconnectFailed', () => {
  beforeEach(() => {
    vi.resetModules();
    window.myboteam = {
      onDaemonDisconnected: vi.fn(() => () => {}),
      onDaemonReconnected: vi.fn(() => () => {}),

      daemonPing: vi.fn().mockResolvedValue({ status: 'ok' }),
    } as typeof window.myboteam;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('loads without onDaemonReconnectFailed', async () => {
    await import('@/stores/daemonStore');
    expect(window.myboteam?.onDaemonDisconnected).toHaveBeenCalled();
    expect(window.myboteam?.onDaemonReconnected).toHaveBeenCalled();
  });
});
