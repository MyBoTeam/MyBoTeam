import { describe, expect, it } from 'vitest';
import {
  clearAllTaskScopedState,
  clearScopedTaskState,
  hasTaskStateToken,
  hasTrackedTask,
} from '@/stores/task-state-helpers';
import type { TaskState } from '@/stores/taskStore';

function makeState(overrides: Partial<TaskState> = {}): TaskState {
  return {
    tasks: [],
    currentTask: null,
    isLoading: false,
    error: null,
    todos: [],
    todosTaskId: null,
    setupProgress: null,
    setupProgressTaskId: null,
    setupDownloadStep: 1,
    startupStage: null,
    startupStageTaskId: null,
    permissionRequests: {},
    _taskStateToken: 0,
    ...overrides,
  } as TaskState;
}

describe('hasTrackedTask', () => {
  it('returns false for null/undefined taskId', () => {
    expect(hasTrackedTask(makeState(), null)).toBe(false);
    expect(hasTrackedTask(makeState(), undefined)).toBe(false);
  });

  it('returns true when taskId matches currentTask', () => {
    const state = makeState({ currentTask: { id: 'task-1' } as TaskState['currentTask'] });
    expect(hasTrackedTask(state, 'task-1')).toBe(true);
  });

  it('returns true when taskId is in tasks array', () => {
    const state = makeState({
      tasks: [{ id: 'task-2' } as TaskState['tasks'][number]],
    });
    expect(hasTrackedTask(state, 'task-2')).toBe(true);
  });

  it('returns false when taskId is not tracked', () => {
    expect(hasTrackedTask(makeState(), 'unknown')).toBe(false);
  });
});

describe('hasTaskStateToken', () => {
  it('returns true when tokens match', () => {
    expect(hasTaskStateToken({ _taskStateToken: 5 }, 5)).toBe(true);
  });

  it('returns false when tokens differ', () => {
    expect(hasTaskStateToken({ _taskStateToken: 5 }, 3)).toBe(false);
  });
});

describe('clearScopedTaskState', () => {
  it('clears currentTask when taskId matches', () => {
    const state = makeState({ currentTask: { id: 'tsk-1' } as TaskState['currentTask'] });
    const result = clearScopedTaskState(state, 'tsk-1');
    expect(result.currentTask).toBeNull();
    expect(result.isLoading).toBe(false);
    expect(result.error).toBeNull();
    expect(result._taskStateToken).toBe(1);
  });

  it('clears permissionRequests for matching taskId', () => {
    const state = makeState({
      permissionRequests: {
        'tsk-1': { taskId: 'tsk-1', id: 'req-1' } as TaskState['permissionRequests'][''],
        'tsk-2': { taskId: 'tsk-2', id: 'req-2' } as TaskState['permissionRequests'][''],
      },
    });
    const result = clearScopedTaskState(state, 'tsk-1');
    expect(result.permissionRequests).toEqual({
      'tsk-2': { taskId: 'tsk-2', id: 'req-2' },
    });
  });

  it('clears setupProgress when setupProgressTaskId matches', () => {
    const state = makeState({ setupProgressTaskId: 'tsk-1', setupDownloadStep: 3 });
    const result = clearScopedTaskState(state, 'tsk-1');
    expect(result.setupProgress).toBeNull();
    expect(result.setupProgressTaskId).toBeNull();
    expect(result.setupDownloadStep).toBe(1);
    expect(result._taskStateToken).toBe(1);
  });

  it('clears startupStage when startupStageTaskId matches', () => {
    const state = makeState({ startupStageTaskId: 'tsk-1' });
    const result = clearScopedTaskState(state, 'tsk-1');
    expect(result.startupStage).toBeNull();
    expect(result.startupStageTaskId).toBeNull();
    expect(result._taskStateToken).toBe(1);
  });

  it('clears todos when todosTaskId matches', () => {
    const state = makeState({
      todosTaskId: 'tsk-1',
      todos: [{ id: '1' } as TaskState['todos'][number]],
    });
    const result = clearScopedTaskState(state, 'tsk-1');
    expect(result.todos).toEqual([]);
    expect(result.todosTaskId).toBeNull();
    expect(result._taskStateToken).toBe(1);
  });

  it('does not bump token when no state matches taskId', () => {
    const state = makeState({ currentTask: { id: 'other' } as TaskState['currentTask'] });
    const result = clearScopedTaskState(state, 'unknown');
    expect(result._taskStateToken).toBeUndefined();
  });

  it('bumps token exactly once even when multiple fields match', () => {
    const state = makeState({
      currentTask: { id: 'tsk-1' } as TaskState['currentTask'],
      setupProgressTaskId: 'tsk-1',
      startupStageTaskId: 'tsk-1',
      todosTaskId: 'tsk-1',
    });
    const result = clearScopedTaskState(state, 'tsk-1');
    expect(result._taskStateToken).toBe(1);
    expect(result.currentTask).toBeNull();
    expect(result.setupProgressTaskId).toBeNull();
    expect(result.startupStageTaskId).toBeNull();
    expect(result.todosTaskId).toBeNull();
  });
});

describe('clearAllTaskScopedState', () => {
  it('resets all task-scoped state and bumps token', () => {
    const result = clearAllTaskScopedState({ _taskStateToken: 3 });
    expect(result).toEqual({
      _taskStateToken: 4,
      currentTask: null,
      isLoading: false,
      error: null,
      permissionRequests: {},
      setupProgress: null,
      setupProgressTaskId: null,
      setupDownloadStep: 1,
      startupStage: null,
      startupStageTaskId: null,
      todos: [],
      todosTaskId: null,
    });
  });
});
