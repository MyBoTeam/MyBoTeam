import type { TaskResult, TaskStatus } from '../common/types/task.js';

export function mapResultToStatus(result: TaskResult): TaskStatus {
  if (result.status === 'success') return 'completed';
  if (result.status === 'interrupted') return 'interrupted';
  return 'failed';
}
