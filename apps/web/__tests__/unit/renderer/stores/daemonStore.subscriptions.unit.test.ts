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

describe('daemonStore subscriptions', () => {
  let onDaemonDisconnectedCb: () => void = () => {};
  let onDaemonReconnectedCb: () => void = () => {};

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    onDaemonDisconnectedCb = () => {};
    onDaemonReconnectedCb = () => {};

    window.myboteam = {
      ...window.myboteam,
      onDaemonDisconnected: vi.fn((cb: () => void) => {
        onDaemonDisconnectedCb = cb;
        return () => {};
      }),
      onDaemonReconnected: vi.fn((cb: () => void) => {
        onDaemonReconnectedCb = cb;
        return () => {};
      }),
      onDaemonReconnectFailed: vi.fn(() => () => {}),
      daemonPing: vi.fn().mockResolvedValue({ status: 'ok' }),
    } as typeof window.myboteam;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('registers subscriptions on import', async () => {
    await import('@/stores/daemonStore');
    expect(window.myboteam?.onDaemonDisconnected).toHaveBeenCalled();
    expect(window.myboteam?.onDaemonReconnected).toHaveBeenCalled();
  });

  it('registers reconnect failed subscription when available', async () => {
    await import('@/stores/daemonStore');
    expect(window.myboteam?.onDaemonReconnectFailed).toHaveBeenCalled();
  });

  it('handles daemonPing non-ok status', async () => {
    (window.myboteam as { daemonPing: ReturnType<typeof vi.fn> }).daemonPing.mockResolvedValue({
      status: 'error',
    });
    const { useDaemonStore } = await import('@/stores/daemonStore');
    await vi.waitFor(() => {
      expect(useDaemonStore.getState().status).toBe('stopped');
    });
  });

  it('handles daemonPing rejection', async () => {
    (window.myboteam as { daemonPing: ReturnType<typeof vi.fn> }).daemonPing.mockRejectedValue(
      new Error('no daemon'),
    );
    const { useDaemonStore } = await import('@/stores/daemonStore');
    await vi.waitFor(() => {
      expect(useDaemonStore.getState().status).toBe('stopped');
    });
  });

  it('triggers onDaemonDisconnected callback', async () => {
    const { useDaemonStore } = await import('@/stores/daemonStore');
    useDaemonStore.setState({ status: 'connected', toastDismissed: true });
    onDaemonDisconnectedCb();
    expect(useDaemonStore.getState().status).toBe('disconnected');
    expect(useDaemonStore.getState().toastDismissed).toBe(false);
  });

  it('triggers onDaemonReconnected callback', async () => {
    const { useDaemonStore } = await import('@/stores/daemonStore');
    useDaemonStore.setState({ status: 'reconnect-failed' });
    onDaemonReconnectedCb();
    expect(useDaemonStore.getState().status).toBe('connected');
  });

  it('triggers onDaemonReconnectFailed callback', async () => {
    let reconnectFailedCb: () => void = () => {};
    (
      window.myboteam as { onDaemonReconnectFailed: ReturnType<typeof vi.fn> }
    ).onDaemonReconnectFailed.mockImplementation((cb: () => void) => {
      reconnectFailedCb = cb;
      return () => {};
    });

    vi.resetModules();
    const { useDaemonStore } = await import('@/stores/daemonStore');
    useDaemonStore.setState({ status: 'connected', toastDismissed: true });
    reconnectFailedCb();
    expect(useDaemonStore.getState().status).toBe('reconnect-failed');
    expect(useDaemonStore.getState().toastDismissed).toBe(false);
  });

  it('handles missing window.myboteam gracefully on module load', async () => {
    vi.resetModules();

    const win = window as unknown as { myboteam?: unknown };
    delete win.myboteam;
    await import('@/stores/daemonStore');

    expect(true).toBe(true);

    win.myboteam = {} as typeof win.myboteam;
  });
});
