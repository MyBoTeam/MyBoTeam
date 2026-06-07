import type { TaskMessage } from '../../common/types/task.js';
import { flushDatabase, getDatabase, withTransaction } from '../database.js';
import { rowFromResult } from '../query-helpers.js';
import { insertAttachments } from './task-history-common.js';

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
