import type { TaskStatus } from '../../common/types/task.js';
import { flushDatabase, getDatabase } from '../database.js';

export function updateTaskStatus(taskId: string, status: TaskStatus, completedAt?: string): void {
  const db = getDatabase();
  const completedAtClause = completedAt ? ', completed_at = ?' : '';
  const params = completedAt ? [status, completedAt, taskId] : [status, taskId];
  db.run(`UPDATE tasks SET status = ?${completedAtClause} WHERE id = ?`, params);
  flushDatabase();
}

export function updateTaskSessionId(taskId: string, sessionId: string): void {
  const db = getDatabase();
  db.run('UPDATE tasks SET session_id = ? WHERE id = ?', [sessionId, taskId]);
  flushDatabase();
}

export function updateTaskSummary(taskId: string, summary: string): void {
  const db = getDatabase();
  db.run('UPDATE tasks SET summary = ? WHERE id = ?', [summary, taskId]);
  flushDatabase();
}

export function setMaxHistoryItems(_max: number): void {}

export function clearTaskHistoryStore(): void {
  const db = getDatabase();
  db.run('DELETE FROM tasks');
  flushDatabase();
}

export function flushPendingTasks(): void {}
