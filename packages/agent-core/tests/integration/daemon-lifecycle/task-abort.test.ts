import { existsSync, unlinkSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import { ShutdownManager } from '../../../src/daemon/lifecycle/shutdown-manager';
import { TaskDrainer } from '../../../src/daemon/lifecycle/task-drainer';
import type { TaskQueue } from '../../../src/daemon/lifecycle/task-queue.interface';
import { TaskState } from '../../../src/daemon/lifecycle/task-state';

describe('Task Abort on Critical State Integration', () => {
  let daemonManager: DaemonProcessManager;
  let shutdownManager: ShutdownManager;
  let taskDrainer: TaskDrainer;
  let mockTaskQueue: TaskQueue;
  let socketPath: string;
  let pidPath: string;

  afterEach(async () => {
    if (daemonManager?.isRunning()) {
      await daemonManager.kill();
    }
    if (pidPath && existsSync(pidPath)) unlinkSync(pidPath);
    if (socketPath && existsSync(socketPath)) unlinkSync(socketPath);
  });

  it('should abort critical tasks on timeout', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-task-abort-${testId}.sock`;
    pidPath = `/tmp/test-daemon-task-abort-${testId}.pid`;

    const criticalTasks = [
      { id: 'task-1', state: TaskState.Active, isCritical: true },
      { id: 'task-2', state: TaskState.Active, isCritical: false },
    ];

    mockTaskQueue = {
      getActiveTasks: () => criticalTasks as any,
      getPendingTasks: () => [],
      discardPendingTasks: () => 0,
      markFailed: (id: string) => {
        const task = criticalTasks.find((t) => t.id === id);
        if (task) task.state = TaskState.Failed;
      },
    } as any;

    taskDrainer = new TaskDrainer(mockTaskQueue, {
      drainTimeoutMs: 100,
      abortCriticalOnTimeout: true,
    });

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
    });

    shutdownManager = new ShutdownManager({
      shutdownTimeoutMs: 500,
      forceKillFn: () => daemonManager.kill(),
      drainTasksFn: () => taskDrainer.drain(),
      cleanupResourcesFn: async () => {},
    });

    await daemonManager.start();

    await shutdownManager.initiateShutdown();

    const stats = taskDrainer.getStats();
    expect(stats.tasksAborted).toBe(1);
  });

  it('should track aborted task count via stats', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-task-abort-${testId}.sock`;
    pidPath = `/tmp/test-daemon-task-abort-${testId}.pid`;

    const criticalTasks = [{ id: 'task-1', state: TaskState.Active, isCritical: true }];

    mockTaskQueue = {
      getActiveTasks: () => criticalTasks as any,
      getPendingTasks: () => [],
      discardPendingTasks: () => 0,
      markFailed: (id: string) => {
        const task = criticalTasks.find((t) => t.id === id);
        if (task) task.state = TaskState.Failed;
      },
    } as any;

    taskDrainer = new TaskDrainer(mockTaskQueue, {
      drainTimeoutMs: 100,
      abortCriticalOnTimeout: true,
    });

    await taskDrainer.drain();

    const stats = taskDrainer.getStats();
    expect(stats.tasksAborted).toBe(1);
  });

  it('should not abort non-critical tasks', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-task-abort-${testId}.sock`;
    pidPath = `/tmp/test-daemon-task-abort-${testId}.pid`;

    const tasks = [
      { id: 'task-1', state: TaskState.Active, isCritical: false },
      { id: 'task-2', state: TaskState.Active, isCritical: false },
    ];

    mockTaskQueue = {
      getActiveTasks: () => tasks as any,
      getPendingTasks: () => [],
      discardPendingTasks: () => 0,
      markFailed: () => {},
    } as any;

    taskDrainer = new TaskDrainer(mockTaskQueue, {
      drainTimeoutMs: 100,
      abortCriticalOnTimeout: true,
    });

    await taskDrainer.drain();

    const stats = taskDrainer.getStats();
    expect(stats.tasksAborted).toBe(0);
  });
});
