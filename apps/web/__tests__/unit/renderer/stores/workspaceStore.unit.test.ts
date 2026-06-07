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
const mockSwitchWorkspace = vi.fn();
const mockCreateWorkspace = vi.fn();
const mockUpdateWorkspace = vi.fn();
const mockDeleteWorkspace = vi.fn();
const mockLogEvent = vi.fn();

vi.mock('@/config/myboteam', () => ({
  getMyBoTeam: () => ({
    listWorkspaces: mockListWorkspaces,
    getActiveWorkspaceId: mockGetActiveWorkspaceId,
    switchWorkspace: mockSwitchWorkspace,
    createWorkspace: mockCreateWorkspace,
    updateWorkspace: mockUpdateWorkspace,
    deleteWorkspace: mockDeleteWorkspace,
    logEvent: mockLogEvent,
  }),
}));

import { act, renderHook } from '@testing-library/react';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const sampleWorkspace = { id: 'ws-1', name: 'Test', color: '#000' as string | undefined };

describe('workspaceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      workspaces: [],
      activeWorkspaceId: null,
      isLoading: false,
      isSwitching: false,
    });
  });

  it('starts with empty workspaces', () => {
    const { result } = renderHook(() => useWorkspaceStore());
    expect(result.current.workspaces).toEqual([]);
    expect(result.current.activeWorkspaceId).toBeNull();
  });

  it('loadWorkspaces fetches workspaces and active id', async () => {
    mockListWorkspaces.mockResolvedValue([sampleWorkspace]);
    mockGetActiveWorkspaceId.mockResolvedValue('ws-1');

    const { result } = renderHook(() => useWorkspaceStore());
    await act(async () => {
      await result.current.loadWorkspaces();
    });

    expect(result.current.workspaces).toEqual([sampleWorkspace]);
    expect(result.current.activeWorkspaceId).toBe('ws-1');
    expect(result.current.isLoading).toBe(false);
  });

  it('loadWorkspaces handles errors gracefully', async () => {
    mockListWorkspaces.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useWorkspaceStore());
    await act(async () => {
      await result.current.loadWorkspaces();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.workspaces).toEqual([]);
  });

  it('setActiveWorkspaceId updates the active id', () => {
    const { result } = renderHook(() => useWorkspaceStore());
    act(() => {
      result.current.setActiveWorkspaceId('ws-2');
    });
    expect(result.current.activeWorkspaceId).toBe('ws-2');
  });

  it('switchWorkspace updates active workspace id', async () => {
    mockSwitchWorkspace.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useWorkspaceStore());
    act(() => {
      useWorkspaceStore.setState({ activeWorkspaceId: 'ws-1' });
    });

    await act(async () => {
      await result.current.switchWorkspace('ws-2');
    });

    expect(result.current.activeWorkspaceId).toBe('ws-2');
    expect(result.current.isSwitching).toBe(false);
  });

  it('switchWorkspace does nothing when switching to same id', async () => {
    const { result } = renderHook(() => useWorkspaceStore());
    act(() => {
      useWorkspaceStore.setState({ activeWorkspaceId: 'ws-1' });
    });

    await act(async () => {
      await result.current.switchWorkspace('ws-1');
    });

    expect(mockSwitchWorkspace).not.toHaveBeenCalled();
  });

  it('switchWorkspace handles rejected switch', async () => {
    mockSwitchWorkspace.mockResolvedValue({ success: false, reason: 'not allowed' });

    const { result } = renderHook(() => useWorkspaceStore());
    act(() => {
      useWorkspaceStore.setState({ activeWorkspaceId: 'ws-1' });
    });

    await act(async () => {
      await result.current.switchWorkspace('ws-2');
    });

    expect(result.current.isSwitching).toBe(false);
    expect(result.current.activeWorkspaceId).toBe('ws-1');
  });

  it('switchWorkspace handles error', async () => {
    mockSwitchWorkspace.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useWorkspaceStore());
    act(() => {
      useWorkspaceStore.setState({ activeWorkspaceId: 'ws-1' });
    });

    await act(async () => {
      await result.current.switchWorkspace('ws-2');
    });

    expect(result.current.isSwitching).toBe(false);
  });

  it('createWorkspace adds a workspace', async () => {
    mockCreateWorkspace.mockResolvedValue(sampleWorkspace);

    const { result } = renderHook(() => useWorkspaceStore());
    let created;
    await act(async () => {
      created = await result.current.createWorkspace({ name: 'Test' });
    });

    expect(created).toEqual(sampleWorkspace);
    expect(result.current.workspaces).toContainEqual(sampleWorkspace);
  });

  it('createWorkspace handles error', async () => {
    mockCreateWorkspace.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useWorkspaceStore());
    let created;
    await act(async () => {
      created = await result.current.createWorkspace({ name: 'Test' });
    });

    expect(created).toBeNull();
  });

  it('updateWorkspace updates a workspace', async () => {
    const updated = { ...sampleWorkspace, name: 'Updated' };
    mockUpdateWorkspace.mockResolvedValue(updated);

    const { result } = renderHook(() => useWorkspaceStore());
    act(() => {
      useWorkspaceStore.setState({ workspaces: [sampleWorkspace] });
    });

    let result_;
    await act(async () => {
      result_ = await result.current.updateWorkspace('ws-1', { name: 'Updated' });
    });

    expect(result_).toEqual(updated);
    expect(result.current.workspaces[0]?.name).toBe('Updated');
  });

  it('updateWorkspace handles error', async () => {
    mockUpdateWorkspace.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useWorkspaceStore());
    let result_;
    await act(async () => {
      result_ = await result.current.updateWorkspace('ws-1', { name: 'x' });
    });

    expect(result_).toBeNull();
  });

  it('deleteWorkspace removes a workspace', async () => {
    mockDeleteWorkspace.mockResolvedValue(true);

    const { result } = renderHook(() => useWorkspaceStore());
    act(() => {
      useWorkspaceStore.setState({ workspaces: [sampleWorkspace] });
    });

    let deleted;
    await act(async () => {
      deleted = await result.current.deleteWorkspace('ws-1');
    });

    expect(deleted).toBe(true);
    expect(result.current.workspaces).toEqual([]);
  });

  it('deleteWorkspace handles error', async () => {
    mockDeleteWorkspace.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useWorkspaceStore());
    let deleted;
    await act(async () => {
      deleted = await result.current.deleteWorkspace('ws-1');
    });

    expect(deleted).toBe(false);
  });

  it('deleteWorkspace returns false when not deleted', async () => {
    mockDeleteWorkspace.mockResolvedValue(false);

    const { result } = renderHook(() => useWorkspaceStore());
    act(() => {
      useWorkspaceStore.setState({ workspaces: [sampleWorkspace] });
    });

    let deleted;
    await act(async () => {
      deleted = await result.current.deleteWorkspace('ws-1');
    });

    expect(deleted).toBe(false);
    expect(result.current.workspaces).toHaveLength(1);
  });
});
