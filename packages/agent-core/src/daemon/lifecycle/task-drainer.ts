import { Logger } from './logger';
import type { TaskQueue } from './task-queue.interface';

/**
 * Task Drainer configuration
 */
export interface TaskDrainerConfig {
  /** Drain timeout in milliseconds */
  drainTimeoutMs: number;

  /** Whether to abort critical tasks on timeout */
  abortCriticalOnTimeout: boolean;
}

/**
 * Task Drainer statistics
 */
export interface TaskDrainerStats {
  tasksDrained: number;
  tasksAborted: number;
  tasksDiscarded: number;
}

/**
 * Task Drainer
 *
 * Drains active tasks during shutdown.
 * Discards pending tasks.
 * Aborts critical tasks on timeout if configured.
 */
export class TaskDrainer {
  private taskQueue: TaskQueue;
  private config: TaskDrainerConfig;
  private stats: TaskDrainerStats;
  private logger: Logger;

  constructor(taskQueue: TaskQueue, config: TaskDrainerConfig) {
    this.taskQueue = taskQueue;
    this.config = config;
    this.stats = this.createInitialStats();
    this.logger = new Logger('TaskDrainer');
  }

  /**
   * Drain active tasks and discard pending tasks
   * @returns Number of tasks discarded
   */
  async drain(): Promise<number> {
    this.logger.info('Starting task drain');
    this.stats = this.createInitialStats();

    // Get active tasks
    const activeTasks = this.taskQueue.getActiveTasks();
    this.logger.info('Active tasks to drain', { count: activeTasks.length });

    // Wait for active tasks to complete (with timeout)
    await this.waitForActiveTasks(activeTasks.length);

    // Discard pending tasks
    const _pendingTasks = this.taskQueue.getPendingTasks();
    this.stats.tasksDiscarded = this.taskQueue.discardPendingTasks();
    this.logger.info('Pending tasks discarded', { count: this.stats.tasksDiscarded });

    this.logger.info('Task drain completed', {
      drained: this.stats.tasksDrained,
      aborted: this.stats.tasksAborted,
      discarded: this.stats.tasksDiscarded,
    });

    return this.stats.tasksDiscarded;
  }

  /**
   * Abort tasks in critical state
   * @returns Number of tasks aborted
   */
  async abortCriticalTasks(): Promise<number> {
    this.logger.info('Aborting critical tasks');

    const activeTasks = this.taskQueue.getActiveTasks();
    const criticalTasks = activeTasks.filter((task) => task.isCritical);

    let abortedCount = 0;
    for (const task of criticalTasks) {
      try {
        this.taskQueue.markFailed(task.id, 'Aborted during shutdown');
        abortedCount++;
        this.logger.info('Aborted critical task', { taskId: task.id });
      } catch (error) {
        this.logger.error('Failed to abort critical task', {
          taskId: task.id,
          error: (error as Error).message,
        });
      }
    }

    this.stats.tasksAborted = abortedCount;
    return abortedCount;
  }

  /**
   * Get drain statistics
   */
  getStats(): TaskDrainerStats {
    return { ...this.stats };
  }

  /**
   * Wait for active tasks to complete
   */
  private async waitForActiveTasks(activeTaskCount: number): Promise<void> {
    if (activeTaskCount === 0) {
      return;
    }

    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        this.logger.warn('Task drain timeout reached');
        clearInterval(checkInterval);
        if (this.config.abortCriticalOnTimeout) {
          this.abortCriticalTasks().then(() => resolve());
        } else {
          resolve();
        }
      }, this.config.drainTimeoutMs);

      // Poll for task completion
      const checkInterval = setInterval(() => {
        const remaining = this.taskQueue.getActiveTasks().length;
        if (remaining === 0) {
          clearTimeout(timer);
          clearInterval(checkInterval);
          this.stats.tasksDrained = activeTaskCount;
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Create initial stats
   */
  private createInitialStats(): TaskDrainerStats {
    return {
      tasksDrained: 0,
      tasksAborted: 0,
      tasksDiscarded: 0,
    };
  }
}
