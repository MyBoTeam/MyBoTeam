import type { StoredFavorite } from '../../types/storage.js';
import { flushDatabase, getDatabase } from '../database.js';
import { rowFromResult, rowsFromResult } from '../query-helpers.js';

export function addFavorite(taskId: string, prompt: string, summary?: string): void {
  const db = getDatabase();
  const favoritedAt = new Date().toISOString();
  db.run(
    `INSERT OR REPLACE INTO task_favorites (task_id, prompt, summary, favorited_at)
     VALUES (?, ?, ?, ?)`,
    [taskId, prompt, summary ?? null, favoritedAt],
  );
  flushDatabase();
}

export function removeFavorite(taskId: string): void {
  const db = getDatabase();
  db.run('DELETE FROM task_favorites WHERE task_id = ?', [taskId]);
  flushDatabase();
}

export function getFavorites(): StoredFavorite[] {
  const db = getDatabase();
  const rows = rowsFromResult<{
    task_id: string;
    prompt: string;
    summary: string | null;
    favorited_at: string;
  }>(
    db.exec(
      `SELECT task_id, prompt, summary, favorited_at
     FROM task_favorites
     ORDER BY favorited_at DESC`,
    ),
  );
  return rows.map((row) => ({
    taskId: row.task_id,
    prompt: row.prompt,
    summary: row.summary ?? undefined,
    favoritedAt: row.favorited_at,
  }));
}

export function isFavorite(taskId: string): boolean {
  const db = getDatabase();
  const row = rowFromResult(db.exec('SELECT 1 FROM task_favorites WHERE task_id = ?', [taskId]));
  return !!row;
}
