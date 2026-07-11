import {
  type AgentConfig,
  AgentConfigSchema,
  type AgentStatus,
  VALID_TRANSITIONS,
} from '@myboteam/types';
import type Database from 'better-sqlite3';
import { Logger } from './daemon/lifecycle/logger.js';

const TABLE = 'agent_registry';
const MAX_AGENTS = 20;

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

interface AgentRow {
  id: string;
  name: string;
  description: string | null;
  role: string | null;
  model: string;
  provider: string;
  params: string | null;
  secrets: string | null;
  skills: string | null;
  mcps: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToConfig(row: AgentRow): AgentConfig {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    role: row.role ?? undefined,
    model: row.model,
    provider: row.provider,
    params: row.params ? JSON.parse(row.params) : undefined,
    secrets: row.secrets ? JSON.parse(row.secrets) : [],
    skills: row.skills ? JSON.parse(row.skills) : [],
    mcps: row.mcps ? JSON.parse(row.mcps) : [],
  };
}

export class AgentRegistry {
  private readonly logger = new Logger('AgentRegistry');

  constructor(private readonly db: Database.Database) {}

  ensureTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        role TEXT,
        model TEXT NOT NULL,
        provider TEXT NOT NULL,
        params TEXT,
        secrets TEXT,
        skills TEXT,
        mcps TEXT,
        status TEXT NOT NULL DEFAULT 'idle',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  register(config: Omit<AgentConfig, 'id'>): AgentConfig {
    const result = AgentConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.issues.map((i) => i.message).join(', ')}`);
    }
    const data = result.data;

    const ts = now();
    const id = uuid();

    // Check capacity limit
    const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${TABLE}`).get() as {
      count: number;
    };
    if (count.count >= MAX_AGENTS) {
      throw new Error(`Agent capacity reached (${MAX_AGENTS} maximum)`);
    }

    // Check unique name
    const existingName = this.db.prepare(`SELECT id FROM ${TABLE} WHERE name = ?`).get(data.name);
    if (existingName) {
      throw new Error(`Agent with name '${data.name}' already exists`);
    }

    const row = {
      id,
      name: data.name,
      description: data.description ?? null,
      role: data.role ?? null,
      model: data.model,
      provider: data.provider,
      params: data.params ? JSON.stringify(data.params) : null,
      secrets: data.secrets ? JSON.stringify(data.secrets) : null,
      skills: data.skills ? JSON.stringify(data.skills) : null,
      mcps: data.mcps ? JSON.stringify(data.mcps) : null,
      created_at: ts,
      updated_at: ts,
    };

    this.db
      .prepare(
        `INSERT INTO ${TABLE} (id, name, description, role, model, provider, params, secrets, skills, mcps, created_at, updated_at)
         VALUES (@id, @name, @description, @role, @model, @provider, @params, @secrets, @skills, @mcps, @created_at, @updated_at)`,
      )
      .run(row);

    this.logger.info('Agent registered', { id, operation: 'register', timestamp: ts });

    return this.getById(id) as AgentConfig;
  }

  list(): AgentConfig[] {
    const rows = this.db.prepare(`SELECT * FROM ${TABLE} ORDER BY created_at`).all() as AgentRow[];
    return rows.map(rowToConfig);
  }

  getById(id: string): AgentConfig | null {
    const row = this.db.prepare(`SELECT * FROM ${TABLE} WHERE id = ?`).get(id) as
      | AgentRow
      | undefined;
    return row ? rowToConfig(row) : null;
  }

  update(id: string, partial: Partial<AgentConfig>): AgentConfig {
    const existing = this.getById(id);
    if (!existing) {
      throw new Error(`AgentConfig with id '${id}' not found`);
    }

    // Validate partial config with Zod
    const merged = { ...existing, ...partial };
    const result = AgentConfigSchema.safeParse(merged);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.issues.map((i) => i.message).join(', ')}`);
    }
    const data = result.data;

    // Check unique name if being updated
    if ('name' in partial) {
      const existingName = this.db
        .prepare(`SELECT id FROM ${TABLE} WHERE name = ? AND id != ?`)
        .get(data.name, id);
      if (existingName) {
        throw new Error(`Agent with name '${data.name}' already exists`);
      }
    }

    const ts = now();
    const fields: string[] = [];
    const values: unknown[] = [];

    const scalarFields: Array<keyof AgentConfig> = [
      'name',
      'description',
      'role',
      'model',
      'provider',
    ];

    for (const field of scalarFields) {
      if (field in partial) {
        const val = data[field];
        fields.push(`${field} = ?`);
        values.push(val === undefined ? null : val);
      }
    }

    const jsonFields: Array<{ key: keyof AgentConfig; value: unknown }> = [
      { key: 'params', value: data.params },
      { key: 'secrets', value: data.secrets },
      { key: 'skills', value: data.skills },
      { key: 'mcps', value: data.mcps },
    ];

    for (const { key, value } of jsonFields) {
      if (key in partial) {
        fields.push(`${key} = ?`);
        values.push(value === undefined ? null : JSON.stringify(value));
      }
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = ?');
    values.push(ts);
    values.push(id);

    this.db.prepare(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    this.logger.info('Agent updated', { id, operation: 'update', timestamp: ts });

    return this.getById(id) as AgentConfig;
  }

  delete(id: string): void {
    const existing = this.getById(id);
    if (!existing) {
      throw new Error(`AgentConfig with id '${id}' not found`);
    }
    this.db.prepare(`DELETE FROM ${TABLE} WHERE id = ?`).run(id);
    this.logger.info('Agent deleted', { id, operation: 'delete', timestamp: now() });
  }

  loadAll(): AgentConfig[] {
    return this.list();
  }

  getStatus(id: string): AgentStatus | null {
    const row = this.db.prepare(`SELECT status FROM ${TABLE} WHERE id = ?`).get(id) as
      | { status: string }
      | undefined;
    return row ? (row.status as AgentStatus) : null;
  }

  setStatus(id: string, newStatus: AgentStatus): void {
    const currentStatus = this.getStatus(id);
    if (!currentStatus) {
      throw new Error(`AgentConfig with id '${id}' not found`);
    }

    // Validate status value
    const validStatuses = Object.keys(VALID_TRANSITIONS) as AgentStatus[];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: '${newStatus}'`);
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[currentStatus as AgentStatus];
    if (!allowed?.includes(newStatus)) {
      throw new Error(`Invalid transition: ${currentStatus} → ${newStatus}`);
    }

    const ts = now();
    this.db
      .prepare(`UPDATE ${TABLE} SET status = ?, updated_at = ? WHERE id = ?`)
      .run(newStatus, ts, id);
    this.logger.info('Agent status changed', {
      id,
      operation: 'setStatus',
      from: currentStatus,
      to: newStatus,
      timestamp: ts,
    });
  }
}
