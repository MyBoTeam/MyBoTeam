import { flushDatabase, getDatabase } from '../database.js';
import { rowFromResult } from '../query-helpers.js';

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
