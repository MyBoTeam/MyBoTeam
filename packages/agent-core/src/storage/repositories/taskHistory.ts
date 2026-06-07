import type { Task, TaskMessage, TaskStatus } from '../../common/types/task.js';
import { flushDatabase, getDatabase, withTransaction } from '../database.js';
import { rowFromResult, rowsFromResult } from '../query-helpers.js';
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

function insertAttachments(
  db: ReturnType<typeof getDatabase>,
  messageId: string,
  attachments: TaskMessage['attachments'],
): void {
  if (!attachments?.length) return;
  for (const att of attachments) {
    db.run(`INSERT INTO task_attachments (message_id, type, data, label) VALUES (?, ?, ?, ?)`, [
      messageId,
      att.type,
      att.data,
      att.label || null,
    ]);
  }
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

export function updateTaskStatus(taskId: string, status: TaskStatus, completedAt?: string): void {
  const db = getDatabase();
  const completedAtClause = completedAt ? ', completed_at = ?' : '';
  const params = completedAt ? [status, completedAt, taskId] : [status, taskId];
  db.run(`UPDATE tasks SET status = ?${completedAtClause} WHERE id = ?`, params);
  flushDatabase();
}

export function addTaskMessage(taskId: string, message: TaskMessage): void {
  const db = getDatabase();
  withTransaction(db, () => {
    const maxOrder = rowFromResult<{ max: number | null }>(
      db.exec('SELECT MAX(sort_order) as max FROM task_messages WHERE task_id = ?', [taskId]),
    );
    const sortOrder = (maxOrder?.max ?? -1) + 1;
    db.run(
      `INSERT INTO task_messages
        (id, task_id, type, content, tool_name, tool_input, timestamp, sort_order,
         tool_status, model_id, provider_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        tool_name = excluded.tool_name,
        tool_input = excluded.tool_input,
        tool_status = excluded.tool_status,
        model_id = excluded.model_id,
        provider_id = excluded.provider_id`,
      [
        message.id,
        taskId,
        message.type,
        message.content,
        message.toolName || null,
        message.toolInput ? JSON.stringify(message.toolInput) : null,
        message.timestamp,
        sortOrder,
        message.toolStatus || null,
        message.modelId || null,
        message.providerId || null,
      ],
    );
    db.run('DELETE FROM task_attachments WHERE message_id = ?', [message.id]);
    insertAttachments(db, message.id, message.attachments);
  });
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

export function setMaxHistoryItems(_max: number): void {}
export function clearTaskHistoryStore(): void {
  clearHistory();
}
export function flushPendingTasks(): void {}
