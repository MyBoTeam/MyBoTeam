import type {
  KnowledgeNote,
  KnowledgeNoteCreateInput,
  KnowledgeNoteType,
  KnowledgeNoteUpdateInput,
} from '../../common/types/workspace.js';
import { flushDatabase, getDatabase } from '../database.js';
import { rowFromResult, rowsFromResult, valueFromResult } from '../query-helpers.js';

const MAX_NOTES_PER_WORKSPACE = 20;
const MAX_CONTENT_LENGTH = 500;

function createNoteId(): string {
  return `kn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function rowToNote(row: Record<string, unknown>): KnowledgeNote {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    type: row.type as KnowledgeNoteType,
    content: row.content as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function listKnowledgeNotes(workspaceId: string): KnowledgeNote[] {
  const db = getDatabase();
  const rows = rowsFromResult<Record<string, unknown>>(
    db.exec('SELECT * FROM knowledge_notes WHERE workspace_id = ? ORDER BY created_at ASC', [
      workspaceId,
    ]),
  );
  return rows.map(rowToNote);
}

export function getKnowledgeNote(id: string, workspaceId: string): KnowledgeNote | null {
  const db = getDatabase();
  const row = rowFromResult<Record<string, unknown>>(
    db.exec('SELECT * FROM knowledge_notes WHERE id = ? AND workspace_id = ?', [id, workspaceId]),
  );
  return row ? rowToNote(row) : null;
}

export function createKnowledgeNote(input: KnowledgeNoteCreateInput): KnowledgeNote {
  const db = getDatabase();

  const count = valueFromResult<number>(
    db.exec('SELECT COUNT(*) as cnt FROM knowledge_notes WHERE workspace_id = ?', [
      input.workspaceId,
    ]),
  );
  if ((count ?? 0) >= MAX_NOTES_PER_WORKSPACE) {
    throw new Error(`Maximum of ${MAX_NOTES_PER_WORKSPACE} notes per workspace`);
  }

  const content = input.content.slice(0, MAX_CONTENT_LENGTH);
  const id = createNoteId();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO knowledge_notes (id, workspace_id, type, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.workspaceId, input.type, content, now, now],
  );
  flushDatabase();

  return getKnowledgeNote(id, input.workspaceId)!;
}

export function updateKnowledgeNote(
  id: string,
  workspaceId: string,
  input: KnowledgeNoteUpdateInput,
): KnowledgeNote | null {
  const db = getDatabase();
  const existing = getKnowledgeNote(id, workspaceId);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const type = input.type ?? existing.type;
  const content =
    input.content !== undefined ? input.content.slice(0, MAX_CONTENT_LENGTH) : existing.content;

  db.run('UPDATE knowledge_notes SET type = ?, content = ?, updated_at = ? WHERE id = ?', [
    type,
    content,
    now,
    id,
  ]);
  flushDatabase();

  return getKnowledgeNote(id, workspaceId);
}

export function deleteKnowledgeNote(id: string, workspaceId: string): boolean {
  const db = getDatabase();
  db.run('DELETE FROM knowledge_notes WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
  const deleted = db.getRowsModified() > 0;
  flushDatabase();
  return deleted;
}
