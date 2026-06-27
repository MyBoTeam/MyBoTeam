import type { Note, NoteFilters } from '@myboteam/types';
import type Database from 'better-sqlite3';
import { NotFoundError } from '../errors.js';
import { type createChildLogger, logOperation } from '../logger.js';

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export function createNote(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  data: { title: string; type?: string; content?: string; pinned?: number },
): Note {
  return logOperation(
    log,
    'createNote',
    () => {
      const id = uuid();
      const ts = now();
      db.prepare(
        `INSERT INTO note (id, title, type, content, pinned, archived, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?)`,
      ).run(id, data.title, data.type ?? 'text', data.content ?? '', data.pinned ?? 0, ts, ts);
      return getNote(db, log, id)!;
    },
    { title: data.title },
  );
}

export function getNote(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): Note | null {
  return logOperation(
    log,
    'getNote',
    () => {
      const row = db.prepare('SELECT * FROM note WHERE id = ?').get(id) as Note | undefined;
      return row ?? null;
    },
    { id },
  );
}

export function listNotes(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  filters?: NoteFilters,
): Note[] {
  return logOperation(
    log,
    'listNotes',
    () => {
      let sql = 'SELECT * FROM note';
      const conditions: string[] = [];
      const values: unknown[] = [];
      if (filters?.archived !== undefined) {
        conditions.push('archived = ?');
        values.push(filters.archived ? 1 : 0);
      }
      if (filters?.type) {
        conditions.push('type = ?');
        values.push(filters.type);
      }
      if (filters?.pinned !== undefined) {
        conditions.push('pinned = ?');
        values.push(filters.pinned ? 1 : 0);
      }
      if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
      sql += ' ORDER BY created_at';
      return db.prepare(sql).all(...values) as Note[];
    },
    { filters },
  );
}

export function updateNote(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
  data: { title?: string; content?: string; pinned?: number; archived?: number },
): Note {
  return logOperation(
    log,
    'updateNote',
    () => {
      const existing = getNote(db, log, id);
      if (!existing) throw new NotFoundError('Note', id);
      const ts = now();
      const fields: string[] = [];
      const values: unknown[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      fields.push('updated_at = ?');
      values.push(ts);
      values.push(id);
      db.prepare(`UPDATE note SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      return getNote(db, log, id)!;
    },
    { id },
  );
}

export function deleteNote(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): void {
  logOperation(
    log,
    'deleteNote',
    () => {
      const existing = getNote(db, log, id);
      if (!existing) throw new NotFoundError('Note', id);
      db.prepare('DELETE FROM note WHERE id = ?').run(id);
    },
    { id },
  );
}
