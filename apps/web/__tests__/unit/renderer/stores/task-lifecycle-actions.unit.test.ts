import { describe, expect, it, vi } from 'vitest';

vi.mock('undici', () => ({
  ProxyAgent: class ProxyAgent {},
  Agent: class Agent {},
  fetch: vi.fn(),
  setGlobalDispatcher: vi.fn(),
  getGlobalDispatcher: vi.fn(),
}));

const mockCancelTask = vi.fn();
const mockLogEvent = vi.fn();

vi.mock('@/config/myboteam', () => ({
  getMyBoTeam: () => ({
    cancelTask: mockCancelTask,
    logEvent: mockLogEvent,
  }),
}));

import { createTaskLifecycleActions } from '@/stores/task-lifecycle-actions';
import type { TaskState } from '@/stores/taskStore';

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
  const set = (partial: Partial<TaskState> | ((s: TaskState) => Partial<TaskState>)) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next } as TaskState;
  };
  const get = (): TaskState => state;
  const actions = createTaskLifecycleActions(set, get);
  return { actions, getState: () => state };
}

describe('createTaskLifecycleActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cancelTask', () => {
    it('cancels the current task and updates its status', async () => {
      mockCancelTask.mockResolvedValue(undefined);
      const { actions, getState } = setupStore({
        currentTask: { id: 'tsk-1', status: 'running' } as TaskState['currentTask'],
        tasks: [{ id: 'tsk-1', status: 'running' } as TaskState['tasks'][number]],
      });

      await actions.cancelTask();

      expect(mockCancelTask).toHaveBeenCalledWith('tsk-1');
      expect(getState().currentTask?.status).toBe('cancelled');
      expect(getState().tasks[0]?.status).toBe('cancelled');
    });

    it('does nothing if no current task', async () => {
      const { actions } = setupStore();
      await actions.cancelTask();
      expect(mockCancelTask).not.toHaveBeenCalled();
    });

    it('handles cancel error', async () => {
      mockCancelTask.mockRejectedValue(new Error('Network error'));
      const { actions, getState } = setupStore({
        currentTask: { id: 'tsk-1', status: 'running' } as TaskState['currentTask'],
      });

      await actions.cancelTask();

      expect(getState().isLoading).toBe(false);
      expect(getState().error).toBe('Network error');
    });
  });
});
