import { randomUUID } from 'node:crypto';
import type { ScheduledTask } from '../../common/types/daemon.js';
import { flushDatabase, getDatabase } from '../database.js';
import { rowFromResult, rowsFromResult } from '../query-helpers.js';
import type { ScheduledTaskRow } from './scheduled-task-types.js';
import { computeNextRunAt, rowToScheduledTask } from './scheduled-task-types.js';

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

export function createScheduledTask(
  cron: string,
  prompt: string,
  workspaceId?: string,
): ScheduledTask {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();
  const nextRunAt = computeNextRunAt(cron, new Date());

  if (!nextRunAt) {
    throw new Error(
      `Cannot schedule "${cron}": no matching date within the scan window. ` +
        'Try a less restrictive cron expression.',
    );
  }

  db.run(
    `INSERT INTO scheduled_tasks (id, cron, prompt, workspace_id, is_enabled, created_at, updated_at, last_run_at, next_run_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, NULL, ?)`,
    [id, cron, prompt, workspaceId || null, now, now, nextRunAt],
  );
  flushDatabase();

  return {
    id,
    cron,
    prompt,
    workspaceId,
    enabled: true,
    createdAt: now,
    updatedAt: now,
    nextRunAt: nextRunAt || undefined,
  };
}

export function deleteScheduledTask(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM scheduled_tasks WHERE id = ?', [id]);
  flushDatabase();
}

export function setScheduledTaskEnabled(id: string, enabled: boolean): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  if (enabled) {
    const row = rowFromResult<{ cron: string }>(
      db.exec('SELECT cron FROM scheduled_tasks WHERE id = ?', [id]),
    );
    const nextRunAt = row ? computeNextRunAt(row.cron, new Date()) : null;
    if (!nextRunAt) {
      throw new Error(
        `Cannot enable schedule: no matching date within the scan window for "${row?.cron ?? 'unknown'}".`,
      );
    }
    db.run(
      'UPDATE scheduled_tasks SET is_enabled = 1, next_run_at = ?, updated_at = ? WHERE id = ?',
      [nextRunAt, now, id],
    );
  } else {
    db.run(
      'UPDATE scheduled_tasks SET is_enabled = 0, next_run_at = NULL, updated_at = ? WHERE id = ?',
      [now, id],
    );
  }
  flushDatabase();
}

export function updateScheduledTaskLastRun(id: string, timestamp: string, nextRunAt: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.run(
    'UPDATE scheduled_tasks SET last_run_at = ?, next_run_at = ?, updated_at = ? WHERE id = ?',
    [timestamp, nextRunAt, now, id],
  );
  flushDatabase();
}
