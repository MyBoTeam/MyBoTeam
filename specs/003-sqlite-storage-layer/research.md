# Research: SQLite Storage Layer (better-sqlite3, WAL)

**Date**: 2026-06-25
**Feature**: M2-1 SQLite Storage Layer
**Source Reference**: v0.2.0 `packages/daemon/src/database-service.ts`, `packages/daemon/src/migrations/*.ts`

## v0.2.0 Source Analysis

### DatabaseService Pattern (v0.2.0)

**File**: `packages/daemon/src/database-service.ts` (126 lines)

Key patterns to preserve:
1. **Initialization**: Async `initialize(dataDir?)` with optional filesystem persistence
2. **Checkpoint timer**: `setInterval` for periodic saves (30s), `.unref()` to not block exit
3. **Process exit handler**: `process.on('exit', ...)` to save on shutdown
4. **In-memory mode**: `new SQL.Database()` when no dataDir provided (tests)
5. **Table count helper**: `getTableCount(table)` for validation
6. **Destroy/cleanup**: `destroy()` calls `close()` for cleanup

**Migration from sql.js to better-sqlite3**:
- Remove checkpoint timer (WAL mode handles persistence automatically)
- Remove `saveToDisk()` (better-sqlite3 writes directly)
- Remove `export()`/`writeFileSync()` (not needed)
- Keep `initialize(dataDir?)` pattern for data directory management
- Keep `close()` and `destroy()` patterns

### Migration Pattern (v0.2.0)

**File**: `packages/daemon/src/migrations/index.ts` (7 lines)

```typescript
export interface Migration {
  version: number;
  name: string;
  up: (db: Database) => void;
}
```

**Applied migrations tracking**:
```sql
CREATE TABLE IF NOT EXISTS _migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
)
```

**Migration runner**: Sort by version, check applied versions, run missing migrations.

### Schema Differences (v0.2.0 → v0.5.0)

| v0.2.0 Table | v0.5.0 Table | Changes |
|--------------|--------------|---------|
| `agent_registry` | `agent` | Renamed, removed: capabilities, role, config_json, metadata, secrets, skills, mcp_servers, resource_limits, last_seen_at |
| `tasks` | `task` | Renamed, changed: description → title, added: verification_status, continuation_count |
| `conversations` | `conversation` | Renamed, removed: status, error, is_archived, started_at, completed_at |
| `messages` | `message` | Renamed, same structure |
| `mcps` | `mcp_server` | Renamed, removed: enabled, added: status CHECK constraint |
| — | `task_todo` | New |
| — | `memory_entry` | New |
| — | `agent_mcp_assignment` | New join table |
| — | `note` | New |
| — | `schedule` | New |
| — | `document_version` | New |

### Dependencies (v0.2.0)

```json
{
  "sql.js": "^1.11.0",
  "pino": "^9.0.0",
  "zod": "^4.4.3"
}
```

**v0.5.0 replacement**:
- `sql.js` → `better-sqlite3` (synchronous, WAL mode)
- `pino` → keep (structured logging)
- `zod` → keep (validation)

## Research Tasks

### 1. better-sqlite3 WAL Mode Setup

**Decision**: Use `db.pragma('journal_mode = WAL')` with additional recommended pragmas.

**Rationale**: better-sqlite3 documentation and community best practices recommend these pragmas for production use:

```typescript
db.pragma('journal_mode = WAL');          // Concurrent reads during writes
db.pragma('foreign_keys = ON');           // Enforce FK constraints (OFF by default!)
db.pragma('busy_timeout = 5000');         // Wait 5s instead of throwing SQLITE_BUSY
db.pragma('synchronous = NORMAL');        // Safe with WAL, better performance than FULL
db.pragma('cache_size = -20000');         // 20MB cache (negative = KB)
db.pragma('temp_store = MEMORY');         // Keep temp tables/indexes in memory
```

**Alternatives considered**:
- `synchronous = FULL`: Safer but slower; NORMAL is safe with WAL mode per SQLite docs
- No pragmas: Foreign keys are OFF by default in SQLite — must enable explicitly

**Source**: better-sqlite3 docs, tessl-labs/sqlite-node-best-practices (97% quality score)

### 2. UUID Generation

**Decision**: Use `crypto.randomUUID()` (Node.js built-in, stable since v19).

**Rationale**: No external dependency needed. Returns UUIDv4 string. Node.js 24 is the target runtime.

**Alternatives considered**:
- `uuid` package v9+: Extra dependency; `crypto.randomUUID()` is equivalent
- Sequential integer IDs: Less suitable for distributed/local-first systems; AD.md specifies UUID

**Source**: Node.js crypto docs, AD.md ER diagram (uuid type for all PKs)

### 3. Migration Strategy

**Decision**: Single consolidated init migration using `CREATE TABLE IF NOT EXISTS` pattern.

**Rationale**: 
- Feature spec requires consolidating all v0.2.0 migrations into single init migration
- `IF NOT EXISTS` makes initialization idempotent (FR-009)
- No need for external migration library — single migration is sufficient
- Track applied migrations in a `_migrations` table for future extensibility

**Alternatives considered**:
- `@blackglory/better-sqlite3-migrations`: Uses `user_version` pragma; overkill for single migration
- Versioned migration files: Good for evolving schemas but adds complexity beyond this feature's scope

**Source**: better-sqlite3-migrations npm package, SQLite PRAGMA user_version docs

### 4. Structured JSON Logging

**Decision**: Use Pino for structured JSON logging with correlation IDs.

**Rationale**:
- Pino is the standard for Node.js structured logging (50k+ msgs/sec, 10x faster than Winston)
- NDJSON format (one JSON object per line) is streamable and appendable
- Correlation IDs via child loggers or AsyncLocalStorage
- Built-in redaction for sensitive fields
- Environment-variable-based log level (LOG_LEVEL)

**Alternatives considered**:
- Winston: Slower (5k msgs/sec), more complex setup, unnecessary for this use case
- console.log: No structure, no levels, no correlation — fails FR-014

**Source**: Pino docs, jsonic.io JSON logging guide, multiple 2026 production guides

### 5. Error Handling Pattern

**Decision**: Wrap better-sqlite3 errors in typed error classes.

**Rationale**:
- better-sqlite3 throws `SqliteError` (extends Error) for DB operations
- Typed errors enable callers to handle specific failure modes
- Pattern: `DatabaseError` (DB failures), `NotFoundError` (missing records), `ValidationError` (constraint violations)

**Alternatives considered**:
- Result objects `{ ok: true, data }` / `{ ok: false, error }`: More verbose, less idiomatic in TypeScript
- Pass-through `SqliteError`: Callers can't distinguish failure modes

**Source**: better-sqlite3 API docs, TypeScript error handling best practices

### 6. TypeScript Integration

**Decision**: Use `import Database from 'better-sqlite3'` with `esModuleInterop: true`.

**Rationale**:
- better-sqlite3 provides built-in TypeScript types via `@types/better-sqlite3`
- `esModuleInterop` resolves the constructor/type import issue
- Synchronous API simplifies TypeScript typing (no Promise generics needed)

**Alternatives considered**:
- Wrapper class: Adds unnecessary abstraction layer
- `import * as BetterSqlite3`: Requires workaround for constructor usage

**Source**: Stack Overflow TypeScript + better-sqlite3 patterns, @types/better-sqlite3 docs

## Summary

| Decision | Choice | Confidence |
|----------|--------|------------|
| WAL mode setup | Pragmas: WAL, foreign_keys, busy_timeout, synchronous=NORMAL | High |
| UUID generation | `crypto.randomUUID()` (built-in) | High |
| Migration strategy | Single consolidated init migration with IF NOT EXISTS | High |
| Structured logging | Pino with correlation IDs | High |
| Error handling | Typed error classes wrapping SqliteError | High |
| TypeScript integration | esModuleInterop + @types/better-sqlite3 | High |
