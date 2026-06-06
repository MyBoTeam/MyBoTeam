import { describe, expect, it, vi } from 'vitest';

vi.mock('undici', () => ({
  ProxyAgent: class ProxyAgent {},
  Agent: class Agent {},
  fetch: vi.fn(),
  setGlobalDispatcher: vi.fn(),
  getGlobalDispatcher: vi.fn(),
}));

const mockListWorkspaces = vi.fn();
const mockGetActiveWorkspaceId = vi.fn();
const mockUpdateWorkspace = vi.fn();
const mockLogEvent = vi.fn();

vi.mock('@/lib/myboteam', () => ({
  getMyBoTeam: () => ({
    listWorkspaces: mockListWorkspaces,
    getActiveWorkspaceId: mockGetActiveWorkspaceId,
    updateWorkspace: mockUpdateWorkspace,
    logEvent: mockLogEvent,
  }),
}));

import { act, renderHook } from '@testing-library/react';
import { useWorkspaceStore } from '@/stores/workspaceStore';

describe('workspaceStore update edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      workspaces: [],
      activeWorkspaceId: null,
      isLoading: false,
      isSwitching: false,
    });
  });

  it('updateWorkspace does not update state when result is undefined', async () => {
    mockUpdateWorkspace.mockResolvedValue(undefined);
    const sample = { id: 'ws-1', name: 'Test', color: '#000' as string | undefined };
    useWorkspaceStore.setState({ workspaces: [sample] });

    const { result } = renderHook(() => useWorkspaceStore());
    let result_: unknown;
    await act(async () => {
      result_ = await result.current.updateWorkspace('ws-1', { name: 'Updated' });
    });

    expect(result_).toBeUndefined();
    expect(result.current.workspaces[0]?.name).toBe('Test');
  });
});
