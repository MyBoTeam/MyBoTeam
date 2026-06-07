import type { Workspace } from '../../common/types/workspace.js';
import { getDatabase } from '../database.js';
import { rowFromResult, rowsFromResult } from '../query-helpers.js';

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
