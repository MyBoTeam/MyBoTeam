import type Database from 'better-sqlite3';
import { DatabaseError } from './errors.js';
import { type createChildLogger, logOperation } from './logger.js';

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export function seedDevAgents(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
): void {
  logOperation(log, 'seedDevAgents', () => {
    try {
      const existing = db.prepare('SELECT COUNT(*) as count FROM agent').get() as { count: number };
      if (existing.count > 0) return;
      const ts = now();
      db.prepare(
        `INSERT INTO agent (id, slug, provider, model, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      ).run(uuid(), 'secretary', 'anthropic', 'claude-sonnet-4-20250514', ts, ts);
      db.prepare(
        `INSERT INTO agent (id, slug, provider, model, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      ).run(uuid(), 'accountant', 'openai', 'gpt-4o', ts, ts);
    } catch (_error: unknown) {
      throw new DatabaseError('Failed to seed dev agents', 'SEED_ERROR');
    }
  });
}

export function seedTestMcpServers(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
): void {
  logOperation(log, 'seedTestMcpServers', () => {
    try {
      const existing = db.prepare('SELECT COUNT(*) as count FROM mcp_server').get() as {
        count: number;
      };
      if (existing.count > 0) return;
      const ts = now();
      db.prepare(
        `INSERT INTO mcp_server (id, name, command, args, env, status, created_at) VALUES (?, 'filesystem', 'npx', ?, ?, 'active', ?)`,
      ).run(uuid(), JSON.stringify(['-y', '@anthropic/mcp-filesystem']), JSON.stringify({}), ts);
      db.prepare(
        `INSERT INTO mcp_server (id, name, command, args, env, status, created_at) VALUES (?, 'github', 'npx', ?, ?, 'active', ?)`,
      ).run(uuid(), JSON.stringify(['-y', '@anthropic/mcp-github']), JSON.stringify({}), ts);
    } catch (_error: unknown) {
      throw new DatabaseError('Failed to seed test MCP servers', 'SEED_ERROR');
    }
  });
}

export function seedTestAgentAssignments(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
): void {
  logOperation(log, 'seedTestAgentAssignments', () => {
    try {
      const secretary = db.prepare('SELECT id FROM agent WHERE slug = ?').get('secretary') as
        | { id: string }
        | undefined;
      if (!secretary) return;
      const servers = db.prepare('SELECT id FROM mcp_server').all() as { id: string }[];
      const ts = now();
      for (const server of servers) {
        db.prepare(
          `INSERT OR IGNORE INTO agent_mcp_assignment (agent_id, mcp_server_id, assigned_at) VALUES (?, ?, ?)`,
        ).run(secretary.id, server.id, ts);
      }
    } catch (_error: unknown) {
      throw new DatabaseError('Failed to seed test agent assignments', 'SEED_ERROR');
    }
  });
}

export function seedTest(db: Database.Database, log: ReturnType<typeof createChildLogger>): void {
  seedDevAgents(db, log);
  seedTestMcpServers(db, log);
  seedTestAgentAssignments(db, log);
}

export function seedProduction(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
): void {
  logOperation(log, 'seedProduction', () => {
    try {
      const existing = db.prepare('SELECT COUNT(*) as count FROM agent').get() as { count: number };
      if (existing.count > 0) return;
      const ts = now();
      db.prepare(
        `INSERT INTO agent (id, slug, provider, model, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      ).run(uuid(), 'secretary', 'anthropic', 'claude-sonnet-4-20250514', ts, ts);
      db.prepare(
        `INSERT INTO agent (id, slug, provider, model, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      ).run(uuid(), 'accountant', 'openai', 'gpt-4o', ts, ts);
    } catch (_error: unknown) {
      throw new DatabaseError('Failed to seed production data', 'SEED_ERROR');
    }
  });
}
