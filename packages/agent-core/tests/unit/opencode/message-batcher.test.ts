import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TaskMessage } from '../../../src/common/types/task.js';
import {
  createMessageBatcher,
  flushAndCleanupBatcher,
  MESSAGE_BATCH_DELAY_MS,
  queueMessage,
} from '../../../src/opencode/message-batcher.js';

describe('message-batcher', () => {
  afterEach(() => {
    flushAndCleanupBatcher('task-1');
    flushAndCleanupBatcher('task-qm-1');
    flushAndCleanupBatcher('task-qm-2');
    flushAndCleanupBatcher('task-cleanup-1');
  });

  describe('createMessageBatcher', () => {
    it('creates a batcher with empty pending messages', () => {
      const forwardToRenderer = vi.fn();
      const addTaskMessage = vi.fn();
      const batcher = createMessageBatcher('task-1', forwardToRenderer, addTaskMessage);

      expect(batcher.taskId).toBe('task-1');
      expect(batcher.pendingMessages).toEqual([]);
      expect(batcher.timeout).toBeNull();
      expect(typeof batcher.flush).toBe('function');
    });

    it('flush persists messages and forwards them', () => {
      const forwardToRenderer = vi.fn();
      const addTaskMessage = vi.fn();
      const batcher = createMessageBatcher('task-1', forwardToRenderer, addTaskMessage);

      const msg1: TaskMessage = { role: 'assistant', content: 'Hello', ts: 100 };
      const msg2: TaskMessage = { role: 'user', content: 'Hi', ts: 200 };
      batcher.pendingMessages.push(msg1, msg2);

      batcher.flush();

      expect(addTaskMessage).toHaveBeenCalledTimes(2);
      expect(addTaskMessage).toHaveBeenCalledWith('task-1', msg1);
      expect(addTaskMessage).toHaveBeenCalledWith('task-1', msg2);
      expect(forwardToRenderer).toHaveBeenCalledWith('task:update:batch', {
        taskId: 'task-1',
        messages: [msg1, msg2],
      });
      expect(batcher.pendingMessages).toEqual([]);
    });

    it('flush does nothing when no pending messages', () => {
      const forwardToRenderer = vi.fn();
      const addTaskMessage = vi.fn();
      const batcher = createMessageBatcher('task-1', forwardToRenderer, addTaskMessage);

      batcher.flush();

      expect(addTaskMessage).not.toHaveBeenCalled();
      expect(forwardToRenderer).not.toHaveBeenCalled();
    });

    it('flush handles errors from addTaskMessage and retries failed messages', () => {
      const forwardToRenderer = vi.fn();
      const addTaskMessage = vi.fn().mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const batcher = createMessageBatcher('task-1', forwardToRenderer, addTaskMessage);

      const msg1: TaskMessage = { role: 'assistant', content: 'Fail me', ts: 100 };
      const msg2: TaskMessage = { role: 'user', content: 'Persist me', ts: 200 };
      batcher.pendingMessages.push(msg1, msg2);

      batcher.flush();

      expect(addTaskMessage).toHaveBeenCalledTimes(2);
      expect(forwardToRenderer).toHaveBeenCalledWith('task:update:batch', {
        taskId: 'task-1',
        messages: [msg2],
      });

      expect(batcher.pendingMessages).toEqual([msg1]);

      expect(batcher.timeout).not.toBeNull();
    });

    it('flush handles errors from forwardToRenderer', () => {
      const forwardToRenderer = vi.fn().mockImplementationOnce(() => {
        throw new Error('Renderer error');
      });
      const addTaskMessage = vi.fn();
      const batcher = createMessageBatcher('task-1', forwardToRenderer, addTaskMessage);

      const msg1: TaskMessage = { role: 'assistant', content: 'Hello', ts: 100 };
      batcher.pendingMessages.push(msg1);

      batcher.flush();

      expect(addTaskMessage).toHaveBeenCalledWith('task-1', msg1);
      expect(forwardToRenderer).toHaveBeenCalled();
      expect(batcher.pendingMessages).toEqual([]);
    });
  });

  describe('queueMessage', () => {
    it('queues a message and flushes when cleanup is called', () => {
      const forwardToRenderer = vi.fn();
      const addTaskMessage = vi.fn();

      const msg: TaskMessage = { role: 'assistant', content: 'Test', ts: 100 };
      queueMessage('task-qm-1', msg, forwardToRenderer, addTaskMessage);

      expect(addTaskMessage).not.toHaveBeenCalled();

      flushAndCleanupBatcher('task-qm-1');

      expect(addTaskMessage).toHaveBeenCalledWith('task-qm-1', msg);
      expect(forwardToRenderer).toHaveBeenCalledWith('task:update:batch', {
        taskId: 'task-qm-1',
        messages: [msg],
      });
    });

    it('reuses existing batcher for same task', () => {
      const forwardToRenderer = vi.fn();
      const addTaskMessage = vi.fn();

      const msg1: TaskMessage = { role: 'assistant', content: 'First', ts: 100 };
      const msg2: TaskMessage = { role: 'user', content: 'Second', ts: 200 };

      queueMessage('task-qm-2', msg1, forwardToRenderer, addTaskMessage);
      queueMessage('task-qm-2', msg2, forwardToRenderer, addTaskMessage);

      flushAndCleanupBatcher('task-qm-2');

      expect(addTaskMessage).toHaveBeenCalledTimes(2);
      expect(forwardToRenderer).toHaveBeenCalledWith('task:update:batch', {
        taskId: 'task-qm-2',
        messages: [msg1, msg2],
      });
    });
  });

  describe('flushAndCleanupBatcher', () => {
    it('flushes and removes batcher when all messages succeed', () => {
      const forwardToRenderer = vi.fn();
      const addTaskMessage = vi.fn();

      const msg: TaskMessage = { role: 'assistant', content: 'Test', ts: 100 };
      queueMessage('task-cleanup-1', msg, forwardToRenderer, addTaskMessage);

      flushAndCleanupBatcher('task-cleanup-1');

      expect(addTaskMessage).toHaveBeenCalledWith('task-cleanup-1', msg);
      expect(forwardToRenderer).toHaveBeenCalledWith('task:update:batch', {
        taskId: 'task-cleanup-1',
        messages: [msg],
      });

      addTaskMessage.mockClear();
      forwardToRenderer.mockClear();
      const msg2: TaskMessage = { role: 'assistant', content: 'After cleanup', ts: 200 };
      queueMessage('task-cleanup-1', msg2, forwardToRenderer, addTaskMessage);

      flushAndCleanupBatcher('task-cleanup-1');
      expect(addTaskMessage).toHaveBeenCalledWith('task-cleanup-1', msg2);
    });

    it('does nothing for unknown task', () => {
      const forwardToRenderer = vi.fn();
      const addTaskMessage = vi.fn();

      flushAndCleanupBatcher('nonexistent');
      expect(addTaskMessage).not.toHaveBeenCalled();
    });
  });
});
