import type { Database } from '../database.js';
import {
  createAllIndexes,
  createAppSettingsTable,
  createConnectorsTable,
  createGoogleAccountsTable,
  createKnowledgeNotesTable,
  createMyboteamAiCreditsTable,
  createProviderMetaTable,
  createProvidersTable,
  createScheduledTasksTable,
  createSchemaMetaTable,
  createSkillsTable,
  createTaskFavoritesTable,
  createTasksTables,
  createWorkspacesTables,
} from './v001-init-tables.js';

export function v001Init(db: Database): void {
  createSchemaMetaTable(db);
  createAppSettingsTable(db);
  createProviderMetaTable(db);
  createProvidersTable(db);
  createTasksTables(db);
  createSkillsTable(db);
  createConnectorsTable(db);
  createTaskFavoritesTable(db);
  createScheduledTasksTable(db);
  createMyboteamAiCreditsTable(db);
  createGoogleAccountsTable(db);
  createWorkspacesTables(db);
  createKnowledgeNotesTable(db);
  createAllIndexes(db);

  db.run(
    'INSERT OR IGNORE INTO app_settings (id, debug_mode, onboarding_complete) VALUES (?, ?, ?)',
    [1, 0, 0],
  );
  db.run('INSERT OR IGNORE INTO provider_meta (id, debug_mode) VALUES (?, ?)', [1, 0]);
}
