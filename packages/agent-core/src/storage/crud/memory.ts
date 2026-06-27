import type { MemoryEntry, MemoryEntryFilters } from '@myboteam/types';
import type Database from 'better-sqlite3';
import { NotFoundError } from '../errors.js';
import { type createChildLogger, logOperation } from '../logger.js';

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export function createMemoryEntry(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  data: {
    agent_id: string;
    category: string;
    content: string;
    confidence?: number;
    source?: string;
  },
): MemoryEntry {
  return logOperation(
    log,
    'createMemoryEntry',
    () => {
      const id = uuid();
      const ts = now();
      db.prepare(
        `INSERT INTO memory_entry (id, agent_id, category, content, confidence, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        data.agent_id,
        data.category,
        data.content,
        data.confidence ?? 1.0,
        data.source ?? 'manual',
        ts,
        ts,
      );
      return getMemoryEntry(db, log, id)!;
    },
    { agent_id: data.agent_id },
  );
}

export function getMemoryEntry(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): MemoryEntry | null {
  return logOperation(
    log,
    'getMemoryEntry',
    () => {
      const row = db.prepare('SELECT * FROM memory_entry WHERE id = ?').get(id) as
        | MemoryEntry
        | undefined;
      return row ?? null;
    },
    { id },
  );
}

export function listMemoryEntries(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  filters?: MemoryEntryFilters,
): MemoryEntry[] {
  return logOperation(
    log,
    'listMemoryEntries',
    () => {
      let sql = 'SELECT * FROM memory_entry';
      const conditions: string[] = [];
      const values: string[] = [];
      if (filters?.agent_id) {
        conditions.push('agent_id = ?');
        values.push(filters.agent_id);
      }
      if (filters?.category) {
        conditions.push('category = ?');
        values.push(filters.category);
      }
      if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
      sql += ' ORDER BY created_at';
      return db.prepare(sql).all(...values) as MemoryEntry[];
    },
    { filters },
  );
}

export function updateMemoryEntry(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
  data: { content?: string; confidence?: number; category?: string },
): MemoryEntry {
  return logOperation(
    log,
    'updateMemoryEntry',
    () => {
      const existing = getMemoryEntry(db, log, id);
      if (!existing) throw new NotFoundError('MemoryEntry', id);
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
      db.prepare(`UPDATE memory_entry SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      return getMemoryEntry(db, log, id)!;
    },
    { id },
  );
}

export function deleteMemoryEntry(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): void {
  logOperation(
    log,
    'deleteMemoryEntry',
    () => {
      const existing = getMemoryEntry(db, log, id);
      if (!existing) throw new NotFoundError('MemoryEntry', id);
      db.prepare('DELETE FROM memory_entry WHERE id = ?').run(id);
    },
    { id },
  );
}
