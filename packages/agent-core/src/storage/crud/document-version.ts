import type { DocumentVersion, DocumentVersionFilters } from '@myboteam/types';
import type Database from 'better-sqlite3';
import { NotFoundError, ValidationError } from '../errors.js';
import { type createChildLogger, logOperation } from '../logger.js';

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export function createDocumentVersion(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  data: { file_path: string; content: string; model: string; version: number },
): DocumentVersion {
  return logOperation(
    log,
    'createDocumentVersion',
    () => {
      if (data.version < 1) {
        throw new ValidationError(
          'version',
          String(data.version),
          'Version must be a positive integer',
        );
      }
      const id = uuid();
      const ts = now();
      db.prepare(
        `INSERT INTO document_version (id, file_path, content, model, version, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(id, data.file_path, data.content, data.model, data.version, ts);
      return getDocumentVersion(db, log, id)!;
    },
    { file_path: data.file_path },
  );
}

export function getDocumentVersion(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): DocumentVersion | null {
  return logOperation(
    log,
    'getDocumentVersion',
    () => {
      const row = db.prepare('SELECT * FROM document_version WHERE id = ?').get(id) as
        | DocumentVersion
        | undefined;
      return row ?? null;
    },
    { id },
  );
}

export function listDocumentVersions(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  filters: DocumentVersionFilters,
): DocumentVersion[] {
  return logOperation(
    log,
    'listDocumentVersions',
    () => {
      return db
        .prepare('SELECT * FROM document_version WHERE file_path = ? ORDER BY version DESC')
        .all(filters.file_path) as DocumentVersion[];
    },
    { filters },
  );
}

export function deleteDocumentVersion(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): void {
  logOperation(
    log,
    'deleteDocumentVersion',
    () => {
      const existing = getDocumentVersion(db, log, id);
      if (!existing) throw new NotFoundError('DocumentVersion', id);
      db.prepare('DELETE FROM document_version WHERE id = ?').run(id);
    },
    { id },
  );
}
