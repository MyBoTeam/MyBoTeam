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
  Failed = 'Failed'
}
