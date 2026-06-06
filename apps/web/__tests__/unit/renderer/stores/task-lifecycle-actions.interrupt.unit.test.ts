import { describe, expect, it, vi } from 'vitest';

vi.mock('undici', () => ({
  ProxyAgent: class ProxyAgent {},
  Agent: class Agent {},
  fetch: vi.fn(),
  setGlobalDispatcher: vi.fn(),
  getGlobalDispatcher: vi.fn(),
}));

const mockCancelTask = vi.fn();
const mockInterruptTask = vi.fn();
const mockLogEvent = vi.fn();

vi.mock('@/lib/myboteam', () => ({
  getMyBoTeam: () => ({
    cancelTask: mockCancelTask,
    interruptTask: mockInterruptTask,
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

describe('createTaskLifecycleActions - interruptTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing if no current task', async () => {
    const { actions } = setupStore();
    await actions.interruptTask();
    expect(mockInterruptTask).not.toHaveBeenCalled();
  });

  it('does nothing if current task is not running', async () => {
    const { actions } = setupStore({
      currentTask: { id: 'tsk-1', status: 'paused' } as TaskState['currentTask'],
    });
    await actions.interruptTask();
    expect(mockInterruptTask).not.toHaveBeenCalled();
  });

  it('interrupts a running task', async () => {
    mockInterruptTask.mockResolvedValue(undefined);
    const { actions } = setupStore({
      currentTask: { id: 'tsk-1', status: 'running' } as TaskState['currentTask'],
    });

    await actions.interruptTask();

    expect(mockInterruptTask).toHaveBeenCalledWith('tsk-1');
  });

  it('handles interrupt error', async () => {
    mockInterruptTask.mockRejectedValue(new Error('Interrupt failed'));
    const { actions, getState } = setupStore({
      currentTask: { id: 'tsk-1', status: 'running' } as TaskState['currentTask'],
    });

    await actions.interruptTask();

    expect(getState().error).toBe('Interrupt failed');
  });
});
