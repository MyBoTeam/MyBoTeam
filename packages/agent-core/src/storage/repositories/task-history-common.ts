import type { TaskMessage } from '../../common/types/task.js';
import type { getDatabase } from '../database.js';

export function insertAttachments(
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
