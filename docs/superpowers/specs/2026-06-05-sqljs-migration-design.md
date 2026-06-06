# Replace better-sqlite3 with sql.js — Design Spec

**Date:** 2026-06-05
**Status:** Draft

## Goal

Replace the native `better-sqlite3` module with `sql.js` (WASM-based SQLite), consolidate 31 incremental migrations into a single init migration, and remove all legacy data import code. Clean slate — existing user data is not preserved.

## Approach

**A: Direct async sql.js** — Use sql.js's native API directly (no wrapper). All `StorageAPI` methods become async. Every repository function converts from better-sqlite3's synchronous API to sql.js's synchronous-in-process API, with async initialization.

## Package Changes

### Remove
- `better-sqlite3` and `@types/better-sqlite3` from `packages/agent-core/package.json` and `apps/daemon/package.json`
- `better-sqlite3` entry from `pnpm-workspace.yaml` catalog
- `scripts/check-native-abi.cjs` (native ABI check)
- `better-sqlite3` import assertion in `packages/agent-core/tests/unit/desktop-main.test.ts`
- Better-sqlite3-related assertions in `apps/desktop/scripts/assert-packaging-invariants.cjs`

### Add
- `sql.js` in `packages/agent-core/package.json` dependencies (pinned version via catalog)
- `sql.js` in `apps/daemon/package.json` dependencies
- sql.js ships its own TypeScript types — no separate `@types` package needed

### WASM Handling
- Bundle `sql-wasm.wasm` with the package. Use `locateFile` at init time to resolve the WASM file path relative to `__dirname` or `import.meta.url` (ESM).
- For the daemon (Node.js), the WASM file lives in `node_modules/sql.js/dist/` and is resolved via `locateFile`.

## Database Layer (`database.ts`)

### Types

```typescript
interface DatabaseOptions {
  databasePath: string;
  runMigrations?: boolean;  // default true
}
```

No `legacyMetaDbPath` — removed (clean slate).

### Async Initialization

```typescript
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';

declare const __dirname: string | undefined;

let _db: SqlJsDatabase | null = null;
let _dbPath: string | null = null;

export async function initializeDatabase(options: DatabaseOptions): Promise<SqlJsDatabase> {
  const { databasePath, runMigrations = true } = options;
  if (_db && _currentPath === databasePath) return _db;
  if (_db) closeDatabase();

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      // Try multiple resolution strategies: ESM (import.meta.url),
      // CJS (__dirname), and fallback cwd-based paths for dev/CLI usage
      const candidates: string[] = [];
      try {
        const moduleDir = dirname(fileURLToPath(import.meta.url));
        candidates.push(join(moduleDir, '..', '..', 'node_modules', 'sql.js', 'dist', file));
      } catch { /* CJS */ }
      if (typeof __dirname !== 'undefined') {
        candidates.push(join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file));
        candidates.push(join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', file));
      }
      candidates.push(
        join(process.cwd(), 'packages', 'agent-core', 'node_modules', 'sql.js', 'dist', file),
        join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
      );
      for (const c of candidates) { if (existsSync(c)) return c; }
      return candidates[candidates.length - 1];
    },
  });

  if (existsSync(databasePath)) {
    const buffer = readFileSync(databasePath);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }

  _db.run('PRAGMA foreign_keys = ON');
  _currentPath = databasePath;

  if (runMigrations) {
    runMigrations(_db);
    flushDatabase();
  }

  return _db;
}
```

### Removed
- `importLegacyWorkspaceMeta()` — deleted entirely (clean slate, no legacy import)
- `deleteLegacyWorkspaceMetaFiles()` — deleted entirely
- `legacyMetaDbPath` option from `DatabaseOptions`
- `journal_mode = WAL` pragma (sql.js doesn't support WAL; not needed for single-process)

### `resetDatabase()` — Adapted for sql.js

```typescript
export function resetDatabase(databasePath: string): void {
  if (_db) {
    _db.close();
    _db = null;
  }
  if (existsSync(databasePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    renameSync(databasePath, `${databasePath}.corrupt.${timestamp}`);
  }
  // Remove sidecar files (from old better-sqlite3 WAL)
  for (const ext of ['-wal', '-shm', '-tmp']) {
    const p = databasePath + ext;
    if (existsSync(p)) unlinkSync(p);
  }
  _currentPath = null;
}
```

### Persistence — Debounced Flush-on-Write

sql.js operates in-memory. Every write operation must persist to disk.

```typescript
let flushTimer: NodeJS.Timeout | null = null;

export function flushDatabase(): void {
  if (!_db || !_dbPath) return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    if (!_db || !_dbPath) return;
    const data = _db.export();
    const dir = dirname(_dbPath);
    const tmpPath = _dbPath + '.tmp';
    writeFileSync(tmpPath, Buffer.from(data));
    renameSync(tmpPath, _dbPath); // atomic rename
    flushTimer = null;
  }, 50); // 50ms debounce
}
```

Each repository write function calls `flushDatabase()` after its write. The 50ms debounce collapses rapid-fire writes (e.g., `saveTask()`) into a single disk flush.

`closeDatabase()` always flushes synchronously before closing:
```typescript
export function closeDatabase(): void {
  if (!_db) return;
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (_dbPath) {
    const data = _db.export();
    writeFileSync(_dbPath, Buffer.from(data));
  }
  _db.close();
  _db = null;
  _dbPath = null;
}
```

The daemon also calls `flushDatabase()` on `before-quit` / `SIGTERM` signals.

## Migrations — Single Init Migration

### Removed from migration runner
- All 31 old migration files (`v001-initial.ts` through `v031-drop-desktop-blocklist-column.ts`) are no longer imported in `migrations/index.ts`. They remain on disk for reference but are effectively inert.

### New: `v001-init.ts`

A single migration containing the **full final schema** — every `CREATE TABLE` and `CREATE INDEX` statement, as if all 31 migrations were applied. Seed rows for `app_settings` (id=1, defaults) and `provider_meta` (id=1, defaults).

### New: `migrations/index.ts`

```typescript
import type { Database } from 'sql.js';
import { v001Init } from './v001-init.js';

export const CURRENT_VERSION = 1;

const migrations = [
  { version: 1, up: v001Init },
];

export function runMigrations(db: Database): void {
  const storedVersion = getStoredVersion(db);
  if (storedVersion > CURRENT_VERSION) throw new FutureSchemaError(storedVersion, CURRENT_VERSION);
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

Future migrations add new entries (`{ version: 2, up: v002Something }`) starting from version 2.

### Transaction Helper

```typescript
export function withTransaction<T>(db: Database, fn: () => T): T {
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
```

Replaces `db.transaction(fn)()` calls.

### Migration Type

```typescript
interface Migration {
  version: number;
  up: (db: Database) => void;
}
```

No `down()` — clean slate means no rollback.

## Final Schema (v001-init)

| Table | Columns |
|-------|---------|
| `schema_meta` | `key TEXT PRIMARY KEY`, `value TEXT NOT NULL` |
| `app_settings` | `id INTEGER PRIMARY KEY CHECK(id=1)`, `debug_mode INTEGER DEFAULT 0`, `onboarding_complete INTEGER DEFAULT 0`, `selected_model TEXT`, `ollama_config TEXT`, `litellm_config TEXT`, `azure_foundry_config TEXT`, `lmstudio_config TEXT`, `openai_base_url TEXT`, `theme TEXT DEFAULT 'system'`, `sandbox_config TEXT`, `cloud_browser_config TEXT`, `notifications_enabled INTEGER DEFAULT 1`, `nim_config TEXT`, `messaging_config TEXT`, `close_behavior TEXT DEFAULT 'minimize'`, `huggingface_local_config TEXT`, `language TEXT DEFAULT 'en'` |
| `provider_meta` | `id INTEGER PRIMARY KEY CHECK(id=1)`, `active_provider_id TEXT`, `debug_mode INTEGER DEFAULT 0` |
| `providers` | `provider_id TEXT PRIMARY KEY`, `connection_status TEXT DEFAULT 'disconnected'`, `selected_model_id TEXT`, `credentials_type TEXT`, `credentials_data TEXT`, `last_connected_at TEXT`, `available_models TEXT`, `base_url TEXT` |
| `tasks` | `id TEXT PRIMARY KEY`, `prompt TEXT NOT NULL`, `summary TEXT`, `status TEXT NOT NULL DEFAULT 'pending'`, `session_id TEXT`, `created_at TEXT NOT NULL`, `started_at TEXT`, `completed_at TEXT`, `workspace_id TEXT` |
| `task_messages` | `id TEXT PRIMARY KEY`, `task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE`, `type TEXT NOT NULL`, `content TEXT`, `tool_name TEXT`, `tool_input TEXT`, `timestamp TEXT NOT NULL`, `sort_order INTEGER NOT NULL DEFAULT 0`, `tool_status TEXT`, `model_id TEXT`, `provider_id TEXT` |
| `task_attachments` | `id INTEGER PRIMARY KEY AUTOINCREMENT`, `message_id TEXT NOT NULL REFERENCES task_messages(id) ON DELETE CASCADE`, `type TEXT NOT NULL`, `data TEXT NOT NULL`, `label TEXT` |
| `task_todos` | `task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE`, `todo_id TEXT NOT NULL`, `content TEXT NOT NULL`, `is_completed INTEGER NOT NULL DEFAULT 0`, `sort_order INTEGER NOT NULL DEFAULT 0`, `PRIMARY KEY (task_id, todo_id)` |
| `skills` | `id TEXT PRIMARY KEY`, `name TEXT NOT NULL`, `description TEXT`, `type TEXT NOT NULL DEFAULT 'custom'`, `enabled INTEGER NOT NULL DEFAULT 1`, `config TEXT`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL` |
| `connectors` | `id TEXT PRIMARY KEY`, `name TEXT NOT NULL`, `type TEXT NOT NULL`, `config TEXT`, `oauth_token TEXT`, `oauth_refresh_token TEXT`, `enabled INTEGER NOT NULL DEFAULT 1`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL` |
| `favorites` | `task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE`, `created_at TEXT NOT NULL`, `PRIMARY KEY (task_id)` |
| `scheduled_tasks` | `id TEXT PRIMARY KEY`, `cron_expression TEXT NOT NULL`, `prompt TEXT NOT NULL`, `workspace_id TEXT`, `is_active INTEGER NOT NULL DEFAULT 1`, `last_run_at TEXT`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL` |
| `myboteam_ai_credits` | `provider_id TEXT NOT NULL REFERENCES providers(provider_id) ON DELETE CASCADE`, `credits_used REAL NOT NULL DEFAULT 0`, `credits_limit REAL`, `reset_date TEXT`, `updated_at TEXT NOT NULL`, `PRIMARY KEY (provider_id)` |
| `google_accounts` | `google_account_id TEXT PRIMARY KEY`, `email TEXT NOT NULL`, `display_name TEXT`, `picture_url TEXT`, `label TEXT`, `status TEXT NOT NULL DEFAULT 'active'`, `connected_at TEXT NOT NULL`, `last_refreshed_at TEXT` |
| `workspaces` | `id TEXT PRIMARY KEY`, `name TEXT NOT NULL`, `description TEXT`, `color TEXT`, `sort_order INTEGER NOT NULL DEFAULT 0`, `is_default INTEGER NOT NULL DEFAULT 0`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL` |
| `workspace_meta` | `key TEXT PRIMARY KEY`, `value TEXT NOT NULL` |
| `knowledge_notes` | `id TEXT PRIMARY KEY`, `workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE`, `type TEXT NOT NULL`, `content TEXT NOT NULL`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL` |

**Indexes:**
- `idx_tasks_created_at` on `tasks(created_at)`
- `idx_messages_task_id` on `task_messages(task_id)`
- `idx_tasks_workspace_id` on `tasks(workspace_id)`
- `idx_knowledge_notes_workspace` on `knowledge_notes(workspace_id)`

## Repository API — Async Conversion

### StorageAPI Type

Every method that touches the DB becomes async:

```typescript
// Before:
getTasks(): StoredTask[]
saveTask(task: StoredTask): void
getAppSettings(): AppSettings

// After:
getTasks(): Promise<StoredTask[]>
saveTask(task: StoredTask): Promise<void>
getAppSettings(): Promise<AppSettings>
```

This affects all sub-interfaces: `TaskStorageAPI`, `AppSettingsAPI`, `ProviderSettingsAPI`, `SecureStorageAPI`, `ConnectorStorageAPI`, `SchedulerStorageAPI`, `DatabaseLifecycleAPI`.

### sql.js API Mapping

| better-sqlite3 | sql.js | Notes |
|---|---|---|
| `db.prepare(sql).get(params)` | `db.exec(sql, params)[0]` or prepared stmt `.getAsObject([param])` | Single-row reads |
| `db.prepare(sql).all(params)` | `db.exec(sql, params)` then map columns + values | Multi-row reads |
| `db.prepare(sql).run(params)` | `db.run(sql, params)` | Returns `{ lastInsertRowid, changes }` equivalent via `db.getRowsModified()` |
| `db.exec(sql)` | `db.exec(sql)` | Same method |
| `db.transaction(fn)()` | `withTransaction(db, fn)` | Manual BEGIN/COMMIT/ROLLBACK |
| `db.pragma(str)` | `db.exec('PRAGMA ' + str)` | Returns array-of-objects format |

### Repository Pattern

Each repository function converts to use sql.js's API directly:

```typescript
// Before:
export function getTheme(): ThemePreference {
  const db = getDatabase();
  const row = db.prepare('SELECT theme FROM app_settings WHERE id = 1').get() as any;
  return row?.theme ?? 'system';
}

// After:
export function getTheme(): ThemePreference {
  const db = getDatabase();
  const result = db.exec('SELECT theme FROM app_settings WHERE id = 1');
  const row = result[0]?.values[0];
  return (row?.[0] as string) ?? 'system';
}
```

For complex result mapping, a helper utility maps sql.js's `[columns, values]` format to objects:

```typescript
function rowsFromResult<T>(result: QueryExecResult[]): T[] {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  ) as T[];
}
```

Write functions call `flushDatabase()` after writes:
```typescript
export function setTheme(theme: ThemePreference): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET theme = ? WHERE id = 1', [theme]);
  flushDatabase();
}
```

Transaction-wrapped writes flush after the transaction:
```typescript
export function saveTask(task: StoredTask): void {
  const db = getDatabase();
  withTransaction(db, () => {
    // ... all writes ...
  });
  flushDatabase();
}
```

### Named Parameters

The one use of named `@param` parameters (`import-legacy-workspace-meta.ts`) is deleted, so all parameters use `?` positional params going forward.

## Callers & Daemon Impact

### Daemon (`apps/daemon/`)

- `storage-service.ts` — `initialize()` becomes `async initialize()`. `getRawDatabase()` returns `Database` from sql.js.
- `google-account-service.ts` — all DB methods become async. Constructor takes sql.js `Database` type.
- `legacy-import-service.ts` — **deleted**.
- `daemon/src/index.ts` — startup becomes `await storageService.initialize(dataDir)`. Crash recovery loop uses `await`.

### Desktop (`apps/desktop/`)

- No direct DB access (already the case). Path derivation functions stay sync.
- `desktop-main.test.ts` — remove `better-sqlite3` import assertion.
- `assert-packaging-invariants.cjs` — remove better-sqlite3 ABI assertions.

### Agent-core (`packages/agent-core/`)

- `factories/storage.ts` — `StorageAPI` methods are now async. `initialize()` returns `Promise<void>`.
- `myboteam-runtime-types.ts` — unchanged (doesn't pull in storage).
- All `StorageAPI` consumers add `await`.

### Tests

- All database test helpers switch from `better-sqlite3` to sql.js async init.
- `tests/globalSetup.ts` — remove ABI check for better-sqlite3, add sql.js WASM availability check.
- Dynamic `await import('better-sqlite3')` skip patterns replaced with sql.js setup.

## Startup Flow Change

```
Before: const storage = createStorage(); storage.initialize(); // synchronous
After:  const storage = createStorage(); await storage.initialize(); // async
```

The daemon's main entry point and all callers of `StorageAPI` methods add `await`.

## Files Summary

### New
- `packages/agent-core/src/storage/migrations/v001-init.ts`

### Deleted
- `packages/agent-core/src/storage/import-legacy-workspace-meta.ts`
- `packages/agent-core/src/storage/delete-legacy-workspace-meta.ts`
- `packages/agent-core/tests/unit/storage/delete-legacy-workspace-meta.test.ts`
- `packages/agent-core/tests/unit/storage/migrations/v028.test.ts`
- `packages/agent-core/tests/unit/storage/migrations/v030.test.ts`
- `packages/agent-core/tests/unit/storage/migrations/v031.test.ts`
- `packages/agent-core/tests/integration/legacy-meta-upgrade-happy-path.test.ts`
- `apps/daemon/src/legacy-import-service.ts`
- `scripts/check-native-abi.cjs`

### Modified
- `packages/agent-core/package.json` — swap dependencies
- `apps/daemon/package.json` — swap dependencies
- `pnpm-workspace.yaml` — swap catalog entries
- `packages/agent-core/src/storage/database.ts` — async sql.js init, flush, remove legacy
- `packages/agent-core/src/storage/migrations/index.ts` — single migration, new type
- `packages/agent-core/src/storage/migrations/errors.ts` — sql.js Database type
- `packages/agent-core/src/types/storage.ts` — all methods become `Promise<>`
- `packages/agent-core/src/factories/storage.ts` — async init, remove legacy params
- All 15 repository files in `packages/agent-core/src/storage/repositories/`
- `packages/agent-core/src/opencode/resolve-task-config.ts` — sql.js type
- `packages/agent-core/src/google-accounts/prepare-manifest.ts` — sql.js type
- `packages/agent-core/src/index.ts` / `common.ts` — re-exports if affected
- `apps/daemon/src/storage-service.ts` — async init, type changes
- `apps/daemon/src/google-account-service.ts` — async methods
- `apps/daemon/src/index.ts` — async startup
- `apps/desktop/src/main/store/storage.ts` — remove legacy DB path helpers
- `apps/desktop/scripts/assert-packaging-invariants.cjs` — remove better-sqlite3 assertions
- `packages/agent-core/tests/unit/desktop-main.test.ts` — remove better-sqlite3 assertion
- All test files using `better-sqlite3` — convert to sql.js

## Error Handling

- `FutureSchemaError` — kept, adapted for sql.js Database type
- `MigrationError` — kept, adapted for sql.js Database type
- `CorruptDatabaseError` — kept, `resetDatabase()` adapted for sql.js (no WAL sidecar cleanup needed beyond removing old files for migration compatibility)

## What We're Not Doing

- **No data migration path** — existing user DBs are discarded. Users start fresh.
- **No WAL mode** — sql.js doesn't support it; not needed for single-process access.
- **No named parameters** — all params use `?` positional syntax.
- **No `.immediate()` transactions** — single-process, no concurrent access concern.
- **No legacy workspace-meta import** — removed entirely.
- **No legacy electron-store import** — `legacy-import-service.ts` removed.