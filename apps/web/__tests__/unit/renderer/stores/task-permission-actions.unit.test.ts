import { describe, expect, it, vi } from 'vitest';

vi.mock('undici', () => ({
  ProxyAgent: class ProxyAgent {},
  Agent: class Agent {},
  fetch: vi.fn(),
  setGlobalDispatcher: vi.fn(),
  getGlobalDispatcher: vi.fn(),
}));

import type { PermissionRequest, PermissionResponse } from '@myboteam/agent-core/common';
import { createTaskPermissionActions } from '@/stores/task-permission-actions';
import type { TaskState } from '@/stores/taskStore';

const mockRespondToPermission = vi.fn();

vi.mock('@/config/myboteam', () => ({
  getMyBoTeam: () => ({
    logEvent: vi.fn(),
    respondToPermission: mockRespondToPermission,
  }),
}));

function setupStore(initialState: Partial<TaskState> = {}) {
  let state: TaskState = {
    tasks: [],
    currentTask: null,
    isLoading: false,
    todos: [],
    todosTaskId: null,
    permissionRequests: {},
    _taskStateToken: 0,
    ...initialState,
  } as TaskState;
  const set: (partial: Partial<TaskState> | ((s: TaskState) => Partial<TaskState>)) => void = (
    partial,
  ) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next } as TaskState;
  };
  const get = (): TaskState => state;
  const actions = createTaskPermissionActions(set, get);
  return { actions, getState: () => state };
}

describe('createTaskPermissionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('setPermissionRequest stores a permission request', () => {
    const { actions, getState } = setupStore();
    const request: PermissionRequest = {
      taskId: 'tsk-1',
      id: 'req-1',
      permission: 'approve',
      prompt: 'Allow?',
      metadata: {},
    };
    actions.setPermissionRequest(request);
    expect(getState().permissionRequests['tsk-1']).toEqual(request);
  });

  it('setPermissionRequest replaces existing request for same taskId', () => {
    const { actions, getState } = setupStore();
    actions.setPermissionRequest({
      taskId: 'tsk-1',
      id: 'req-1',
      permission: 'approve',
      prompt: 'A',
      metadata: {},
    });
    actions.setPermissionRequest({
      taskId: 'tsk-1',
      id: 'req-2',
      permission: 'approve',
      prompt: 'B',
      metadata: {},
    });
    expect(getState().permissionRequests['tsk-1']!.id).toBe('req-2');
  });

  it('clearPermissionRequest removes a permission request', () => {
    const { actions, getState } = setupStore({
      permissionRequests: {
        'tsk-1': { taskId: 'tsk-1', id: 'req-1' } as PermissionRequest,
        'tsk-2': { taskId: 'tsk-2', id: 'req-2' } as PermissionRequest,
      },
    });
    actions.clearPermissionRequest('tsk-1');
    expect(getState().permissionRequests['tsk-1']).toBeUndefined();
    expect(getState().permissionRequests['tsk-2']).toBeDefined();
  });

  it('clearPermissionRequest does nothing for missing taskId', () => {
    const { actions, getState } = setupStore({
      permissionRequests: { 'tsk-1': { taskId: 'tsk-1', id: 'req-1' } as PermissionRequest },
    });
    actions.clearPermissionRequest('unknown');
    expect(getState().permissionRequests['tsk-1']).toBeDefined();
  });

  describe('respondToPermission', () => {
    const response: PermissionResponse = {
      taskId: 'tsk-1',
      requestId: 'req-1',
      response: 'allow',
      metadata: undefined,
    };

    it('calls respondToPermission and clears matching request', async () => {
      mockRespondToPermission.mockResolvedValue(undefined);
      const { actions, getState } = setupStore({
        permissionRequests: {
          'tsk-1': { taskId: 'tsk-1', id: 'req-1' } as PermissionRequest,
        },
        _taskStateToken: 5,
      });

      await actions.respondToPermission(response);

      expect(mockRespondToPermission).toHaveBeenCalledWith(response);
      expect(getState().permissionRequests['tsk-1']).toBeUndefined();
    });

    it('does not clear request if task state token changed', async () => {
      mockRespondToPermission.mockResolvedValue(undefined);
      const { actions, getState } = setupStore({
        permissionRequests: {
          'tsk-1': { taskId: 'tsk-1', id: 'req-1' } as PermissionRequest,
        },
        _taskStateToken: 5,
      });

      void actions.respondToPermission(response);

      expect(getState().permissionRequests['tsk-1']).toBeDefined();
    });

    it('does not clear request if stored request id differs', async () => {
      mockRespondToPermission.mockResolvedValue(undefined);
      const { actions, getState } = setupStore({
        permissionRequests: {
          'tsk-1': { taskId: 'tsk-1', id: 'req-old' } as PermissionRequest,
        },
        _taskStateToken: 5,
      });

      await actions.respondToPermission(response);

      expect(getState().permissionRequests['tsk-1']).toBeDefined();
    });
  });
});
