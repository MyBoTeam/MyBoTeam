import type { Database } from '../database.js';

export function v002ThemeColor(db: Database): void {
  db.exec(`
    ALTER TABLE app_settings ADD COLUMN theme_color TEXT NOT NULL DEFAULT 'neutral';
  `);
}
