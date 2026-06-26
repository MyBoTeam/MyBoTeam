import type Database from 'better-sqlite3';
import type { Agent } from '../../types/entities.js';
import { NotFoundError, ValidationError } from '../errors.js';
import { type createChildLogger, logOperation } from '../logger.js';

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export function createAgent(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  data: { slug: string; provider: string; model: string; status?: string },
): Agent {
  return logOperation(
    log,
    'createAgent',
    () => {
      const id = uuid();
      const ts = now();
      const status = data.status ?? 'active';
      db.prepare(
        `INSERT INTO agent (id, slug, provider, model, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, data.slug, data.provider, data.model, status, ts, ts);
      return getAgent(db, log, id)!;
    },
    { slug: data.slug },
  );
}

export function getAgent(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): Agent | null {
  return logOperation(
    log,
    'getAgent',
    () => {
      const row = db.prepare('SELECT * FROM agent WHERE id = ?').get(id) as Agent | undefined;
      return row ?? null;
    },
    { id },
  );
}

export function getAgentBySlug(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  slug: string,
): Agent | null {
  return logOperation(
    log,
    'getAgentBySlug',
    () => {
      const row = db.prepare('SELECT * FROM agent WHERE slug = ?').get(slug) as Agent | undefined;
      return row ?? null;
    },
    { slug },
  );
}

export function listAgents(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
): Agent[] {
  return logOperation(log, 'listAgents', () => {
    return db.prepare('SELECT * FROM agent ORDER BY created_at').all() as Agent[];
  });
}

export function updateAgent(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
  data: Partial<Omit<Agent, 'id' | 'created_at'>>,
): Agent {
  return logOperation(
    log,
    'updateAgent',
    () => {
      const existing = getAgent(db, log, id);
      if (!existing) throw new NotFoundError('Agent', id);
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
      db.prepare(`UPDATE agent SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      return getAgent(db, log, id)!;
    },
    { id },
  );
}

export function deleteAgent(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): void {
  logOperation(
    log,
    'deleteAgent',
    () => {
      const existing = getAgent(db, log, id);
      if (!existing) throw new NotFoundError('Agent', id);
      const activeTasks = db
        .prepare(
          "SELECT COUNT(*) as count FROM task WHERE agent_id = ? AND status NOT IN ('completed', 'failed', 'max_retries')",
        )
        .get(id) as { count: number };
      if (activeTasks.count > 0) {
        throw new ValidationError('agent_id', id, 'Cannot delete agent with active tasks');
      }
      db.prepare('DELETE FROM agent WHERE id = ?').run(id);
    },
    { id },
  );
}
