import { EventEmitter } from 'node:events';
import type {
  BrowserFramePayload,
  PermissionRequest,
  StorageAPI,
  TaskManagerAPI,
  TaskMessage,
  TaskResult,
  TaskSource,
  TaskStatus,
  TodoItem,
} from '@myboteam/agent-core';
import { describe, expect, it, vi } from 'vitest';
import { createTaskCallbacks } from '../../src/task-callbacks.js';

function buildFixture(options: { source: TaskSource; hasConnectedClients: boolean }) {
  const emitter = new EventEmitter();

  const rpcForwardListener = vi.fn();
  emitter.on('permission', rpcForwardListener);

  const sendPermissionResponse = vi.fn(async () => {});

  const storage = {
    addTaskMessage: vi.fn(),
    updateTaskStatus: vi.fn(),
    updateTaskSummary: vi.fn(),
    updateTaskSessionId: vi.fn(),
    clearTodosForTask: vi.fn(),
    saveTodosForTask: vi.fn(),
    getTasks: vi.fn(() => []),
    getTask: vi.fn(() => null),
  } as unknown as StorageAPI;

  const taskManager = {
    getSessionId: vi.fn(() => null),
  } as unknown as TaskManagerAPI;

  const callbacks = createTaskCallbacks('tsk_abc', emitter, storage, taskManager, {
    rpc: { hasConnectedClients: () => options.hasConnectedClients },
    getTaskSource: () => options.source,
    sendPermissionResponse,
  });

  return { callbacks, emitter, rpcForwardListener, sendPermissionResponse, storage, taskManager };
}

const fakeRequest: PermissionRequest = {
  id: 'filereq_xyz',
  taskId: 'tsk_abc',
  type: 'file',
  fileOperation: 'create',
  filePath: '/tmp/any.txt',
  timestamp: new Date().toISOString(),
};

describe('createTaskCallbacks — onPermissionRequest dispatch', () => {
  it("source='ui', UI connected → emits 'permission' (does NOT auto-deny)", () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });

    const bridgeListener = vi.fn();
    f.emitter.on('permission', bridgeListener);

    f.callbacks.onPermissionRequest?.(fakeRequest);

    expect(f.rpcForwardListener).toHaveBeenCalledWith(fakeRequest);
    expect(bridgeListener).toHaveBeenCalledWith(fakeRequest);
    expect(f.sendPermissionResponse).not.toHaveBeenCalled();
  });

  it("source='ui', no UI connected → auto-denies (does NOT emit bridge-side)", () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: false });

    f.callbacks.onPermissionRequest?.(fakeRequest);

    expect(f.sendPermissionResponse).toHaveBeenCalledWith('tsk_abc', {
      taskId: 'tsk_abc',
      requestId: 'filereq_xyz',
      decision: 'deny',
    });

    expect(f.rpcForwardListener).not.toHaveBeenCalled();
  });

  it("source='whatsapp', bridge attached (listenerCount > 1) → emits 'permission'", () => {
    const f = buildFixture({ source: 'whatsapp', hasConnectedClients: false });
    const bridgeListener = vi.fn();
    f.emitter.on('permission', bridgeListener);

    f.callbacks.onPermissionRequest?.(fakeRequest);

    expect(bridgeListener).toHaveBeenCalledWith(fakeRequest);

    expect(f.sendPermissionResponse).not.toHaveBeenCalled();
  });

  it("source='whatsapp', bridge NOT attached → auto-denies here (plan decision #10)", () => {
    const f = buildFixture({ source: 'whatsapp', hasConnectedClients: false });

    f.callbacks.onPermissionRequest?.(fakeRequest);

    expect(f.sendPermissionResponse).toHaveBeenCalledWith('tsk_abc', {
      taskId: 'tsk_abc',
      requestId: 'filereq_xyz',
      decision: 'deny',
    });
  });

  it("source='scheduler', no UI connected → auto-denies", () => {
    const f = buildFixture({ source: 'scheduler', hasConnectedClients: false });

    f.callbacks.onPermissionRequest?.(fakeRequest);

    expect(f.sendPermissionResponse).toHaveBeenCalledWith('tsk_abc', {
      taskId: 'tsk_abc',
      requestId: 'filereq_xyz',
      decision: 'deny',
    });
  });

  it("source='background', no UI connected → auto-denies", () => {
    const f = buildFixture({ source: 'background', hasConnectedClients: false });

    f.callbacks.onPermissionRequest?.(fakeRequest);

    expect(f.sendPermissionResponse).toHaveBeenCalledWith('tsk_abc', {
      taskId: 'tsk_abc',
      requestId: 'filereq_xyz',
      decision: 'deny',
    });
  });

  it("source='connector', no UI connected → auto-denies", () => {
    const f = buildFixture({ source: 'connector', hasConnectedClients: false });

    f.callbacks.onPermissionRequest?.(fakeRequest);

    expect(f.sendPermissionResponse).toHaveBeenCalledWith('tsk_abc', {
      taskId: 'tsk_abc',
      requestId: 'filereq_xyz',
      decision: 'deny',
    });
  });

  it("source='scheduler', UI connected → emits 'permission' (user can still approve)", () => {
    const f = buildFixture({ source: 'scheduler', hasConnectedClients: true });

    f.callbacks.onPermissionRequest?.(fakeRequest);

    expect(f.rpcForwardListener).toHaveBeenCalledWith(fakeRequest);
    expect(f.sendPermissionResponse).not.toHaveBeenCalled();
  });

  it('auto-deny within a few milliseconds (<=100ms budget for scheduled tasks)', async () => {
    const f = buildFixture({ source: 'scheduler', hasConnectedClients: false });

    const started = Date.now();
    f.callbacks.onPermissionRequest?.(fakeRequest);
    const elapsed = Date.now() - started;

    expect(f.sendPermissionResponse).toHaveBeenCalled();
    expect(elapsed).toBeLessThan(50);
  });
});

describe('createTaskCallbacks — onProgress', () => {
  it('emits "progress" event with taskId and progress data', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const progress = { stage: 'thinking' as const, message: 'Analyzing...' };

    const progressListener = vi.fn();
    f.emitter.on('progress', progressListener);

    f.callbacks.onProgress(progress);

    expect(progressListener).toHaveBeenCalledWith({
      taskId: 'tsk_abc',
      ...progress,
    });
  });
});

describe('createTaskCallbacks — onBatchedMessages', () => {
  it('emits "message" event and persists each message to storage', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const messages: TaskMessage[] = [
      {
        id: 'msg_1',
        type: 'assistant',
        content: 'Hello',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'msg_2',
        type: 'user',
        content: 'Hi',
        timestamp: new Date().toISOString(),
      },
    ];

    const messageListener = vi.fn();
    f.emitter.on('message', messageListener);

    f.callbacks.onBatchedMessages(messages);

    expect(messageListener).toHaveBeenCalledWith({
      taskId: 'tsk_abc',
      messages,
    });
    expect(f.storage.addTaskMessage).toHaveBeenCalledTimes(2);
    expect(f.storage.addTaskMessage).toHaveBeenCalledWith('tsk_abc', messages[0]);
    expect(f.storage.addTaskMessage).toHaveBeenCalledWith('tsk_abc', messages[1]);
  });
});

describe('createTaskCallbacks — onComplete', () => {
  it('emits "complete" and updates status to "completed" on success', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const result: TaskResult = { status: 'success' };

    const completeListener = vi.fn();
    f.emitter.on('complete', completeListener);

    f.callbacks.onComplete(result);

    expect(completeListener).toHaveBeenCalledWith({
      taskId: 'tsk_abc',
      result,
    });
    expect(f.storage.updateTaskStatus).toHaveBeenCalledWith(
      'tsk_abc',
      'completed',
      expect.any(String),
    );
    expect(f.storage.clearTodosForTask).toHaveBeenCalledWith('tsk_abc');
  });

  it('clears todos only when status is "success"', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const errorResult: TaskResult = { status: 'error' };

    f.callbacks.onComplete(errorResult);

    expect(f.storage.updateTaskStatus).toHaveBeenCalledWith(
      'tsk_abc',
      'failed',
      expect.any(String),
    );
    expect(f.storage.clearTodosForTask).not.toHaveBeenCalled();
  });

  it('updates sessionId when present in result', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const result: TaskResult = { status: 'success', sessionId: 'sess_123' };

    f.callbacks.onComplete(result);

    expect(f.storage.updateTaskSessionId).toHaveBeenCalledWith('tsk_abc', 'sess_123');
  });

  it('falls back to taskManager.getSessionId when result has no sessionId', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    f.taskManager.getSessionId = vi.fn(() => 'sess_from_manager');
    const result: TaskResult = { status: 'error' };

    f.callbacks.onComplete(result);

    expect(f.taskManager.getSessionId).toHaveBeenCalledWith('tsk_abc');
    expect(f.storage.updateTaskSessionId).toHaveBeenCalledWith('tsk_abc', 'sess_from_manager');
  });

  it('skips updateTaskSessionId when neither result nor taskManager provides one', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const result: TaskResult = { status: 'error' };

    f.callbacks.onComplete(result);

    expect(f.storage.updateTaskSessionId).not.toHaveBeenCalled();
  });

  it('maps interrupted result to "interrupted" status', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const result: TaskResult = { status: 'interrupted' };

    f.callbacks.onComplete(result);

    expect(f.storage.updateTaskStatus).toHaveBeenCalledWith(
      'tsk_abc',
      'interrupted',
      expect.any(String),
    );
  });
});

describe('createTaskCallbacks — onError', () => {
  it('emits "error" and updates status to "failed"', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const error = new Error('Something went wrong');

    const errorListener = vi.fn();
    f.emitter.on('error', errorListener);

    f.callbacks.onError(error);

    expect(errorListener).toHaveBeenCalledWith({
      taskId: 'tsk_abc',
      error: 'Something went wrong',
    });
    expect(f.storage.updateTaskStatus).toHaveBeenCalledWith(
      'tsk_abc',
      'failed',
      expect.any(String),
    );
  });
});

describe('createTaskCallbacks — onStatusChange', () => {
  it('emits "statusChange" and updates storage with the status', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });

    const statusListener = vi.fn();
    f.emitter.on('statusChange', statusListener);

    const status: TaskStatus = 'running';
    f.callbacks.onStatusChange(status);

    expect(statusListener).toHaveBeenCalledWith({
      taskId: 'tsk_abc',
      status,
    });
    expect(f.storage.updateTaskStatus).toHaveBeenCalledWith(
      'tsk_abc',
      'running',
      expect.any(String),
    );
  });
});

describe('createTaskCallbacks — onTodoUpdate', () => {
  it('persists todos and emits "todo:update"', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const todos: TodoItem[] = [
      { id: 'td_1', content: 'Step 1', status: 'pending', priority: 'high' },
      { id: 'td_2', content: 'Step 2', status: 'completed', priority: 'medium' },
    ];

    const todoListener = vi.fn();
    f.emitter.on('todo:update', todoListener);

    f.callbacks.onTodoUpdate(todos);

    expect(f.storage.saveTodosForTask).toHaveBeenCalledWith('tsk_abc', todos);
    expect(todoListener).toHaveBeenCalledWith({
      taskId: 'tsk_abc',
      todos,
    });
  });
});

describe('createTaskCallbacks — onAuthError', () => {
  it('emits "auth:error" with provider info', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const authError = { providerId: 'github', message: 'Token expired' };

    const authListener = vi.fn();
    f.emitter.on('auth:error', authListener);

    f.callbacks.onAuthError(authError);

    expect(authListener).toHaveBeenCalledWith({
      taskId: 'tsk_abc',
      providerId: 'github',
      message: 'Token expired',
    });
  });
});

describe('createTaskCallbacks — onBrowserFrame', () => {
  it('emits "browser:frame" with frame data', () => {
    const f = buildFixture({ source: 'ui', hasConnectedClients: true });
    const payload: BrowserFramePayload = {
      frame: 'base64data',
      pageName: 'test-page',
      timestamp: 1700000000000,
    };

    const frameListener = vi.fn();
    f.emitter.on('browser:frame', frameListener);

    f.callbacks.onBrowserFrame(payload);

    expect(frameListener).toHaveBeenCalledWith({
      taskId: 'tsk_abc',
      ...payload,
    });
  });
});
