import type { Task, TaskConfig, TaskMessage, TaskResult, TaskStatus } from '@myboteam/agent-core';
import { STARTUP_STAGES } from '@myboteam/agent-core/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMockTask(
  id: string,
  prompt: string = 'Test task',
  status: TaskStatus = 'pending',
): Task {
  return {
    id,
    prompt,
    status,
    messages: [],
    createdAt: new Date().toISOString(),
  };
}

function createMockMessage(
  id: string,
  type: 'assistant' | 'user' | 'tool' | 'system' = 'assistant',
  content: string = 'Test message',
): TaskMessage {
  return {
    id,
    type,
    content,
    timestamp: new Date().toISOString(),
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const mockMyBoTeam = {
  startTask: vi.fn(),
  cancelTask: vi.fn(),
  interruptTask: vi.fn(),
  resumeSession: vi.fn(),
  respondToPermission: vi.fn(),
  listTasks: vi.fn(),
  getTask: vi.fn(),
  deleteTask: vi.fn(),
  clearTaskHistory: vi.fn(),
  logEvent: vi.fn().mockResolvedValue(undefined),
  getSelectedModel: vi.fn().mockResolvedValue({ provider: 'anthropic', id: 'claude-3-opus' }),
  getOllamaConfig: vi.fn().mockResolvedValue(null),
  isE2EMode: vi.fn().mockResolvedValue(false),
  getProviderSettings: vi.fn().mockResolvedValue({
    activeProviderId: 'anthropic',
    connectedProviders: {
      anthropic: {
        providerId: 'anthropic',
        connectionStatus: 'connected',
        selectedModelId: 'claude-3-5-sonnet-20241022',
        credentials: { type: 'api-key', apiKey: 'test-key' },
      },
    },
    debugMode: false,
  }),

  setActiveProvider: vi.fn().mockResolvedValue(undefined),
  setConnectedProvider: vi.fn().mockResolvedValue(undefined),
  removeConnectedProvider: vi.fn().mockResolvedValue(undefined),
  setProviderDebugMode: vi.fn().mockResolvedValue(undefined),
  validateApiKeyForProvider: vi.fn().mockResolvedValue({ valid: true }),
  validateBedrockCredentials: vi.fn().mockResolvedValue({ valid: true }),
  saveBedrockCredentials: vi.fn().mockResolvedValue(undefined),
  onDaemonReconnected: vi.fn().mockReturnValue(() => {}),
  onDaemonReconnectFailed: vi.fn().mockReturnValue(() => {}),
  getBuildCapabilities: vi.fn().mockResolvedValue({ hasFreeMode: true, hasAnalytics: false }),
  isFullScreen: vi.fn().mockResolvedValue(false),
  onFullScreenChanged: vi.fn().mockReturnValue(() => {}),
  getThemeColor: vi.fn().mockResolvedValue('neutral'),
  onThemeColorChange: vi.fn().mockReturnValue(() => {}),
};

vi.mock('@/lib/myboteam', () => ({
  getMyBoTeam: () => mockMyBoTeam,
  useMyBoTeam: () => mockMyBoTeam,
}));

const mockOnTaskProgress = vi.fn();
const mockOnTaskUpdate = vi.fn();

function getTaskProgressHandler(): (progress: unknown) => void {
  const handler = mockOnTaskProgress.mock.calls.at(-1)?.[0];
  if (typeof handler !== 'function') {
    throw new Error('Expected task progress handler to be registered');
  }
  return handler as (progress: unknown) => void;
}

vi.stubGlobal('window', {
  myboteam: {
    onTaskProgress: mockOnTaskProgress,
    onTaskUpdate: mockOnTaskUpdate,
    onTodoUpdate: vi.fn(),
    onTaskSummary: vi.fn(),
    onDaemonReconnected: vi.fn(),
    onDaemonDisconnected: vi.fn(),
  },
});

describe('taskStore Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(async () => {
    try {
      const { useTaskStore } = await import('@/stores/taskStore');
      useTaskStore.setState({
        _taskStateToken: 0,
        currentTask: null,
        isLoading: false,
        error: null,
        tasks: [],
        favorites: [],
        favoritesLoaded: false,
        permissionRequests: {},
        setupProgress: null,
        setupProgressTaskId: null,
        setupDownloadStep: 1,
        startupStage: null,
        startupStageTaskId: null,
        todos: [],
        todosTaskId: null,
        authError: null,
        isLauncherOpen: false,
        launcherInitialPrompt: null,
      });
    } catch {}
  });

  describe('initial state', () => {
    it('should have null currentTask initially', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');

      const state = useTaskStore.getState();

      expect(state.currentTask).toBeNull();
    });

    it('should have isLoading as false initially', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');

      const state = useTaskStore.getState();

      expect(state.isLoading).toBe(false);
    });

    it('should have null error initially', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');

      const state = useTaskStore.getState();

      expect(state.error).toBeNull();
    });

    it('should have empty tasks array initially', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');

      const state = useTaskStore.getState();

      expect(state.tasks).toEqual([]);
    });

    it('should have empty permissionRequests initially', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');

      const state = useTaskStore.getState();

      expect(state.permissionRequests).toEqual({});
    });

    it('should have setupDownloadStep as 1 initially', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');

      const state = useTaskStore.getState();

      expect(state.setupDownloadStep).toBe(1);
    });
  });

  describe('startTask', () => {
    it('should call startTask API and update state on success', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const mockTask = createMockTask('task-123', 'Test prompt', 'running');
      mockMyBoTeam.startTask.mockResolvedValueOnce(mockTask);

      const config: TaskConfig = { prompt: 'Test prompt' };

      const result = await useTaskStore.getState().startTask(config);
      const state = useTaskStore.getState();

      expect(mockMyBoTeam.startTask).toHaveBeenCalledWith(config);
      expect(result).toEqual(mockTask);
      expect(state.currentTask).toEqual(mockTask);
      expect(state.isLoading).toBe(false);
      expect(state.tasks).toContainEqual(mockTask);
    });

    it('should set isLoading to true for queued tasks', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const mockTask = createMockTask('task-123', 'Test prompt', 'queued');
      mockMyBoTeam.startTask.mockResolvedValueOnce(mockTask);

      await useTaskStore.getState().startTask({ prompt: 'Test prompt' });
      const state = useTaskStore.getState();

      expect(state.isLoading).toBe(true);
    });

    it('should set error state on failure', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      mockMyBoTeam.startTask.mockRejectedValueOnce(new Error('API Error'));

      const result = await useTaskStore.getState().startTask({ prompt: 'Test prompt' });
      const state = useTaskStore.getState();

      expect(result).toBeNull();
      expect(state.error).toBe('API Error');
      expect(state.isLoading).toBe(false);
    });

    it('should handle non-Error exceptions gracefully', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      mockMyBoTeam.startTask.mockRejectedValueOnce('String error');

      const result = await useTaskStore.getState().startTask({ prompt: 'Test' });
      const state = useTaskStore.getState();

      expect(result).toBeNull();
      expect(state.error).toBe('Failed to start task');
    });

    it('should add task to tasks list', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const mockTask = createMockTask('task-123', 'Test', 'running');
      mockMyBoTeam.startTask.mockResolvedValueOnce(mockTask);

      useTaskStore.setState({ tasks: [createMockTask('existing-task')] });

      await useTaskStore.getState().startTask({ prompt: 'Test' });
      const state = useTaskStore.getState();

      expect(state.tasks).toHaveLength(2);
      expect(state.tasks[0].id).toBe('task-123');
    });

    it('should update existing task if same ID', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const existingTask = createMockTask('task-123', 'Old prompt', 'pending');
      const updatedTask = createMockTask('task-123', 'New prompt', 'running');
      mockMyBoTeam.startTask.mockResolvedValueOnce(updatedTask);

      useTaskStore.setState({ tasks: [existingTask] });

      await useTaskStore.getState().startTask({ prompt: 'New prompt', taskId: 'task-123' });
      const state = useTaskStore.getState();

      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].prompt).toBe('New prompt');
    });

    it('should ignore late startTask completion after history is cleared', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const deferred = createDeferred<Task>();
      mockMyBoTeam.startTask.mockReturnValueOnce(deferred.promise);
      mockMyBoTeam.clearTaskHistory.mockResolvedValueOnce(undefined);

      const startTaskPromise = useTaskStore.getState().startTask({ prompt: 'Test prompt' });
      await useTaskStore.getState().clearHistory();
      deferred.resolve(createMockTask('task-123', 'Test prompt', 'running'));
      const result = await startTaskPromise;
      const state = useTaskStore.getState();

      expect(result).toBeNull();
      expect(state.currentTask).toBeNull();
      expect(state.tasks).toEqual([]);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('sendFollowUp', () => {
    it('should show error if no active task', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      useTaskStore.setState({ currentTask: null });

      const store = useTaskStore.getState();
      await store.sendFollowUp('Follow up message');

      expect(useTaskStore.getState().error).toBe('No active task to continue');
      expect(mockMyBoTeam.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn',
          message: 'UI follow-up failed: no active task',
        }),
      );
    });

    it('should show error if no session id', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      useTaskStore.setState({
        currentTask: {
          ...createMockTask('task-123', 'Test', 'completed'),
          sessionId: undefined,
          result: undefined,
        },
      });

      const store = useTaskStore.getState();
      await store.sendFollowUp('Follow up');

      expect(useTaskStore.getState().error).toBe(
        'No session to continue - please start a new task',
      );
      expect(mockMyBoTeam.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn',
          message: 'UI follow-up failed: missing session',
        }),
      );
    });
    it('should start fresh task for interrupted task without session', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const interruptedTask: Task = {
        ...createMockTask('task-123', 'Original', 'interrupted'),
      };
      const newTask = createMockTask('task-456', 'Fresh start', 'running');
      mockMyBoTeam.startTask.mockResolvedValueOnce(newTask);

      useTaskStore.setState({ currentTask: interruptedTask, tasks: [interruptedTask] });

      await useTaskStore.getState().sendFollowUp('New message');

      expect(mockMyBoTeam.startTask).toHaveBeenCalled();
    });

    it('should resume session when task has sessionId', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const taskWithSession: Task = {
        ...createMockTask('task-123', 'Test', 'completed'),
        sessionId: 'session-abc',
      };
      const resumedTask = createMockTask('task-123', 'Test', 'running');
      mockMyBoTeam.resumeSession.mockResolvedValueOnce(resumedTask);

      useTaskStore.setState({ currentTask: taskWithSession, tasks: [taskWithSession] });

      await useTaskStore.getState().sendFollowUp('Continue please');
      const state = useTaskStore.getState();

      expect(mockMyBoTeam.resumeSession).toHaveBeenCalledWith(
        'session-abc',
        'Continue please',
        'task-123',
        undefined,
      );
      expect(state.currentTask?.status).toBe('running');
    });

    it('should use result.sessionId if available', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const taskWithResultSession: Task = {
        ...createMockTask('task-123', 'Test', 'completed'),
        result: { status: 'success', sessionId: 'result-session-xyz' },
      };
      const resumedTask = createMockTask('task-123', 'Test', 'running');
      mockMyBoTeam.resumeSession.mockResolvedValueOnce(resumedTask);

      useTaskStore.setState({ currentTask: taskWithResultSession, tasks: [taskWithResultSession] });

      await useTaskStore.getState().sendFollowUp('More work');

      expect(mockMyBoTeam.resumeSession).toHaveBeenCalledWith(
        'result-session-xyz',
        'More work',
        'task-123',
        undefined,
      );
    });

    it('should add user message optimistically', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const taskWithSession: Task = {
        ...createMockTask('task-123', 'Test', 'completed'),
        sessionId: 'session-abc',
        messages: [],
      };
      mockMyBoTeam.resumeSession.mockResolvedValueOnce(
        createMockTask('task-123', 'Test', 'running'),
      );

      useTaskStore.setState({ currentTask: taskWithSession, tasks: [taskWithSession] });

      await useTaskStore.getState().sendFollowUp('User follow up');
      const state = useTaskStore.getState();

      expect(state.currentTask?.messages).toHaveLength(1);
      expect(state.currentTask?.messages[0].type).toBe('user');
      expect(state.currentTask?.messages[0].content).toBe('User follow up');
    });

    it('should handle resumeSession failure', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const taskWithSession: Task = {
        ...createMockTask('task-123', 'Test', 'completed'),
        sessionId: 'session-abc',
      };
      mockMyBoTeam.resumeSession.mockRejectedValueOnce(new Error('Resume failed'));

      useTaskStore.setState({ currentTask: taskWithSession, tasks: [taskWithSession] });

      await useTaskStore.getState().sendFollowUp('Follow up');
      const state = useTaskStore.getState();

      expect(state.error).toBe('Resume failed');
      expect(state.currentTask?.status).toBe('failed');
      expect(state.isLoading).toBe(false);
    });

    it('should ignore late follow-up completion after history is cleared', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const deferred = createDeferred<Task>();
      const taskWithSession: Task = {
        ...createMockTask('task-123', 'Test', 'completed'),
        sessionId: 'session-abc',
      };
      useTaskStore.setState({ currentTask: taskWithSession, tasks: [taskWithSession] });
      mockMyBoTeam.resumeSession.mockReturnValueOnce(deferred.promise);
      mockMyBoTeam.clearTaskHistory.mockResolvedValueOnce(undefined);

      const followUpPromise = useTaskStore.getState().sendFollowUp('Continue');
      await useTaskStore.getState().clearHistory();
      deferred.resolve(createMockTask('task-123', 'Test', 'running'));
      const result = await followUpPromise;
      const state = useTaskStore.getState();

      expect(result).toBe(false);
      expect(state.currentTask).toBeNull();
      expect(state.tasks).toEqual([]);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('cancelTask', () => {
    it('should call cancelTask API and update status', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const runningTask = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({ currentTask: runningTask, tasks: [runningTask] });
      mockMyBoTeam.cancelTask.mockResolvedValueOnce(undefined);

      await useTaskStore.getState().cancelTask();
      const state = useTaskStore.getState();

      expect(mockMyBoTeam.cancelTask).toHaveBeenCalledWith('task-123');
      expect(state.currentTask?.status).toBe('cancelled');
      expect(state.tasks[0].status).toBe('cancelled');
    });

    it('should do nothing when no current task', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');

      await useTaskStore.getState().cancelTask();

      expect(mockMyBoTeam.cancelTask).not.toHaveBeenCalled();
    });
  });

  describe('interruptTask', () => {
    it('should call interruptTask API for running task', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const runningTask = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({ currentTask: runningTask });
      mockMyBoTeam.interruptTask.mockResolvedValueOnce(undefined);

      await useTaskStore.getState().interruptTask();

      expect(mockMyBoTeam.interruptTask).toHaveBeenCalledWith('task-123');
    });

    it('should not call API for non-running task', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const completedTask = createMockTask('task-123', 'Test', 'completed');
      useTaskStore.setState({ currentTask: completedTask });

      await useTaskStore.getState().interruptTask();

      expect(mockMyBoTeam.interruptTask).not.toHaveBeenCalled();
    });

    it('should not change task status', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const runningTask = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({ currentTask: runningTask });
      mockMyBoTeam.interruptTask.mockResolvedValueOnce(undefined);

      await useTaskStore.getState().interruptTask();
      const state = useTaskStore.getState();

      expect(state.currentTask?.status).toBe('running');
    });
  });

  describe('addTaskUpdateBatch', () => {
    it('should add multiple messages in single update', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({ currentTask: task, tasks: [task] });

      const messages = [
        createMockMessage('msg-1', 'assistant', 'First'),
        createMockMessage('msg-2', 'tool', 'Second'),
        createMockMessage('msg-3', 'assistant', 'Third'),
      ];

      useTaskStore.getState().addTaskUpdateBatch({ taskId: 'task-123', messages });
      const state = useTaskStore.getState();

      expect(state.currentTask?.messages).toHaveLength(3);
      expect(state.currentTask?.messages[0].content).toBe('First');
      expect(state.currentTask?.messages[1].content).toBe('Second');
      expect(state.currentTask?.messages[2].content).toBe('Third');
    });

    it('should not update state if task ID does not match', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({ currentTask: task });

      useTaskStore.getState().addTaskUpdateBatch({
        taskId: 'different-task',
        messages: [createMockMessage('msg-1')],
      });
      const state = useTaskStore.getState();

      expect(state.currentTask?.messages).toHaveLength(0);
    });

    it('should not update state if no current task', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');

      useTaskStore.getState().addTaskUpdateBatch({
        taskId: 'task-123',
        messages: [createMockMessage('msg-1')],
      });
      const state = useTaskStore.getState();

      expect(state.currentTask).toBeNull();
    });

    it('should append to existing messages', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task: Task = {
        ...createMockTask('task-123', 'Test', 'running'),
        messages: [createMockMessage('existing', 'user', 'Existing')],
      };
      useTaskStore.setState({ currentTask: task });

      useTaskStore.getState().addTaskUpdateBatch({
        taskId: 'task-123',
        messages: [createMockMessage('new', 'assistant', 'New')],
      });
      const state = useTaskStore.getState();

      expect(state.currentTask?.messages).toHaveLength(2);
      expect(state.currentTask?.messages[0].content).toBe('Existing');
      expect(state.currentTask?.messages[1].content).toBe('New');
    });

    it('should set isLoading to false after batch update', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({ currentTask: task, isLoading: true });

      useTaskStore.getState().addTaskUpdateBatch({ taskId: 'task-123', messages: [] });
      const state = useTaskStore.getState();

      expect(state.isLoading).toBe(false);
    });
  });

  describe('error state management', () => {
    it('should clear error on successful task start', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      useTaskStore.setState({ error: 'Previous error' });
      mockMyBoTeam.startTask.mockResolvedValueOnce(createMockTask('task-123'));

      await useTaskStore.getState().startTask({ prompt: 'Test' });
      const state = useTaskStore.getState();

      expect(state.error).toBeNull();
    });

    it('should clear error on successful follow up', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const taskWithSession: Task = {
        ...createMockTask('task-123', 'Test', 'completed'),
        sessionId: 'session-abc',
      };
      useTaskStore.setState({
        currentTask: taskWithSession,
        tasks: [taskWithSession],
        error: 'Previous error',
      });
      mockMyBoTeam.resumeSession.mockResolvedValueOnce(
        createMockTask('task-123', 'Test', 'running'),
      );

      await useTaskStore.getState().sendFollowUp('Continue');
      const state = useTaskStore.getState();

      expect(state.error).toBeNull();
    });
  });

  describe('loadTasks', () => {
    it('should load tasks from API', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const mockTasks = [
        createMockTask('task-1'),
        createMockTask('task-2'),
        createMockTask('task-3'),
      ];
      mockMyBoTeam.listTasks.mockResolvedValueOnce(mockTasks);

      await useTaskStore.getState().loadTasks();
      const state = useTaskStore.getState();

      expect(mockMyBoTeam.listTasks).toHaveBeenCalled();
      expect(state.tasks).toEqual(mockTasks);
    });
  });

  describe('loadTaskById', () => {
    it('should load specific task and set as current', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const mockTask = createMockTask('task-123', 'Loaded task');
      mockMyBoTeam.getTask.mockResolvedValueOnce(mockTask);

      await useTaskStore.getState().loadTaskById('task-123');
      const state = useTaskStore.getState();

      expect(mockMyBoTeam.getTask).toHaveBeenCalledWith('task-123');
      expect(state.currentTask).toEqual(mockTask);
      expect(state.error).toBeNull();
    });

    it('should set error when task not found', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      mockMyBoTeam.getTask.mockResolvedValueOnce(null);

      await useTaskStore.getState().loadTaskById('non-existent');
      const state = useTaskStore.getState();

      expect(state.currentTask).toBeNull();
      expect(state.error).toBe('Task not found');
    });

    it('should ignore late loadTaskById completion after the task is deleted', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const deferred = createDeferred<Task | null>();
      const trackedTask = createMockTask('task-123', 'Tracked task');
      useTaskStore.setState({ tasks: [trackedTask] });
      mockMyBoTeam.getTask.mockReturnValueOnce(deferred.promise);
      mockMyBoTeam.deleteTask.mockResolvedValueOnce(undefined);

      const loadTaskPromise = useTaskStore.getState().loadTaskById('task-123');
      await useTaskStore.getState().deleteTask('task-123');
      deferred.resolve(trackedTask);
      await loadTaskPromise;
      const state = useTaskStore.getState();

      expect(state.currentTask).toBeNull();
      expect(state.tasks).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should delete task and remove from list', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const tasks = [createMockTask('task-1'), createMockTask('task-2'), createMockTask('task-3')];
      useTaskStore.setState({ tasks });
      mockMyBoTeam.deleteTask.mockResolvedValueOnce(undefined);

      await useTaskStore.getState().deleteTask('task-2');
      const state = useTaskStore.getState();

      expect(mockMyBoTeam.deleteTask).toHaveBeenCalledWith('task-2');
      expect(state.tasks).toHaveLength(2);
      expect(state.tasks.find((t) => t.id === 'task-2')).toBeUndefined();
    });

    it('should clear task-scoped state when deleting the current task', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const onTaskProgress = getTaskProgressHandler();
      const activeTask = createMockTask('task-2', 'Active task', 'running');
      useTaskStore.setState({
        currentTask: activeTask,
        error: 'Task failed',
        isLoading: true,
        tasks: [createMockTask('task-1'), activeTask, createMockTask('task-3')],
        permissionRequests: {
          'task-1': {
            id: 'perm-1',
            taskId: 'task-1',
            type: 'file',
          } as import('@myboteam/agent-core/common').PermissionRequest,
          'task-2': {
            id: 'perm-2',
            taskId: 'task-2',
            type: 'file',
          } as import('@myboteam/agent-core/common').PermissionRequest,
        },
        setupProgress: 'Downloading dependencies...',
        setupProgressTaskId: 'task-2',
        setupDownloadStep: 2,
        startupStage: {
          stage: 'booting',
          message: 'Starting model',
          isFirstTask: false,
          startTime: 123,
        },
        startupStageTaskId: 'task-2',
        todos: [{ id: 'todo-1', content: 'Finish setup', status: 'in_progress' }],
        todosTaskId: 'task-2',
      });
      mockMyBoTeam.deleteTask.mockResolvedValueOnce(undefined);

      await useTaskStore.getState().deleteTask('task-2');
      onTaskProgress({
        taskId: 'task-2',
        stage: 'setup',
        message: 'Downloading Chromium',
      });
      onTaskProgress({
        taskId: 'task-2',
        stage: STARTUP_STAGES[0],
        message: 'Starting model',
      });

      const state = useTaskStore.getState();
      expect(state.currentTask).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.tasks.map((task) => task.id)).toEqual(['task-1', 'task-3']);
      expect(state.permissionRequests).toEqual({
        'task-1': {
          id: 'perm-1',
          taskId: 'task-1',
          type: 'file',
        },
      });
      expect(state.setupProgress).toBeNull();
      expect(state.setupProgressTaskId).toBeNull();
      expect(state.setupDownloadStep).toBe(1);
      expect(state.startupStage).toBeNull();
      expect(state.startupStageTaskId).toBeNull();
      expect(state.todos).toEqual([]);
      expect(state.todosTaskId).toBeNull();
    });

    it('should preserve other task state when deleting a different task', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const activeTask = createMockTask('task-1', 'Active task', 'running');
      useTaskStore.setState({
        currentTask: activeTask,
        isLoading: true,
        tasks: [activeTask, createMockTask('task-2')],
        permissionRequests: {
          'task-1': {
            id: 'perm-1',
            taskId: 'task-1',
            type: 'file',
          } as import('@myboteam/agent-core/common').PermissionRequest,
        },
        setupProgress: 'Downloading dependencies...',
        setupProgressTaskId: 'task-1',
        setupDownloadStep: 2,
        startupStage: {
          stage: 'booting',
          message: 'Starting model',
          isFirstTask: false,
          startTime: 123,
        },
        startupStageTaskId: 'task-1',
        todos: [{ id: 'todo-1', content: 'Finish setup', status: 'in_progress' }],
        todosTaskId: 'task-1',
      });
      mockMyBoTeam.deleteTask.mockResolvedValueOnce(undefined);

      await useTaskStore.getState().deleteTask('task-2');
      const state = useTaskStore.getState();

      expect(state.currentTask?.id).toBe('task-1');
      expect(state.isLoading).toBe(true);
      expect(state.tasks.map((task) => task.id)).toEqual(['task-1']);
      expect(state.permissionRequests['task-1']).toBeDefined();
      expect(state.setupProgress).toBe('Downloading dependencies...');
      expect(state.setupProgressTaskId).toBe('task-1');
      expect(state.setupDownloadStep).toBe(2);
      expect(state.startupStage).toEqual({
        stage: 'booting',
        message: 'Starting model',
        isFirstTask: false,
        startTime: 123,
      });
      expect(state.startupStageTaskId).toBe('task-1');
      expect(state.todos).toEqual([
        { id: 'todo-1', content: 'Finish setup', status: 'in_progress' },
      ]);
      expect(state.todosTaskId).toBe('task-1');
    });
  });

  describe('clearHistory', () => {
    it('should clear all tasks', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      useTaskStore.setState({ tasks: [createMockTask('task-1'), createMockTask('task-2')] });
      mockMyBoTeam.clearTaskHistory.mockResolvedValueOnce(undefined);

      await useTaskStore.getState().clearHistory();
      const state = useTaskStore.getState();

      expect(mockMyBoTeam.clearTaskHistory).toHaveBeenCalled();
      expect(state.tasks).toEqual([]);
    });

    it('should clear current task and task-scoped state', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const onTaskProgress = getTaskProgressHandler();
      const activeTask = createMockTask('task-1', 'Active task', 'running');
      useTaskStore.setState({
        currentTask: activeTask,
        error: 'Task failed',
        isLoading: true,
        tasks: [activeTask, createMockTask('task-2')],
        permissionRequests: {
          'task-1': {
            id: 'perm-1',
            taskId: 'task-1',
            type: 'file',
          } as import('@myboteam/agent-core/common').PermissionRequest,
        },
        setupProgress: 'Downloading dependencies...',
        setupProgressTaskId: 'task-1',
        setupDownloadStep: 3,
        startupStage: {
          stage: 'booting',
          message: 'Starting model',
          isFirstTask: false,
          startTime: 123,
        },
        startupStageTaskId: 'task-1',
        todos: [{ id: 'todo-1', content: 'Finish setup', status: 'in_progress' }],
        todosTaskId: 'task-1',
      });
      mockMyBoTeam.clearTaskHistory.mockResolvedValueOnce(undefined);

      await useTaskStore.getState().clearHistory();
      onTaskProgress({
        taskId: 'task-1',
        stage: 'setup',
        message: 'Downloading Chromium',
      });
      onTaskProgress({
        taskId: 'task-1',
        stage: STARTUP_STAGES[0],
        message: 'Starting model',
      });

      const state = useTaskStore.getState();
      expect(state.tasks).toEqual([]);
      expect(state.currentTask).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.permissionRequests).toEqual({});
      expect(state.setupProgress).toBeNull();
      expect(state.setupProgressTaskId).toBeNull();
      expect(state.setupDownloadStep).toBe(1);
      expect(state.startupStage).toBeNull();
      expect(state.startupStageTaskId).toBeNull();
      expect(state.todos).toEqual([]);
      expect(state.todosTaskId).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset task-related state but preserve tasks list', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const tasks = [createMockTask('task-1'), createMockTask('task-2')];
      useTaskStore.setState({
        currentTask: createMockTask('task-current'),
        isLoading: true,
        error: 'Some error',
        tasks,
        permissionRequests: {
          'task-1': {
            id: 'perm-1',
            taskId: 'task-1',
            type: 'file',
          } as import('@myboteam/agent-core/common').PermissionRequest,
        },
        setupProgress: 'Downloading...',
        setupProgressTaskId: 'task-1',
        setupDownloadStep: 2,
      });

      useTaskStore.getState().reset();
      const state = useTaskStore.getState();

      expect(state.currentTask).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.permissionRequests).toEqual({});
      expect(state.setupProgress).toBeNull();
      expect(state.setupProgressTaskId).toBeNull();
      expect(state.setupDownloadStep).toBe(1);

      expect(state.tasks).toEqual(tasks);
    });
  });

  describe('respondToPermission', () => {
    it('should call API and clear permission request', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      useTaskStore.setState({
        permissionRequests: {
          'task-1': {
            id: 'perm-1',
            taskId: 'task-1',
            type: 'file',
          } as import('@myboteam/agent-core/common').PermissionRequest,
        },
      });
      mockMyBoTeam.respondToPermission.mockResolvedValueOnce(undefined);

      const response = { requestId: 'perm-1', taskId: 'task-1', decision: 'allow' as const };

      await useTaskStore.getState().respondToPermission(response);
      const state = useTaskStore.getState();

      expect(mockMyBoTeam.respondToPermission).toHaveBeenCalledWith(response);
      expect(state.permissionRequests['task-1']).toBeUndefined();
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status in tasks list and currentTask', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'queued');
      useTaskStore.setState({ currentTask: task, tasks: [task] });

      useTaskStore.getState().updateTaskStatus('task-123', 'running');
      const state = useTaskStore.getState();

      expect(state.currentTask?.status).toBe('running');
      expect(state.tasks[0].status).toBe('running');
    });

    it('should only update tasks list when currentTask does not match', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const currentTask = createMockTask('task-current', 'Current', 'running');
      const otherTask = createMockTask('task-other', 'Other', 'queued');
      useTaskStore.setState({ currentTask, tasks: [currentTask, otherTask] });

      useTaskStore.getState().updateTaskStatus('task-other', 'running');
      const state = useTaskStore.getState();

      expect(state.currentTask?.status).toBe('running');
      expect(state.tasks.find((t) => t.id === 'task-other')?.status).toBe('running');
    });
  });

  describe('addTaskUpdate - complete event', () => {
    it('should set completed status for success result', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({ currentTask: task, tasks: [task] });

      useTaskStore.getState().addTaskUpdate({
        type: 'complete',
        taskId: 'task-123',
        result: { status: 'success' },
      });
      const state = useTaskStore.getState();

      expect(state.currentTask?.status).toBe('completed');
      expect(state.tasks[0].status).toBe('completed');
    });

    it('should set interrupted status for interrupted result', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({ currentTask: task, tasks: [task] });

      useTaskStore.getState().addTaskUpdate({
        type: 'complete',
        taskId: 'task-123',
        result: { status: 'interrupted' },
      });
      const state = useTaskStore.getState();

      expect(state.currentTask?.status).toBe('interrupted');
    });

    it('should set failed status for error result', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({ currentTask: task, tasks: [task] });

      useTaskStore.getState().addTaskUpdate({
        type: 'complete',
        taskId: 'task-123',
        result: { status: 'error', error: 'Something went wrong' },
      });
      const state = useTaskStore.getState();

      expect(state.currentTask?.status).toBe('failed');
    });

    it('should preserve sessionId from result', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({ currentTask: task, tasks: [task] });

      const result: TaskResult = { status: 'success', sessionId: 'session-from-result' };

      useTaskStore.getState().addTaskUpdate({
        type: 'complete',
        taskId: 'task-123',
        result,
      });
      const state = useTaskStore.getState();

      expect(state.currentTask?.sessionId).toBe('session-from-result');
      expect(state.currentTask?.result).toEqual(result);
    });

    it('should NOT clear todos when task is interrupted', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({
        currentTask: task,
        tasks: [task],
        todos: [{ id: 'todo-1', content: 'First task', status: 'in_progress' }],
        todosTaskId: 'task-123',
      });

      useTaskStore.getState().addTaskUpdate({
        type: 'complete',
        taskId: 'task-123',
        result: { status: 'interrupted' },
      });
      const state = useTaskStore.getState();

      expect(state.todos).toHaveLength(1);
      expect(state.todosTaskId).toBe('task-123');
    });

    it('should clear todos when task completes successfully', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({
        currentTask: task,
        tasks: [task],
        todos: [{ id: 'todo-1', content: 'First task', status: 'completed' }],
        todosTaskId: 'task-123',
      });

      useTaskStore.getState().addTaskUpdate({
        type: 'complete',
        taskId: 'task-123',
        result: { status: 'success' },
      });
      const state = useTaskStore.getState();

      expect(state.todos).toHaveLength(0);
      expect(state.todosTaskId).toBeNull();
    });

    it('should NOT clear todos for different task completion', async () => {
      const { useTaskStore } = await import('@/stores/taskStore');
      const task = createMockTask('task-123', 'Test', 'running');
      useTaskStore.setState({
        currentTask: task,
        tasks: [task],
        todos: [{ id: 'todo-1', content: 'First task', status: 'in_progress' }],
        todosTaskId: 'task-123',
      });

      useTaskStore.getState().addTaskUpdate({
        type: 'complete',
        taskId: 'task-different',
        result: { status: 'success' },
      });
      const state = useTaskStore.getState();

      expect(state.todos).toHaveLength(1);
      expect(state.todosTaskId).toBe('task-123');
    });
  });
});
