import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from '../../common/types/workspace.js';
import { flushDatabase, getDatabase } from '../database.js';
import { rowFromResult, rowsFromResult, valueFromResult } from '../query-helpers.js';

function rowToWorkspace(row: Record<string, unknown>): Workspace {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || undefined,
    color: (row.color as string) || undefined,
    isDefault: (row.is_default as number) === 1,
    order: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function getActiveWorkspaceId(): string | null {
  const db = getDatabase();
  const row = rowFromResult<{ value: string }>(
    db.exec("SELECT value FROM workspace_meta WHERE key = 'active_workspace_id'"),
  );
  return row?.value ?? null;
}

export function setActiveWorkspaceId(id: string): void {
  const db = getDatabase();
  db.run(
    `INSERT INTO workspace_meta (key, value) VALUES ('active_workspace_id', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [id],
  );
  flushDatabase();
}

function createWorkspaceId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createWorkspace(input: WorkspaceCreateInput): Workspace {
  const db = getDatabase();
  const id = createWorkspaceId();
  const now = new Date().toISOString();

  const maxOrder = valueFromResult<number>(
    db.exec('SELECT MAX(sort_order) as max_order FROM workspaces'),
  );
  const order = (maxOrder ?? -1) + 1;

  db.run(
    `INSERT INTO workspaces (id, name, description, color, sort_order, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, input.name, input.description || null, input.color || null, order, now, now],
  );
  flushDatabase();

  return getWorkspace(id)!;
}

export function createDefaultWorkspace(): Workspace {
  const db = getDatabase();
  const existing = getDefaultWorkspace();
  if (existing) {
    return existing;
  }

  const id = createWorkspaceId();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO workspaces (id, name, description, color, sort_order, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, 1, ?, ?)`,
    [id, 'Default', 'Your default workspace', null, now, now],
  );
  flushDatabase();

  return getWorkspace(id)!;
}

export function updateWorkspace(id: string, input: WorkspaceUpdateInput): Workspace | null {
  const db = getDatabase();
  const existing = getWorkspace(id);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const name = input.name ?? existing.name;
  const description = input.description !== undefined ? input.description : existing.description;
  const color = input.color !== undefined ? input.color : existing.color;
  const order = input.order ?? existing.order;

  db.run(
    `UPDATE workspaces SET name = ?, description = ?, color = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
    [name, description || null, color || null, order, now, id],
  );
  flushDatabase();

  return getWorkspace(id);
}

export function deleteWorkspace(id: string): boolean {
  const db = getDatabase();
  const workspace = getWorkspace(id);
  if (!workspace || workspace.isDefault) {
    return false;
  }

  db.run('DELETE FROM workspaces WHERE id = ?', [id]);
  flushDatabase();
  return true;
}

export function listWorkspaces(): Workspace[] {
  const db = getDatabase();
  const rows = rowsFromResult<Record<string, unknown>>(
    db.exec('SELECT * FROM workspaces ORDER BY sort_order ASC, created_at ASC'),
  );
  return rows.map(rowToWorkspace);
}

export function getWorkspace(id: string): Workspace | null {
  const db = getDatabase();
  const row = rowFromResult<Record<string, unknown>>(
    db.exec('SELECT * FROM workspaces WHERE id = ?', [id]),
  );
  return row ? rowToWorkspace(row) : null;
}

export function getDefaultWorkspace(): Workspace | null {
  const db = getDatabase();
  const row = rowFromResult<Record<string, unknown>>(
    db.exec('SELECT * FROM workspaces WHERE is_default = 1'),
  );
  return row ? rowToWorkspace(row) : null;
}
