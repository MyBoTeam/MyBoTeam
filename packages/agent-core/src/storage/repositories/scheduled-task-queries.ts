import type { ScheduledTask } from '../../common/types/daemon.js';
import { getDatabase } from '../database.js';
import { rowFromResult, rowsFromResult } from '../query-helpers.js';
import type { ScheduledTaskRow } from './scheduled-task-types.js';
import { rowToScheduledTask } from './scheduled-task-types.js';

export function getAllScheduledTasks(): ScheduledTask[] {
  const db = getDatabase();
  const rows = rowsFromResult<ScheduledTaskRow>(
    db.exec('SELECT * FROM scheduled_tasks ORDER BY created_at'),
  );
  return rows.map(rowToScheduledTask);
}

export function getEnabledScheduledTasks(): ScheduledTask[] {
  const db = getDatabase();
  const rows = rowsFromResult<ScheduledTaskRow>(
    db.exec('SELECT * FROM scheduled_tasks WHERE is_enabled = 1 ORDER BY created_at'),
  );
  return rows.map(rowToScheduledTask);
}

export function getScheduledTasksByWorkspace(workspaceId: string): ScheduledTask[] {
  const db = getDatabase();
  const rows = rowsFromResult<ScheduledTaskRow>(
    db.exec('SELECT * FROM scheduled_tasks WHERE workspace_id = ? ORDER BY created_at', [
      workspaceId,
    ]),
  );
  return rows.map(rowToScheduledTask);
}

export function getScheduledTaskById(id: string): ScheduledTask | null {
  const db = getDatabase();
  const row = rowFromResult<ScheduledTaskRow>(
    db.exec('SELECT * FROM scheduled_tasks WHERE id = ?', [id]),
  );
  return row ? rowToScheduledTask(row) : null;
}
