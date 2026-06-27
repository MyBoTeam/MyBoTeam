import type { Schedule, ScheduleFilters } from '@myboteam/types';
import type Database from 'better-sqlite3';
import { NotFoundError } from '../errors.js';
import { type createChildLogger, logOperation } from '../logger.js';

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export function createSchedule(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  data: {
    name: string;
    type: string;
    expression: string;
    agent_id: string;
    task_id?: string;
    status?: string;
  },
): Schedule {
  return logOperation(
    log,
    'createSchedule',
    () => {
      const id = uuid();
      const ts = now();
      db.prepare(
        `INSERT INTO schedule (id, name, type, expression, status, agent_id, task_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        data.name,
        data.type,
        data.expression,
        data.status ?? 'active',
        data.agent_id,
        data.task_id ?? null,
        ts,
        ts,
      );
      return getSchedule(db, log, id)!;
    },
    { name: data.name },
  );
}

export function getSchedule(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): Schedule | null {
  return logOperation(
    log,
    'getSchedule',
    () => {
      const row = db.prepare('SELECT * FROM schedule WHERE id = ?').get(id) as Schedule | undefined;
      return row ?? null;
    },
    { id },
  );
}

export function listSchedules(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  filters?: ScheduleFilters,
): Schedule[] {
  return logOperation(
    log,
    'listSchedules',
    () => {
      if (filters?.agent_id) {
        return db
          .prepare('SELECT * FROM schedule WHERE agent_id = ? ORDER BY created_at')
          .all(filters.agent_id) as Schedule[];
      }
      return db.prepare('SELECT * FROM schedule ORDER BY created_at').all() as Schedule[];
    },
    { filters },
  );
}

export function updateSchedule(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
  data: { name?: string; expression?: string; status?: string },
): Schedule {
  return logOperation(
    log,
    'updateSchedule',
    () => {
      const existing = getSchedule(db, log, id);
      if (!existing) throw new NotFoundError('Schedule', id);
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
      db.prepare(`UPDATE schedule SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      return getSchedule(db, log, id)!;
    },
    { id },
  );
}

export function deleteSchedule(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): void {
  logOperation(
    log,
    'deleteSchedule',
    () => {
      const existing = getSchedule(db, log, id);
      if (!existing) throw new NotFoundError('Schedule', id);
      db.prepare('DELETE FROM schedule WHERE id = ?').run(id);
    },
    { id },
  );
}
