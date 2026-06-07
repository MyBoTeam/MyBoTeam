import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalWindow = globalThis.window;

describe('getMyBoTeam - GWS helpers', () => {
  const mockGws = {
    listAccounts: vi.fn().mockResolvedValue([]),
    startAuth: vi.fn().mockResolvedValue({ state: 's1', authUrl: 'http://auth' }),
    completeAuth: vi.fn().mockResolvedValue({ id: 'a1', label: 'Test' }),
    removeAccount: vi.fn().mockResolvedValue(undefined),
    updateLabel: vi.fn().mockResolvedValue(undefined),
    onStatusChanged: vi.fn().mockReturnValue(() => {}),
  };

  const mockApi = {
    getVersion: vi.fn(),
    startTask: vi.fn(),
    gws: mockGws,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      myboteam: mockApi,
    };
  });

  afterEach(() => {
    (globalThis as unknown as { window: typeof window }).window = originalWindow;
  });

  it('gwsListAccounts calls gws.listAccounts', async () => {
    const { getMyBoTeam } = await import('@/config/myboteam');
    const result = await getMyBoTeam().gwsListAccounts();
    expect(mockGws.listAccounts).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('gwsStartAuth calls gws.startAuth', async () => {
    const { getMyBoTeam } = await import('@/config/myboteam');
    const result = await getMyBoTeam().gwsStartAuth('My Label');
    expect(mockGws.startAuth).toHaveBeenCalledWith('My Label');
    expect(result).toEqual({ state: 's1', authUrl: 'http://auth' });
  });

  it('gwsCompleteAuth calls gws.completeAuth', async () => {
    const { getMyBoTeam } = await import('@/config/myboteam');
    const result = await getMyBoTeam().gwsCompleteAuth('s1', 'code123');
    expect(mockGws.completeAuth).toHaveBeenCalledWith('s1', 'code123');
    expect(result).toEqual({ id: 'a1', label: 'Test' });
  });

  it('gwsRemoveAccount calls gws.removeAccount', async () => {
    const { getMyBoTeam } = await import('@/config/myboteam');
    await getMyBoTeam().gwsRemoveAccount('a1');
    expect(mockGws.removeAccount).toHaveBeenCalledWith('a1');
  });

  it('gwsUpdateLabel calls gws.updateLabel', async () => {
    const { getMyBoTeam } = await import('@/config/myboteam');
    await getMyBoTeam().gwsUpdateLabel('a1', 'new label');
    expect(mockGws.updateLabel).toHaveBeenCalledWith('a1', 'new label');
  });

  it('gwsOnStatusChanged calls gws.onStatusChanged', async () => {
    const { getMyBoTeam } = await import('@/config/myboteam');
    const cb = () => {};
    const result = getMyBoTeam().gwsOnStatusChanged(cb);
    expect(mockGws.onStatusChanged).toHaveBeenCalledWith(cb);
    expect(result).toBeDefined();
  });

  it('gwsListAccounts rejects when gws is not available', async () => {
    vi.resetModules();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      myboteam: { getVersion: vi.fn(), gws: undefined },
    };
    const { getMyBoTeam } = await import('@/config/myboteam');
    await expect(getMyBoTeam().gwsListAccounts()).rejects.toThrow('GWS API not available');
  });

  it('gwsOnStatusChanged throws when gws is not available', async () => {
    vi.resetModules();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      myboteam: { getVersion: vi.fn() },
    };
    const { getMyBoTeam } = await import('@/config/myboteam');
    expect(() => getMyBoTeam().gwsOnStatusChanged(() => {})).toThrow('GWS API not available');
  });

  it('gwsStartAuth rejects when gws is not available', async () => {
    vi.resetModules();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      myboteam: { getVersion: vi.fn() },
    };
    const { getMyBoTeam } = await import('@/config/myboteam');
    await expect(getMyBoTeam().gwsStartAuth('test')).rejects.toThrow('GWS API not available');
  });

  it('gwsCompleteAuth rejects when gws is not available', async () => {
    vi.resetModules();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      myboteam: { getVersion: vi.fn() },
    };
    const { getMyBoTeam } = await import('@/config/myboteam');
    await expect(getMyBoTeam().gwsCompleteAuth('s1', 'c1')).rejects.toThrow(
      'GWS API not available',
    );
  });

  it('gwsRemoveAccount rejects when gws is not available', async () => {
    vi.resetModules();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      myboteam: { getVersion: vi.fn() },
    };
    const { getMyBoTeam } = await import('@/config/myboteam');
    await expect(getMyBoTeam().gwsRemoveAccount('a1')).rejects.toThrow('GWS API not available');
  });

  it('gwsUpdateLabel rejects when gws is not available', async () => {
    vi.resetModules();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      myboteam: { getVersion: vi.fn() },
    };
    const { getMyBoTeam } = await import('@/config/myboteam');
    await expect(getMyBoTeam().gwsUpdateLabel('a1', 'new')).rejects.toThrow(
      'GWS API not available',
    );
  });
});
