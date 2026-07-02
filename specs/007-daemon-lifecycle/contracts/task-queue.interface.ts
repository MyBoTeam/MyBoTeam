import type { TaskState } from './task-state.enum';

/**
 * Task - Unit of work processed by daemon
 */
export interface Task {
  /** Unique task identifier */
  readonly taskId: string;

  /** Current task state */
  state: TaskState;

  /** When task was created (ISO-8601 timestamp) */
  readonly createdAt: string;

  /** When task execution began (ISO-8601 timestamp) */
  startedAt: string | null;

  /** When task completed or failed (ISO-8601 timestamp) */
  completedAt: string | null;

  /** Task-specific timeout in milliseconds (null for default) */
  readonly timeout: number | null;
}

/**
 * TaskQueue - Queue of tasks managed by daemon
 */
export interface TaskQueue {
  /**
   * Add task to queue
   * @param taskId Unique identifier for the task
   * @param timeout Optional task-specific timeout
   * @returns Created task
   */
  add(taskId: string, timeout?: number): Task;

  /**
   * Get next task to execute
   * @returns Next pending task, or null if queue is empty
   */
  getNext(): Task | null;

  /**
   * Mark task as completed
   * @param taskId Task identifier
   */
  complete(taskId: string): void;

  /**
   * Mark task as failed
   * @param taskId Task identifier
   * @param error Optional error message
   */
  fail(taskId: string, error?: string): void;

  /**
   * Get count of active tasks
   */
  getActiveCount(): number;

  /**
   * Get all tasks in specified state
   */
  getByState(state: TaskState): Task[];

  /**
   * Discard all pending tasks (used during shutdown)
   * @returns Number of tasks discarded
   */
  discardPending(): number;
}
