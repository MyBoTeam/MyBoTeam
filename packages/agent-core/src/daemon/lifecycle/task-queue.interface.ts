import type { TaskState } from './task-state';

/**
 * Task data structure
 */
export interface Task {
  /** Unique task identifier */
  id: string;

  /** Task type */
  type: string;

  /** Task payload */
  payload: unknown;

  /** Current task state */
  state: TaskState;

  /** Task creation timestamp */
  createdAt: number;

  /** Task execution start timestamp */
  startedAt?: number;

  /** Task completion timestamp */
  completedAt?: number;

  /** Task timeout in milliseconds */
  timeoutMs?: number;

  /** Whether task is in critical state (e.g., writing to database) */
  isCritical?: boolean;
}

/**
 * Task queue interface for managing pending and active tasks
 */
export interface TaskQueue {
  /**
   * Add a task to the queue
   * @param task Task data
   * @returns Task ID
   */
  addTask(task: Pick<Task, 'type' | 'payload' | 'timeoutMs' | 'isCritical'>): string;

  /**
   * Get the next task to execute
   * @returns Next pending task or null if queue is empty
   */
  getNextTask(): Task | null;

  /**
   * Mark a task as active (started execution)
   * @param taskId Task ID
   */
  markActive(taskId: string): void;

  /**
   * Mark a task as completed
   * @param taskId Task ID
   */
  markCompleted(taskId: string): void;

  /**
   * Mark a task as failed
   * @param taskId Task ID
   * @param error Error message
   */
  markFailed(taskId: string, error: string): void;

  /**
   * Get all active tasks
   * @returns Array of active tasks
   */
  getActiveTasks(): Task[];

  /**
   * Get all pending tasks
   * @returns Array of pending tasks
   */
  getPendingTasks(): Task[];

  /**
   * Get task count by state
   * @returns Object with counts for each state
   */
  getTaskCounts(): Record<TaskState, number>;

  /**
   * Discard all pending tasks (used during shutdown)
   * @returns Number of tasks discarded
   */
  discardPendingTasks(): number;

  /**
   * Get a task by ID
   * @param taskId Task ID
   * @returns Task or null if not found
   */
  getTask(taskId: string): Task | null;

  /**
   * Get the total number of tasks
   * @returns Total task count
   */
  size(): number;

  /**
   * Check if the queue is empty
   * @returns True if no tasks in queue
   */
  isEmpty(): boolean;
}
