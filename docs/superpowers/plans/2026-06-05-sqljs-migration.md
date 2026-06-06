# sql.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace better-sqlite3 with sql.js, consolidate 31 migrations into one init migration, remove legacy import code, and convert the storage layer to use sql.js's API directly.

**Architecture:** Direct sql.js API (no wrapper). All `StorageAPI` methods become async. Repository functions use sql.js's `db.exec()`, `db.run()`, and `withTransaction()` helper instead of better-sqlite3's `.prepare().get()/.all()/.run()` and `.transaction()`. Persistence via debounced flush-on-write pattern.

**Tech Stack:** sql.js (WASM SQLite), TypeScript, Node.js fs for persistence, Vitest for testing

**Spec:** `docs/superpowers/specs/2026-06-05-sqljs-migration-design.md`

---

## Task Sequence

Tasks are ordered by dependency. Each task produces a commit-ready change that compiles and (where applicable) passes tests.

---

### Task 1: Swap Package Dependencies

**Files:**
- Modify: `packages/agent-core/package.json`
- Modify: `apps/daemon/package.json`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Remove better-sqlite3, add sql.js to agent-core**

In `packages/agent-core/package.json`:
- Remove `"better-sqlite3": "catalog:"` from `dependencies`
- Remove `"@types/better-sqlite3": "catalog:"` from `devDependencies`
- Add `"sql.js": "^1.11.0"` to `dependencies` (sql.js ships its own types)

- [ ] **Step 2: Remove better-sqlite3, add sql.js to daemon**

In `apps/daemon/package.json`:
- Remove `"better-sqlite3": "^12.6.2"` from `dependencies`
- Remove `"@types/better-sqlite3": "^7.6.13"` from `devDependencies`
- Add `"sql.js": "^1.11.0"` to `dependencies`

- [ ] **Step 3: Swap catalog entry**

In `pnpm-workspace.yaml`, in the `catalogs.default` section:
- Remove `better-sqlite3: ^12.9.0`
- Remove `'@types/better-sqlite3': ^7.6.13`
- Add `sql.js: ^1.11.0`

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`

- [ ] **Step 5: Commit**

```bash
git add packages/agent-core/package.json apps/daemon/package.json pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "chore: swap better-sqlite3 for sql.js in package dependencies"
```

---

### Task 2: Create the sql.js Helper Module and Rewrite `database.ts`

**Files:**
- Modify: `packages/agent-core/src/storage/database.ts`

This is the core change. Rewrite `database.ts` to use sql.js with async init, debounced flush, and `withTransaction` helper.

- [ ] **Step 1: Rewrite database.ts**

Replace the entire content of `packages/agent-core/src/storage/database.ts` with:

```typescript
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';

declare const __dirname: string | undefined;

let _db: SqlJsDatabase | null = null;
let _dbPath: string | null = null;
let _flushTimer: NodeJS.Timeout | null = null;

export interface DatabaseOptions {
  databasePath: string;
  runMigrations?: boolean;
}

export async function initializeDatabase(
  options: DatabaseOptions,
): Promise<SqlJsDatabase> {
  const { databasePath, runMigrations = true } = options;

  if (_db && _dbPath === databasePath) {
    return _db;
  }

  if (_db) {
    closeDatabase();
  }

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      const candidates: string[] = [];

      // 1. ESM: resolve relative to the current module file
      try {
        const moduleDir = dirname(fileURLToPath(import.meta.url));
        candidates.push(join(moduleDir, '..', '..', 'node_modules', 'sql.js', 'dist', file));
      } catch {
        // import.meta.url unavailable (CJS bundle) — skip
      }

      // 2. CJS: resolve relative to __dirname (available in daemon's tsup CJS bundle)
      if (typeof __dirname !== 'undefined') {
        candidates.push(join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file));
        candidates.push(join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', file));
      }

      // 3. Fallback: cwd-based paths (for dev/CLI usage where cwd is the project root)
      candidates.push(
        join(process.cwd(), 'packages', 'agent-core', 'node_modules', 'sql.js', 'dist', file),
        join(process.cwd(), '..', 'packages', 'agent-core', 'node_modules', 'sql.js', 'dist', file),
        join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
        join(process.cwd(), '..', 'node_modules', 'sql.js', 'dist', file),
      );

      for (const candidate of candidates) {
        if (existsSync(candidate)) {
          return candidate;
        }
      }

      return join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
    },
  });

  if (databasePath !== ':memory:' && existsSync(databasePath)) {
    const buffer = readFileSync(databasePath);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }

  _db.run('PRAGMA foreign_keys = ON');
  _dbPath = databasePath;

  if (runMigrations) {
    const { runMigrations: runMigs } = await import(
      './migrations/index.js'
    );
    runMigs(_db);
    flushDatabaseSync();
  }

  return _db;
}

export function getDatabase(): SqlJsDatabase {
  if (!_db) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() first.',
    );
  }
  return _db;
}

export function closeDatabase(): void {
  if (!_db) return;
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  if (_dbPath) {
    const data = _db.export();
    const tmpPath = _dbPath + '.tmp';
    writeFileSync(tmpPath, Buffer.from(data));
    renameSync(tmpPath, _dbPath);
  }
  _db.close();
  _db = null;
  _dbPath = null;
}

export function resetDatabase(databasePath: string): void {
  if (_db) {
    _db.close();
    _db = null;
  }
  _dbPath = null;
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  if (existsSync(databasePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    renameSync(databasePath, `${databasePath}.corrupt.${timestamp}`);
  }
  for (const ext of ['-wal', '-shm', '-tmp']) {
    const p = databasePath + ext;
    if (existsSync(p)) unlinkSync(p);
  }
}

export function isDatabaseInitialized(): boolean {
  return _db !== null;
}

export function getDatabasePath(): string | null {
  return _dbPath;
}

export function databaseExists(databasePath: string): boolean {
  return existsSync(databasePath);
}

export function resetDatabaseInstance(): void {
  closeDatabase();
}

export function flushDatabase(): void {
  if (!_db || !_dbPath) return;
  if (_flushTimer) clearTimeout(_flushTimer);
  _flushTimer = setTimeout(() => {
    if (!_db || !_dbPath) return;
    const data = _db.export();
    const tmpPath = _dbPath + '.tmp';
    writeFileSync(tmpPath, Buffer.from(data));
    renameSync(tmpPath, _dbPath);
    _flushTimer = null;
  }, 50);
}

function flushDatabaseSync(): void {
  if (!_db || !_dbPath) return;
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  const data = _db.export();
  const tmpPath = _dbPath + '.tmp';
  writeFileSync(tmpPath, Buffer.from(data));
  renameSync(tmpPath, _dbPath);
}

export function withTransaction<T>(db: SqlJsDatabase, fn: () => T): T {
  db.run('BEGIN');
  try {
    const result = fn();
    db.run('COMMIT');
    return result;
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

export type { SqlJsDatabase as Database };
```

- [ ] **Step 2: Commit**

```bash
git add packages/agent-core/src/storage/database.ts
git commit -m "feat: rewrite database.ts for sql.js with async init, flush, and withTransaction"
```

---

### Task 3: Create the Single Init Migration

**Files:**
- Create: `packages/agent-core/src/storage/migrations/v001-init.ts`
- Modify: `packages/agent-core/src/storage/migrations/index.ts`
- Modify: `packages/agent-core/src/storage/migrations/errors.ts`

- [ ] **Step 1: Keep old migration files on disk, but do not register them in the new runner**

The 31 old migration files (`v001-initial.ts` through `v031-drop-desktop-blocklist-column.ts`) remain on disk for reference but are no longer imported in `migrations/index.ts`. The new migration runner only registers `v001-init`, so these legacy files become inert.

- [ ] **Step 2: Create v001-init.ts**

Create `packages/agent-core/src/storage/migrations/v001-init.ts`:

```typescript
import type { Database } from '../database.js';

export function v001Init(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      debug_mode INTEGER DEFAULT 0,
      onboarding_complete INTEGER DEFAULT 0,
      selected_model TEXT,
      ollama_config TEXT,
      litellm_config TEXT,
      azure_foundry_config TEXT,
      lmstudio_config TEXT,
      openai_base_url TEXT,
      theme TEXT DEFAULT 'system',
      sandbox_config TEXT,
      cloud_browser_config TEXT,
      notifications_enabled INTEGER DEFAULT 1,
      nim_config TEXT,
      messaging_config TEXT,
      close_behavior TEXT DEFAULT 'minimize',
      huggingface_local_config TEXT,
      language TEXT DEFAULT 'en'
    );

    CREATE TABLE IF NOT EXISTS provider_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_provider_id TEXT,
      debug_mode INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS providers (
      provider_id TEXT PRIMARY KEY,
      connection_status TEXT DEFAULT 'disconnected',
      selected_model_id TEXT,
      credentials_type TEXT,
      credentials_data TEXT,
      last_connected_at TEXT,
      available_models TEXT,
      base_url TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      summary TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      session_id TEXT,
      created_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      workspace_id TEXT
    );

    CREATE TABLE IF NOT EXISTS task_messages (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT,
      tool_name TEXT,
      tool_input TEXT,
      timestamp TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      tool_status TEXT,
      model_id TEXT,
      provider_id TEXT
    );

    CREATE TABLE IF NOT EXISTS task_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT NOT NULL REFERENCES task_messages(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      label TEXT
    );

    CREATE TABLE IF NOT EXISTS task_todos (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      todo_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (task_id, todo_id)
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'custom',
      enabled INTEGER NOT NULL DEFAULT 1,
      config TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS connectors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT,
      oauth_token TEXT,
      oauth_refresh_token TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (task_id)
    );

    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id TEXT PRIMARY KEY,
      cron_expression TEXT NOT NULL,
      prompt TEXT NOT NULL,
      workspace_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_run_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS myboteam_ai_credits (
      provider_id TEXT NOT NULL REFERENCES providers(provider_id) ON DELETE CASCADE,
      credits_used REAL NOT NULL DEFAULT 0,
      credits_limit REAL,
      reset_date TEXT,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (provider_id)
    );

    CREATE TABLE IF NOT EXISTS google_accounts (
      google_account_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT,
      picture_url TEXT,
      label TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      connected_at TEXT NOT NULL,
      last_refreshed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_notes (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_task_id ON task_messages(task_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_notes_workspace ON knowledge_notes(workspace_id);

    INSERT OR IGNORE INTO app_settings (id, debug_mode, onboarding_complete) VALUES (1, 0, 0);
    INSERT OR IGNORE INTO provider_meta (id, debug_mode) VALUES (1, 0);
  `);
}
```

- [ ] **Step 3: Rewrite migrations/index.ts**

Replace `packages/agent-core/src/storage/migrations/index.ts` with:

```typescript
import type { Database } from '../database.js';
import { v001Init } from './v001-init.js';

export const CURRENT_VERSION = 1;

interface Migration {
  version: number;
  up: (db: Database) => void;
}

const migrations: Migration[] = [
  { version: 1, up: v001Init },
];

function getStoredVersion(db: Database): number {
  const result = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_meta'",
  );
  if (!result.length || !result[0].values.length) {
    return 0;
  }
  const versionResult = db.exec(
    "SELECT value FROM schema_meta WHERE key = 'version'",
  );
  if (!versionResult.length || !versionResult[0].values.length) {
    return 0;
  }
  return parseInt(String(versionResult[0].values[0][0]), 10);
}

function setStoredVersion(db: Database, version: number): void {
  db.exec(
    `INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '${version}')`,
  );
}

export function runMigrations(db: Database): void {
  const { FutureSchemaError } = await import('./errors.js');
  const storedVersion = getStoredVersion(db);
  if (storedVersion > CURRENT_VERSION) {
    throw new FutureSchemaError(storedVersion, CURRENT_VERSION);
  }
  for (const migration of migrations) {
    if (migration.version > storedVersion) {
      const { withTransaction } = await import('../database.js');
      withTransaction(db, () => {
        migration.up(db);
        setStoredVersion(db, migration.version);
      });
    }
  }
}
```

**Wait — `runMigrations` can't use top-level `await import()` since it's a sync function.** Fix: import `withTransaction` and `FutureSchemaError` at the top of the file.

Corrected content for `migrations/index.ts`:

```typescript
import type { Database } from '../database.js';
import { withTransaction } from '../database.js';
import { FutureSchemaError } from './errors.js';
import { v001Init } from './v001-init.js';

export const CURRENT_VERSION = 1;

interface Migration {
  version: number;
  up: (db: Database) => void;
}

const migrations: Migration[] = [
  { version: 1, up: v001Init },
];

function getStoredVersion(db: Database): number {
  const result = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_meta'",
  );
  if (!result.length || !result[0].values.length) {
    return 0;
  }
  const versionResult = db.exec(
    "SELECT value FROM schema_meta WHERE key = 'version'",
  );
  if (!versionResult.length || !versionResult[0].values.length) {
    return 0;
  }
  return parseInt(String(versionResult[0].values[0][0]), 10);
}

function setStoredVersion(db: Database, version: number): void {
  db.run('INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)', [
    'version',
    String(version),
  ]);
}

export function runMigrations(db: Database): void {
  const storedVersion = getStoredVersion(db);
  if (storedVersion > CURRENT_VERSION) {
    throw new FutureSchemaError(storedVersion, CURRENT_VERSION);
  }
  for (const migration of migrations) {
    if (migration.version > storedVersion) {
      withTransaction(db, () => {
        migration.up(db);
        setStoredVersion(db, migration.version);
      });
    }
  }
}
```

- [ ] **Step 4: Update migrations/errors.ts**

Replace `packages/agent-core/src/storage/migrations/errors.ts`. Change the `Database` type import from `better-sqlite3` to use the re-export from `database.js`:

```typescript
import type { Database } from '../database.js';

export class FutureSchemaError extends Error {
  constructor(
    public readonly storedVersion: number,
    public readonly appVersion: number,
  ) {
    super(
      `Database schema version ${storedVersion} is newer than app version ${appVersion}. Please update the application.`,
    );
    this.name = 'FutureSchemaError';
  }
}

export class MigrationError extends Error {
  constructor(
    public readonly version: number,
    public readonly cause: Error,
  ) {
    super(`Migration to version ${version} failed: ${cause.message}`);
    this.name = 'MigrationError';
  }
}

export class CorruptDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorruptDatabaseError';
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A packages/agent-core/src/storage/migrations/
git commit -m "feat: consolidate migrations into single v001-init, keep old files on disk"
```

---

### Task 4: Delete Legacy Import Files and Remove Old Exports

**Files:**
- Delete: `packages/agent-core/src/storage/import-legacy-workspace-meta.ts`
- Delete: `packages/agent-core/src/storage/delete-legacy-workspace-meta.ts`
- Modify: `packages/agent-core/src/index.ts`
- Delete: `apps/daemon/src/legacy-import-service.ts`
- Modify: `apps/daemon/src/index.ts`

- [ ] **Step 1: Delete legacy import files**

```bash
rm packages/agent-core/src/storage/import-legacy-workspace-meta.ts \
   packages/agent-core/src/storage/delete-legacy-workspace-meta.ts \
   apps/daemon/src/legacy-import-service.ts
```

- [ ] **Step 2: Remove exports from agent-core/src/index.ts**

In `packages/agent-core/src/index.ts`, remove the line:
```typescript
export { deleteLegacyWorkspaceMetaFiles } from './storage/delete-legacy-workspace-meta.js';
```

Also remove any export of `importLegacyWorkspaceMeta` if it exists.

- [ ] **Step 3: Remove legacy references from daemon/src/index.ts**

In `apps/daemon/src/index.ts`:
- Remove the import of `LegacyImportService`
- Remove any usage of `legacyImportService` or `getRawDatabase()` for legacy import
- Remove `deleteLegacyWorkspaceMetaFiles` import if present
- Make `storageService.initialize()` call `await` since it's now async (this will be fully handled in Task 8)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete legacy import files and remove their exports"
```

---

### Task 5: Add `rowsFromResult` Helper Utility

**Files:**
- Create: `packages/agent-core/src/storage/query-helpers.ts`

sql.js's `db.exec()` returns `QueryExecResult[]` with `{ columns: string[], values: any[][] }`. Repository code needs a helper to convert this into typed row objects.

- [ ] **Step 1: Create query-helpers.ts**

Create `packages/agent-core/src/storage/query-helpers.ts`:

```typescript
import type { Database, QueryExecResult } from 'sql.js';

export function rowsFromResult<T>(result: QueryExecResult[]): T[] {
  if (!result.length || !result[0].values.length) return [];
  const { columns, values } = result[0];
  return values.map(
    (row) =>
      Object.fromEntries(columns.map((col, i) => [col, row[i]])) as T,
  );
}

export function rowFromResult<T>(
  result: QueryExecResult[],
): T | undefined {
  if (!result.length || !result[0].values.length) return undefined;
  const { columns, values } = result[0];
  return Object.fromEntries(
    columns.map((col, i) => [col, values[0][i]]),
  ) as T;
}

export function valueFromResult<T>(
  result: QueryExecResult[],
): T | undefined {
  if (!result.length || !result[0].values.length) return undefined;
  return result[0].values[0][0] as T;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/agent-core/src/storage/query-helpers.ts
git commit -m "feat: add query helper utilities for sql.js result mapping"
```

---

### Task 6: Convert Repository Files to sql.js API

This is the largest task. Each repository file must be converted from `better-sqlite3` API to `sql.js` API. The key changes per file:

1. Remove `import { getDatabase } from '../database.js'` (already correct, keep it — but the `Database` type changes)
2. Replace `db.prepare(sql).get(params)` → `rowFromResult(db.exec(sql, [params]))` for single-row reads
3. Replace `db.prepare(sql).all(params)` → `rowsFromResult(db.exec(sql, [params]))` for multi-row reads
4. Replace `db.prepare(sql).run(params)` → `db.run(sql, params)` for writes
5. Replace `db.exec(sql)` → `db.exec(sql)` for DDL (stays same, but result differs)
6. Replace `db.transaction(() => { ... })()` → `withTransaction(db, () => { ... })`
7. Add `import { flushDatabase, withTransaction } from '../database.js'` where needed
8. Add `import { rowsFromResult, rowFromResult, valueFromResult } from '../query-helpers.js'`
9. Call `flushDatabase()` after every write function
10. All functions remain synchronous (sql.js operations are sync once initialized)

**Files (all in `packages/agent-core/src/storage/repositories/`):**

- `appSettings.ts`
- `connectors.ts`
- `favorites.ts`
- `knowledgeNotes.ts`
- `provider-settings.ts`
- `providerSettings.ts`
- `scheduled-tasks.ts`
- `skills.ts`
- `taskHistory.ts`
- `task-row-mapper.ts`
- `task-todos.ts`
- `ui-settings.ts`
- `workspaces.ts`
- `index.ts`

Additionally:
- `packages/agent-core/src/opencode/resolve-task-config.ts`
- `packages/agent-core/src/google-accounts/prepare-manifest.ts`

Each repository follows the same pattern. Here is a complete example for `ui-settings.ts` as a reference, then a list of the specific changes per file.

- [ ] **Step 1: Convert `ui-settings.ts` (reference pattern)**

The current `ui-settings.ts` uses `db.prepare().get()` pattern. Convert to:

```typescript
import { getDatabase } from '../database.js';
import { rowFromResult } from '../query-helpers.js';
import type { ThemePreference, LanguagePreference } from '../../types/storage.js';

export function getTheme(): ThemePreference {
  const db = getDatabase();
  const row = rowFromResult<{ theme: string }>(
    db.exec('SELECT theme FROM app_settings WHERE id = 1'),
  );
  return (row?.theme as ThemePreference) ?? 'system';
}

export function setTheme(theme: ThemePreference): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET theme = ? WHERE id = 1', [theme]);
  flushDatabase();
}

export function getLanguage(): LanguagePreference {
  const db = getDatabase();
  const row = rowFromResult<{ language: string }>(
    db.exec('SELECT language FROM app_settings WHERE id = 1'),
  );
  return (row?.language as LanguagePreference) ?? 'en';
}

export function setLanguage(language: LanguagePreference): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET language = ? WHERE id = 1', [language]);
  flushDatabase();
}

export function getNotificationsEnabled(): boolean {
  const db = getDatabase();
  const row = rowFromResult<{ notifications_enabled: number }>(
    db.exec('SELECT notifications_enabled FROM app_settings WHERE id = 1'),
  );
  return row?.notifications_enabled === 1;
}

export function setNotificationsEnabled(enabled: boolean): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET notifications_enabled = ? WHERE id = 1', [
    enabled ? 1 : 0,
  ]);
  flushDatabase();
}

export function getCloseBehavior(): string {
  const db = getDatabase();
  const row = rowFromResult<{ close_behavior: string }>(
    db.exec('SELECT close_behavior FROM app_settings WHERE id = 1'),
  );
  return row?.close_behavior ?? 'minimize';
}

export function setCloseBehavior(behavior: string): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET close_behavior = ? WHERE id = 1', [
    behavior,
  ]);
  flushDatabase();
}
```

- [ ] **Step 2: Convert remaining repositories**

Convert each remaining repository file using the same pattern:

**`appSettings.ts`:** Replace `db.prepare().get()/.run()` with `db.exec()`/`db.run()` + `rowFromResult()`. Add `flushDatabase()` after writes. Keep function signatures synchronous (no `async`).

**`connectors.ts`:** Same pattern. Uses `db.prepare().all()/.run()` → `rowsFromResult(db.exec())`/`db.run()`. Add `flushDatabase()` after writes. Use `withTransaction()` for multi-step operations.

**`favorites.ts`:** Replace `db.prepare().all()/.run()` → `rowsFromResult(db.exec())`/`db.run()`. Add `flushDatabase()` after writes.

**`knowledgeNotes.ts`:** Replace `db.prepare().all()/.run()` → `rowsFromResult(db.exec())`/`db.run()`. Add `flushDatabase()` after writes. Note: this file uses `db.prepare('...').run(...).changes > 0` — replace with `db.getRowsModified() > 0` or `db.run()` then check `db.getRowsModified()`.

**`provider-settings.ts`:** Uses transactions. Replace `db.transaction(() => { ... })()` with `withTransaction(db, () => { ... })`. Add `flushDatabase()` after transaction.

**`providerSettings.ts`:** Replace `db.prepare().get()/.all()/.run()` patterns. Add `flushDatabase()` after writes. Use `withTransaction()` for `removeConnectedProvider` and `clearProviderSettings`.

**`scheduled-tasks.ts`:** Replace patterns. Add `flushDatabase()` after writes.

**`skills.ts`:** Replace patterns. Add `flushDatabase()` after writes. Uses `ON CONFLICT(id) DO UPDATE` — this works as-is in sql.js.

**`taskHistory.ts`:** The most complex repository. Uses transactions heavily. Replace all `db.transaction(() => { ... })()` with `withTransaction(db, () => { ... })`. Inside transactions, replace `db.prepare(sql).run(params)` with `db.run(sql, [params])`. For loops of prepared statements, use `db.run(sql, [params])` in a loop. Add `flushDatabase()` after each transaction-wrapped write.

**`task-row-mapper.ts`:** This file likely only transforms row objects — check if it uses the database directly. If not, it may only need type updates.

**`task-todos.ts`:** Uses `db.transaction(() => { ... })()`. Replace with `withTransaction(db, () => { ... })`. Add `flushDatabase()` after transaction.

**`workspaces.ts`:** Uses `ON CONFLICT(id) DO UPDATE`. This works in sql.js. Add `flushDatabase()` after writes.

- [ ] **Step 3: Convert `resolve-task-config.ts`**

In `packages/agent-core/src/opencode/resolve-task-config.ts`:
- Change `import type { Database } from 'better-sqlite3'` to `import type { Database } from '../storage/database.js'`
- The `database?: Database` parameter type changes accordingly
- No other changes needed since this module only passes the `Database` to `prepareGwsManifest`

- [ ] **Step 4: Convert `prepare-manifest.ts`**

In `packages/agent-core/src/google-accounts/prepare-manifest.ts`:
- Change `import type { Database } from 'better-sqlite3'` to `import type { Database } from '../storage/database.js'`
- Replace `db.prepare('SELECT ...').all(status)` → `rowsFromResult(db.exec('SELECT ...', [status]))`
- Replace `db.prepare('UPDATE ...').run(...)` → `db.run('UPDATE ...', [...])` + `flushDatabase()`
- Import `rowsFromResult` from `../storage/query-helpers.js`
- Import `flushDatabase` from `../storage/database.js`

- [ ] **Step 5: Update repository index.ts**

In `packages/agent-core/src/storage/repositories/index.ts`, ensure all exports are correct and no stale `better-sqlite3` types leak through. Update any re-exports.

- [ ] **Step 6: Commit**

```bash
git add packages/agent-core/src/storage/repositories/ packages/agent-core/src/opencode/resolve-task-config.ts packages/agent-core/src/google-accounts/prepare-manifest.ts packages/agent-core/src/storage/query-helpers.ts
git commit -m "feat: convert all repository modules from better-sqlite3 to sql.js API"
```

---

### Task 7: Update StorageAPI Types and Factory

**Files:**
- Modify: `packages/agent-core/src/types/storage.ts`
- Modify: `packages/agent-core/src/factories/storage.ts`

- [ ] **Step 1: Update StorageAPI types**

In `packages/agent-core/src/types/storage.ts`, every method on `StorageAPI` and its sub-interfaces that touches the database must return `Promise<T>` instead of `T`. Specifically:

- `TaskStorageAPI`: all methods become async
- `AppSettingsAPI`: all methods become async
- `ProviderSettingsAPI`: all methods become async
- `ConnectorStorageAPI`: all methods become async
- `SchedulerStorageAPI`: all methods become async
- `DatabaseLifecycleAPI`: `initialize()` becomes `Promise<void>`, `close()` becomes `Promise<void>`, `isDatabaseInitialized()` stays sync
- `SecureStorageAPI`: check if this uses the DB or a separate JSON file — if separate, keep sync

Read the file first to confirm exact method signatures, then wrap each DB-touching method's return type in `Promise<>`.

- [ ] **Step 2: Update storage factory**

In `packages/agent-core/src/factories/storage.ts`:
- Change `initialize()` to be `async` (it calls `await initializeDatabase(...)`)
- Remove `legacyMetaDbPath` from `StorageOptions` and from `createStorage`
- Remove the `importLegacyWorkspaceMeta` and `deleteLegacyWorkspaceMetaFiles` calls
- Remove the `legacyMetaDbPath` parameter passthrough
- All delegate functions that call repository functions remain synchronous (repositories are sync, only `initialize()` is async)

- [ ] **Step 3: Commit**

```bash
git add packages/agent-core/src/types/storage.ts packages/agent-core/src/factories/storage.ts
git commit -m "feat: make StorageAPI methods async, remove legacy params from factory"
```

---

### Task 8: Update Daemon and Desktop Integration

**Files:**
- Modify: `apps/daemon/src/storage-service.ts`
- Modify: `apps/daemon/src/google-account-service.ts`
- Modify: `apps/daemon/src/index.ts`
- Modify: `apps/desktop/src/main/store/storage.ts`
- Modify: `apps/desktop/scripts/assert-packaging-invariants.cjs`

- [ ] **Step 1: Update storage-service.ts**

In `apps/daemon/src/storage-service.ts`:
- Change `import type { Database } from 'better-sqlite3'` to `import type { Database } from '@myboteam/agent-core/storage/database'` (or appropriate path)
- Change `initialize()` to `async initialize()` — `await` the storage init
- Change `getRawDatabase()` return type from `better-sqlite3.Database` to sql.js `Database`
- Remove `deleteLegacyWorkspaceMetaFiles` import and call
- Remove `legacyMetaDbPath` usage

- [ ] **Step 2: Update google-account-service.ts**

In `apps/daemon/src/google-account-service.ts`:
- Change `import type { Database } from 'better-sqlite3'` to `import type { Database } from '@myboteam/agent-core/storage/database'` (or relative)
- All `db.prepare().all()/.get()/.run()` calls convert to `db.exec()`/`db.run()` + `rowsFromResult()`
- Import `rowsFromResult, rowFromResult` from the query helpers
- Import `flushDatabase` from database module; call after writes
- All methods remain synchronous (sql.js ops are sync)

- [ ] **Step 3: Update daemon/src/index.ts**

In `apps/daemon/src/index.ts`:
- Make the startup function async
- `await storageService.initialize(dataDir)`
- `await storage.getTasks()` in crash recovery
- `await storage.updateTaskStatus(...)` for each stale task
- Remove `LegacyImportService` creation and all references
- Change `storageService.getRawDatabase()` type (it's now sql.js `Database`)

- [ ] **Step 4: Update desktop storage.ts**

In `apps/desktop/src/main/store/storage.ts`:
- Remove `getLegacyMetaDbPath()` and `getLegacyElectronStorePaths()` functions if they only served the legacy import
- Keep path derivation for main DB (still needed by daemon)
- Remove any `better-sqlite3` type references

- [ ] **Step 5: Update assert-packaging-invariants.cjs**

In `apps/desktop/scripts/assert-packaging-invariants.cjs`:
- Remove better-sqlite3 ABI-related assertions
- Keep other invariants

- [ ] **Step 6: Commit**

```bash
git add apps/daemon/src/storage-service.ts apps/daemon/src/google-account-service.ts apps/daemon/src/index.ts apps/desktop/src/main/store/storage.ts apps/desktop/scripts/assert-packaging-invariants.cjs
git commit -m "feat: update daemon and desktop to use sql.js, async init, remove legacy imports"
```

---

### Task 9: Update agent-core Barrel Exports

**Files:**
- Modify: `packages/agent-core/src/index.ts`
- Modify: `packages/agent-core/src/common.ts` (if it has relevant exports)

- [ ] **Step 1: Update index.ts**

In `packages/agent-core/src/index.ts`:
- Remove `export { deleteLegacyWorkspaceMetaFiles }` (file deleted)
- Remove any `import type { Database } from 'better-sqlite3'` or re-exports of `Database`
- If `Database` type is exported, change it to re-export from `./storage/database.js`
- Verify no `better-sqlite3` references remain

- [ ] **Step 2: Verify common.ts has no better-sqlite3 references**

Read `packages/agent-core/src/common.ts` and confirm it doesn't reference `better-sqlite3`. No changes expected.

- [ ] **Step 3: Commit**

```bash
git add packages/agent-core/src/index.ts packages/agent-core/src/common.ts
git commit -m "chore: update barrel exports, remove better-sqlite3 references"
```

---

### Task 10: Delete Migration Test Files and Legacy Test Files

**Files:**
- Delete: `packages/agent-core/tests/unit/storage/migrations/v028.test.ts`
- Delete: `packages/agent-core/tests/unit/storage/migrations/v030.test.ts`
- Delete: `packages/agent-core/tests/unit/storage/migrations/v031.test.ts`
- Delete: `packages/agent-core/tests/unit/storage/import-legacy-workspace-meta.test.ts`
- Delete: `packages/agent-core/tests/unit/storage/delete-legacy-workspace-meta.test.ts`
- Delete: `packages/agent-core/tests/integration/legacy-meta-upgrade-happy-path.test.ts`
- Delete: `apps/daemon/__tests__/unit/legacy-import-service.test.ts`

- [ ] **Step 1: Delete test files**

```bash
rm packages/agent-core/tests/unit/storage/migrations/v028.test.ts \
   packages/agent-core/tests/unit/storage/migrations/v030.test.ts \
   packages/agent-core/tests/unit/storage/migrations/v031.test.ts \
   packages/agent-core/tests/unit/storage/import-legacy-workspace-meta.test.ts \
   packages/agent-core/tests/unit/storage/delete-legacy-workspace-meta.test.ts \
   packages/agent-core/tests/integration/legacy-meta-upgrade-happy-path.test.ts \
   apps/daemon/__tests__/unit/legacy-import-service.test.ts
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: delete migration and legacy test files that are no longer needed"
```

---

### Task 11: Convert Database and Storage Tests to sql.js

**Files:**
- Modify: `packages/agent-core/tests/globalSetup.ts`
- Modify: `packages/agent-core/tests/unit/storage/database.test.ts`
- Modify: `packages/agent-core/tests/unit/storage/favorites.test.ts`
- Modify: `packages/agent-core/tests/unit/storage/task-message-fields.test.ts`
- Modify: `packages/agent-core/tests/unit/storage/workspaces-consolidated.test.ts`
- Modify: `packages/agent-core/tests/unit/skills/skills-manager.test.ts`
- Modify: `packages/agent-core/tests/unit/desktop-main.test.ts`
- Modify: `packages/agent-core/tests/integration/resolve-task-config-knowledge-notes.test.ts`
- Modify: `packages/agent-core/tests/integration/full-flow.test.ts`
- Modify: `apps/daemon/__tests__/unit/workspace-service.test.ts`
- Modify: `apps/daemon/__tests__/unit/task-config-builder.unit.test.ts`

- [ ] **Step 1: Update globalSetup.ts**

Replace the better-sqlite3 ABI check with a no-op or sql.js check. Since sql.js is WASM (no native module), no ABI check is needed:

```typescript
// Remove the better-sqlite3 ABI check entirely
// sql.js is a WASM module, no native ABI validation needed
```

- [ ] **Step 2: Update database.test.ts**

Replace `better-sqlite3` usage with sql.js async init. Create helper function:

```typescript
import initSqlJs from 'sql.js';

async function createTestDb(): Promise<Database> {
  const SQL = await initSqlJs();
  return new SQL.Database();
}
```

Update all test cases to use `createTestDb()` and `await`.

- [ ] **Step 3: Update remaining test files**

For each test file that dynamically imports `better-sqlite3`:
- Replace `await import('better-sqlite3')` with `await initSqlJs()` + `new SQL.Database()`
- Replace `const db = new Database(':memory:')` with `const SQL = await initSqlJs(); const db = new SQL.Database()`
- Replace `db.prepare(...)` calls with sql.js equivalents
- Replace `SKIP_SQLITE_TESTS` logic with sql.js availability check (WASM should always be available in Node)

- [ ] **Step 4: Update desktop-main.test.ts**

Remove the `expect(specifiers).not.toContain('better-sqlite3')` assertion, since `better-sqlite3` is no longer a dependency.

- [ ] **Step 5: Update daemon test files**

In `workspace-service.test.ts` and `task-config-builder.unit.test.ts`:
- Remove or update any `better-sqlite3` skip patterns
- Replace stub/mocked DB with sql.js-based test helpers if needed

- [ ] **Step 6: Commit**

```bash
git add packages/agent-core/tests/ apps/daemon/__tests__/
git commit -m "test: convert all test files from better-sqlite3 to sql.js"
```

---

### Task 12: Remove Better-sqlite3 from CI Scripts and Package Config

**Files:**
- Delete: `scripts/check-native-abi.cjs`
- Modify: `.github/workflows/ci.yml` (if it references check-native-abi)
- Modify: `apps/desktop/package.json` (if it has better-sqlite3 in optionalDependencies)

- [ ] **Step 1: Delete check-native-abi.cjs**

```bash
rm scripts/check-native-abi.cjs
```

- [ ] **Step 2: Check CI workflow for references**

Search `.github/workflows/ci.yml` for `check-native-abi` or `better-sqlite3` references. Remove any steps that run the ABI check.

- [ ] **Step 3: Check for better-sqlite3 in other package.json files**

Search `apps/desktop/package.json` for `better-sqlite3`. Remove if present (desktop doesn't directly depend on it, but it may be in optionalDependencies).

- [ ] **Step 4: Check root package.json scripts**

Check if `package.json` (root) has any scripts referencing `check-native-abi` or `better-sqlite3`. Remove them.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove better-sqlite3 native ABI scripts and CI references"
```

---

### Task 13: Typecheck and Fix All Compilation Errors

**Files:** Various — fix any type errors that emerge.

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`

- [ ] **Step 2: Fix all type errors**

Common expected errors:
- `Database` type mismatches (better-sqlite3 vs sql.js)
- Async method signatures not matching `StorageAPI` types
- Missing `await` on async calls
- Import path issues (`.js` extensions required in ESM)

Fix each error. Run `pnpm typecheck` again until clean.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: resolve all TypeScript compilation errors from sql.js migration"
```

---

### Task 14: Run Tests and Fix Failures

- [ ] **Step 1: Run agent-core tests**

Run: `pnpm -F @myboteam/agent-core test`

- [ ] **Step 2: Run web tests**

Run: `pnpm -F @myboteam/web test`

- [ ] **Step 3: Run desktop tests**

Run: `pnpm -F @myboteam/desktop test`

- [ ] **Step 4: Fix any test failures**

Common expected failures:
- Tests creating in-memory databases need async setup
- Query result format changes (sql.js returns `{columns, values}` vs better-sqlite3's `{field: value}`)
- Transaction behavior differences

- [ ] **Step 5: Run full check**

Run: `pnpm check`

- [ ] **Step 6: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve test failures and lint issues from sql.js migration"
```

---

### Task 15: Final Verification

- [ ] **Step 1: Run `pnpm check`** — must pass clean
- [ ] **Step 2: Run `pnpm -F @myboteam/agent-core test`** — all tests pass
- [ ] **Step 3: Run `pnpm -F @myboteam/desktop test`** — all tests pass
- [ ] **Step 4: Run `pnpm -F @myboteam/web test`** — all tests pass
- [ ] **Step 5: Grep for `better-sqlite3`** — should return zero results in `src/` and `tests/` directories

```bash
rg "better-sqlite3" packages/agent-core/src/ packages/agent-core/tests/ apps/daemon/src/ apps/desktop/src/
```

- [ ] **Step 6: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: final cleanup and verification for sql.js migration"
```