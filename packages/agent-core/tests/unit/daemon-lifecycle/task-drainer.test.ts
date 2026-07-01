import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskDrainer } from '../../../src/daemon/lifecycle/task-drainer';
import type { TaskQueue } from '../../../src/daemon/lifecycle/task-queue.interface';
import { TaskState } from '../../../src/daemon/lifecycle/task-state';

describe('TaskDrainer', () => {
  let drainer: TaskDrainer;
  let mockTaskQueue: TaskQueue;

  beforeEach(() => {
    mockTaskQueue = {
      addTask: vi.fn().mockReturnValue('task-1'),
      getNextTask: vi.fn().mockReturnValue(null),
      markActive: vi.fn(),
      markCompleted: vi.fn(),
      markFailed: vi.fn(),
      getActiveTasks: vi.fn().mockReturnValue([]),
      getPendingTasks: vi.fn().mockReturnValue([]),
      getTaskCounts: vi.fn().mockReturnValue({
        [TaskState.Pending]: 0,
        [TaskState.Active]: 0,
        [TaskState.Completed]: 0,
        [TaskState.Failed]: 0,
      }),
      discardPendingTasks: vi.fn().mockReturnValue(0),
      getTask: vi.fn().mockReturnValue(null),
      size: vi.fn().mockReturnValue(0),
      isEmpty: vi.fn().mockReturnValue(true),
    };

    drainer = new TaskDrainer(mockTaskQueue, {
      drainTimeoutMs: 5000,
      abortCriticalOnTimeout: true,
    });
  });

  describe('drain()', () => {
    it('should drain active tasks', async () => {
      const mockTasks = [
        { id: 'task-1', state: TaskState.Active, isCritical: false },
        { id: 'task-2', state: TaskState.Active, isCritical: false },
      ];
      // Return tasks initially, then empty after polling starts
      let callCount = 0;
      vi.mocked(mockTaskQueue.getActiveTasks).mockImplementation(() => {
        callCount++;
        return callCount <= 1 ? (mockTasks as any) : [];
      });

      const discarded = await drainer.drain();

      expect(discarded).toBe(0);
    });

    it('should discard pending tasks', async () => {
      vi.mocked(mockTaskQueue.discardPendingTasks).mockReturnValue(3);

      const discarded = await drainer.drain();

      expect(discarded).toBe(3);
    });

    it('should track drain statistics', async () => {
      await drainer.drain();

      const stats = drainer.getStats();
      expect(stats.tasksDrained).toBeDefined();
      expect(stats.tasksDiscarded).toBeDefined();
    });
  });

  describe('abortCriticalTasks()', () => {
    it('should abort tasks in critical state', async () => {
      const mockTasks = [
        { id: 'task-1', state: TaskState.Active, isCritical: true },
        { id: 'task-2', state: TaskState.Active, isCritical: false },
      ];
      vi.mocked(mockTaskQueue.getActiveTasks).mockReturnValue(mockTasks as any);

      const aborted = await drainer.abortCriticalTasks();

      expect(aborted).toBe(1);
      expect(mockTaskQueue.markFailed).toHaveBeenCalledWith('task-1', 'Aborted during shutdown');
    });
  });

  describe('getStats()', () => {
    it('should return drain statistics', async () => {
      await drainer.drain();

      const stats = drainer.getStats();
      expect(stats).toHaveProperty('tasksDrained');
      expect(stats).toHaveProperty('tasksAborted');
      expect(stats).toHaveProperty('tasksDiscarded');
    });
  });
});
