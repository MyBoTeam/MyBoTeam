import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('undici', () => ({
  ProxyAgent: class ProxyAgent {},
  Agent: class Agent {},
  fetch: vi.fn(),
  setGlobalDispatcher: vi.fn(),
  getGlobalDispatcher: vi.fn(),
}));

const mockLogEvent = vi.fn();

vi.mock('@/lib/myboteam', () => ({
  getMyBoTeam: () => ({
    listWorkspaces: vi.fn(),
    getActiveWorkspaceId: vi.fn(),
    switchWorkspace: vi.fn(),
    createWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    logEvent: mockLogEvent,
  }),
}));

describe('workspaceStore subscriptions', () => {
  let onWorkspaceChangedCb: ((data: { workspaceId: string }) => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    onWorkspaceChangedCb = undefined;

    window.myboteam = {
      ...window.myboteam,
      onWorkspaceChanged: vi.fn((cb: (data: { workspaceId: string }) => void) => {
        onWorkspaceChangedCb = cb;
        return () => {};
      }),
    } as typeof window.myboteam;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('registers onWorkspaceChanged subscription on import', async () => {
    await import('@/stores/workspaceStore');
    expect(window.myboteam?.onWorkspaceChanged).toHaveBeenCalled();
  });

  it('updates active workspace id when workspace changed event fires', async () => {
    const { useWorkspaceStore } = await import('@/stores/workspaceStore');
    useWorkspaceStore.setState({ activeWorkspaceId: 'old-id' });

    expect(onWorkspaceChangedCb).toBeDefined();
    if (onWorkspaceChangedCb) {
      onWorkspaceChangedCb({ workspaceId: 'new-id' });
    }

    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('new-id');
  });
});
