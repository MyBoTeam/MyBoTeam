/**
 * Task lifecycle states
 *
 * Valid transitions:
 * - Pending → Active (task execution starts)
 * - Active → Completed (task succeeds)
 * - Active → Failed (task fails or aborted)
 * - Pending → Failed (discarded during shutdown)
 */
export enum TaskState {
  Pending = 'Pending',
  Active = 'Active',
  Completed = 'Completed',
  Failed = 'Failed',
}

/**
 * Valid state transitions for task lifecycle
 */
export const VALID_TASK_TRANSITIONS: Record<TaskState, TaskState[]> = {
  [TaskState.Pending]: [TaskState.Active, TaskState.Failed],
  [TaskState.Active]: [TaskState.Completed, TaskState.Failed],
  [TaskState.Completed]: [],
  [TaskState.Failed]: [],
};

/**
 * Check if a task state transition is valid
 */
export function isValidTaskTransition(from: TaskState, to: TaskState): boolean {
  return VALID_TASK_TRANSITIONS[from].includes(to);
}
