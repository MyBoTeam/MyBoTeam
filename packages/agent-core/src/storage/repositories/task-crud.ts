import type { Task } from '../../common/types/task.js';
import { flushDatabase, getDatabase, withTransaction } from '../database.js';
import { rowFromResult, rowsFromResult } from '../query-helpers.js';
import { insertAttachments } from './task-history-common.js';
import { MAX_HISTORY_ITEMS } from './task-history-types.js';
import type { StoredTask, TaskRow } from './task-row-mapper.js';
import { rowToTask } from './task-row-mapper.js';

export * from './task-history-types.js';

export function getTasks(workspaceId?: string | null, includeUnassigned = false): StoredTask[] {
  const db = getDatabase();
  let rows: TaskRow[];
  if (workspaceId) {
    if (includeUnassigned) {
      rows = rowsFromResult<TaskRow>(
        db.exec(
          'SELECT * FROM tasks WHERE workspace_id = ? OR workspace_id IS NULL ORDER BY created_at DESC LIMIT ?',
          [workspaceId, MAX_HISTORY_ITEMS],
        ),
      );
    } else {
      rows = rowsFromResult<TaskRow>(
        db.exec('SELECT * FROM tasks WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?', [
          workspaceId,
          MAX_HISTORY_ITEMS,
        ]),
      );
    }
  } else {
    rows = rowsFromResult<TaskRow>(
      db.exec('SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?', [MAX_HISTORY_ITEMS]),
    );
  }
  return rows.map(rowToTask);
}

export function getTask(taskId: string): StoredTask | undefined {
  const db = getDatabase();
  const row = rowFromResult<TaskRow>(db.exec('SELECT * FROM tasks WHERE id = ?', [taskId]));
  return row ? rowToTask(row) : undefined;
}

export function saveTask(task: Task, workspaceId?: string | null): void {
  const db = getDatabase();
  withTransaction(db, () => {
    db.run(
      `INSERT OR REPLACE INTO tasks
        (id, prompt, summary, status, session_id, created_at, started_at, completed_at, workspace_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.prompt,
        task.summary || null,
        task.status,
        task.sessionId || null,
        task.createdAt,
        task.startedAt || null,
        task.completedAt || null,
        workspaceId || null,
      ],
    );
    db.run('DELETE FROM task_messages WHERE task_id = ?', [task.id]);
    let sortOrder = 0;
    for (const msg of task.messages || []) {
      db.run(
        `INSERT INTO task_messages
          (id, task_id, type, content, tool_name, tool_input, timestamp, sort_order,
           tool_status, model_id, provider_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          msg.id,
          task.id,
          msg.type,
          msg.content,
          msg.toolName || null,
          msg.toolInput ? JSON.stringify(msg.toolInput) : null,
          msg.timestamp,
          sortOrder++,
          msg.toolStatus || null,
          msg.modelId || null,
          msg.providerId || null,
        ],
      );
      insertAttachments(db, msg.id, msg.attachments);
    }
    if (workspaceId) {
      db.run(
        `DELETE FROM tasks WHERE workspace_id = ? AND id NOT IN (
          SELECT id FROM tasks WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?
        )`,
        [workspaceId, workspaceId, MAX_HISTORY_ITEMS],
      );
    } else {
      db.run(
        `DELETE FROM tasks WHERE workspace_id IS NULL AND id NOT IN (
          SELECT id FROM tasks WHERE workspace_id IS NULL ORDER BY created_at DESC LIMIT ?
        )`,
        [MAX_HISTORY_ITEMS],
      );
    }
  });
  flushDatabase();
}

export function deleteTask(taskId: string): void {
  const db = getDatabase();
  db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
  flushDatabase();
}

export function clearHistory(): void {
  const db = getDatabase();
  db.run('DELETE FROM tasks');
  flushDatabase();
}
