import type { AgentMcpAssignment, McpServer } from '@myboteam/types';
import type Database from 'better-sqlite3';
import { NotFoundError } from '../errors.js';
import { type createChildLogger, logOperation } from '../logger.js';

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export function createMcpServer(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  data: {
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
    status?: string;
  },
): McpServer {
  return logOperation(
    log,
    'createMcpServer',
    () => {
      const id = uuid();
      const ts = now();
      db.prepare(
        `INSERT INTO mcp_server (id, name, command, args, env, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        data.name,
        data.command,
        JSON.stringify(data.args ?? []),
        JSON.stringify(data.env ?? {}),
        data.status ?? 'active',
        ts,
      );
      return getMcpServer(db, log, id)!;
    },
    { name: data.name },
  );
}

export function getMcpServer(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): McpServer | null {
  return logOperation(
    log,
    'getMcpServer',
    () => {
      const row = db.prepare('SELECT * FROM mcp_server WHERE id = ?').get(id) as
        | McpServer
        | undefined;
      if (row) {
        row.args = JSON.parse(row.args as unknown as string);
        row.env = JSON.parse(row.env as unknown as string);
      }
      return row ?? null;
    },
    { id },
  );
}

export function getMcpServerByName(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  name: string,
): McpServer | null {
  return logOperation(
    log,
    'getMcpServerByName',
    () => {
      const row = db.prepare('SELECT * FROM mcp_server WHERE name = ?').get(name) as
        | McpServer
        | undefined;
      if (row) {
        row.args = JSON.parse(row.args as unknown as string);
        row.env = JSON.parse(row.env as unknown as string);
      }
      return row ?? null;
    },
    { name },
  );
}

export function listMcpServers(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
): McpServer[] {
  return logOperation(log, 'listMcpServers', () => {
    const rows = db.prepare('SELECT * FROM mcp_server ORDER BY created_at').all() as McpServer[];
    return rows.map((r) => ({
      ...r,
      args: JSON.parse(r.args as unknown as string),
      env: JSON.parse(r.env as unknown as string),
    }));
  });
}

export function updateMcpServer(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
  data: { name?: string; command?: string; status?: string },
): McpServer {
  return logOperation(
    log,
    'updateMcpServer',
    () => {
      const existing = getMcpServer(db, log, id);
      if (!existing) throw new NotFoundError('McpServer', id);
      const fields: string[] = [];
      const values: unknown[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      values.push(id);
      db.prepare(`UPDATE mcp_server SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      return getMcpServer(db, log, id)!;
    },
    { id },
  );
}

export function deleteMcpServer(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): void {
  logOperation(
    log,
    'deleteMcpServer',
    () => {
      const existing = getMcpServer(db, log, id);
      if (!existing) throw new NotFoundError('McpServer', id);
      db.prepare('DELETE FROM mcp_server WHERE id = ?').run(id);
    },
    { id },
  );
}

export function assignMcpServer(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  agentId: string,
  mcpServerId: string,
): AgentMcpAssignment {
  return logOperation(
    log,
    'assignMcpServer',
    () => {
      const ts = now();
      db.prepare(
        `INSERT OR IGNORE INTO agent_mcp_assignment (agent_id, mcp_server_id, assigned_at) VALUES (?, ?, ?)`,
      ).run(agentId, mcpServerId, ts);
      return { agent_id: agentId, mcp_server_id: mcpServerId, assigned_at: ts };
    },
    { agentId, mcpServerId },
  );
}

export function unassignMcpServer(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  agentId: string,
  mcpServerId: string,
): void {
  logOperation(
    log,
    'unassignMcpServer',
    () => {
      db.prepare('DELETE FROM agent_mcp_assignment WHERE agent_id = ? AND mcp_server_id = ?').run(
        agentId,
        mcpServerId,
      );
    },
    { agentId, mcpServerId },
  );
}

export function listAgentMcpAssignments(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  agentId: string,
): AgentMcpAssignment[] {
  return logOperation(
    log,
    'listAgentMcpAssignments',
    () => {
      return db
        .prepare('SELECT * FROM agent_mcp_assignment WHERE agent_id = ? ORDER BY assigned_at')
        .all(agentId) as AgentMcpAssignment[];
    },
    { agentId },
  );
}

export function listMcpServerAssignments(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  mcpServerId: string,
): AgentMcpAssignment[] {
  return logOperation(
    log,
    'listMcpServerAssignments',
    () => {
      return db
        .prepare('SELECT * FROM agent_mcp_assignment WHERE mcp_server_id = ? ORDER BY assigned_at')
        .all(mcpServerId) as AgentMcpAssignment[];
    },
    { mcpServerId },
  );
}
