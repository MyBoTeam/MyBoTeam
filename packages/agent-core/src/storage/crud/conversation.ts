import type Database from 'better-sqlite3';
import type { Conversation, Message } from '../../types/entities.js';
import type { ConversationFilters, MessageFilters } from '../../types/queries.js';
import { NotFoundError } from '../errors.js';
import { type createChildLogger, logOperation } from '../logger.js';

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export function createConversation(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  data: { agent_id: string; title: string },
): Conversation {
  return logOperation(
    log,
    'createConversation',
    () => {
      const id = uuid();
      const ts = now();
      db.prepare(
        `INSERT INTO conversation (id, agent_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      ).run(id, data.agent_id, data.title, ts, ts);
      return getConversation(db, log, id)!;
    },
    { agent_id: data.agent_id },
  );
}

export function getConversation(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): Conversation | null {
  return logOperation(
    log,
    'getConversation',
    () => {
      const row = db.prepare('SELECT * FROM conversation WHERE id = ?').get(id) as
        | Conversation
        | undefined;
      return row ?? null;
    },
    { id },
  );
}

export function listConversations(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  filters?: ConversationFilters,
): Conversation[] {
  return logOperation(
    log,
    'listConversations',
    () => {
      if (filters?.agent_id) {
        return db
          .prepare('SELECT * FROM conversation WHERE agent_id = ? ORDER BY created_at')
          .all(filters.agent_id) as Conversation[];
      }
      return db.prepare('SELECT * FROM conversation ORDER BY created_at').all() as Conversation[];
    },
    { filters },
  );
}

export function updateConversation(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
  data: { title?: string },
): Conversation {
  return logOperation(
    log,
    'updateConversation',
    () => {
      const existing = getConversation(db, log, id);
      if (!existing) throw new NotFoundError('Conversation', id);
      const ts = now();
      const fields: string[] = [];
      const values: unknown[] = [];
      if (data.title !== undefined) {
        fields.push('title = ?');
        values.push(data.title);
      }
      fields.push('updated_at = ?');
      values.push(ts);
      values.push(id);
      db.prepare(`UPDATE conversation SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      return getConversation(db, log, id)!;
    },
    { id },
  );
}

export function deleteConversation(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): void {
  logOperation(
    log,
    'deleteConversation',
    () => {
      const existing = getConversation(db, log, id);
      if (!existing) throw new NotFoundError('Conversation', id);
      db.prepare('DELETE FROM conversation WHERE id = ?').run(id);
    },
    { id },
  );
}

export function createMessage(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  data: { conversation_id: string; role: string; content: string },
): Message {
  return logOperation(
    log,
    'createMessage',
    () => {
      const id = uuid();
      const ts = now();
      db.prepare(
        `INSERT INTO message (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`,
      ).run(id, data.conversation_id, data.role, data.content, ts);
      return getMessage(db, log, id)!;
    },
    { conversation_id: data.conversation_id },
  );
}

export function getMessage(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): Message | null {
  return logOperation(
    log,
    'getMessage',
    () => {
      const row = db.prepare('SELECT * FROM message WHERE id = ?').get(id) as Message | undefined;
      return row ?? null;
    },
    { id },
  );
}

export function listMessages(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  filters: MessageFilters,
): Message[] {
  return logOperation(
    log,
    'listMessages',
    () => {
      return db
        .prepare('SELECT * FROM message WHERE conversation_id = ? ORDER BY created_at')
        .all(filters.conversation_id) as Message[];
    },
    { filters },
  );
}

export function deleteMessage(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): void {
  logOperation(
    log,
    'deleteMessage',
    () => {
      const existing = getMessage(db, log, id);
      if (!existing) throw new NotFoundError('Message', id);
      db.prepare('DELETE FROM message WHERE id = ?').run(id);
    },
    { id },
  );
}
