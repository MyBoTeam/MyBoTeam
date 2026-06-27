# Data Model: Schema Migrations Manager

**Feature**: Schema Migrations Manager
**Date**: 2026-06-26
**Status**: Complete

## Entities

### Migration

Represents a single schema change with version, name, up function, and down function.

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| version | integer | Sequential version number | PRIMARY KEY, AUTOINCREMENT |
| name | string | Human-readable migration name | NOT NULL, UNIQUE |
| applied_at | timestamp | When migration was applied | DEFAULT CURRENT_TIMESTAMP |

**Validation Rules**:
- Version must be positive integer
- Name must be non-empty string
- applied_at must be valid ISO timestamp

**State Transitions**:
- Pending → Applied (when migration runs successfully)
- Applied → Removed (when migration is rolled back)

### Migration Table

Database table tracking applied migrations.

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Indexes**:
- PRIMARY KEY on version (automatic)
- UNIQUE on name (prevents duplicate migration names)

### Migration Lock

Mechanism to prevent concurrent migration execution.

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| lock_key | string | Lock identifier | PRIMARY KEY |
| locked_at | timestamp | When lock was acquired | NOT NULL |
| process_id | string | Process holding the lock | NOT NULL |

**Implementation**: File-based lock at `.local-data/migration.lock`

**Lock Protocol**:
1. Check if lock file exists
2. If exists, read process_id and check if process is still running
3. If process is dead, remove lock file and proceed
4. If process is alive, fail with "migration in progress" error
5. If lock file doesn't exist, create it with current process_id
6. Release lock after migration completes (success or failure)

### Migration File

Physical file containing migration logic for a specific version.

**File Structure**:
```
migrations/
├── 001_init.sql          # Consolidated init migration
├── 002_add_users.sql     # Individual migration
└── index.ts              # Migration registry
```

**File Format** (TypeScript):
```typescript
export default {
  version: 1,
  name: 'init',
  up: (db: Database) => {
    // Apply migration
  },
  down: (db: Database) => {
    // Rollback migration
  }
};
```

### Seed File

File containing data insertion logic to run after migrations.

**File Structure**:
```
seeds/
├── index.ts              # Seed registry
└── (empty initially)     # No seeds required
```

**File Format** (TypeScript):
```typescript
export default {
  name: 'seed_name',
  order: 1,
  seed: (db: Database) => {
    // Insert seed data
  }
};
```

## Relationships

```
Migration (1) ←→ (N) Migration File
    │
    └── tracks applied migrations

Migration Lock (1) ←→ (1) Migration Manager
    │
    └── prevents concurrent execution

Seed Manager (1) ←→ (N) Seed File
    │
    └── runs seeds after migrations
```

## Data Flow

### Migration Apply Flow

```
1. Acquire lock (check/create lock file)
2. Read migration table (get current version)
3. Load migration files (from migrations/ directory)
4. Filter pending migrations (version > current)
5. For each pending migration:
   a. Begin transaction (IMMEDIATE)
   b. Execute up function
   c. Insert migration record
   d. Commit transaction
6. Release lock
7. Log completion
```

### Migration Rollback Flow

```
1. Acquire lock (check/create lock file)
2. Read migration table (get current version)
3. Load migration files (from migrations/ directory)
4. Filter migrations to rollback (version > target)
5. For each migration to rollback (reverse order):
   a. Begin transaction (IMMEDIATE)
   b. Execute down function
   c. Delete migration record
   d. Commit transaction
6. Release lock
7. Log completion
```

### Seed Flow

```
1. Check if seeds exist (from seeds/ directory)
2. If no seeds, return success
3. Load seed files (sorted by order)
4. For each seed file:
   a. Begin transaction
   b. Execute seed function
   c. Commit transaction
5. Log completion
```

## Validation Rules

### Migration Validation

- Version must be positive integer
- Name must be non-empty and unique
- Up function must be defined
- Down function is optional (for rollback support)
- Migration file must be syntactically valid

### Lock Validation

- Lock file must be valid JSON
- locked_at must be valid ISO timestamp
- process_id must match running process (or be stale)
- Lock timeout: 30 seconds (configurable)

### Seed Validation

- Name must be non-empty and unique
- Order must be positive integer
- Seed function must be defined
- Seed files must be syntactically valid

## Constraints

### Database Constraints

- Foreign keys: ON (enforced by better-sqlite3)
- WAL mode: Enabled for concurrent reads
- Busy timeout: 5000ms (5 seconds)

### Migration Constraints

- Sequential versioning: No gaps allowed
- Immutable released migrations: Cannot modify applied migrations
- Atomic transactions: Each migration in its own transaction
- Lock-based concurrency: Prevents race conditions

### Seed Constraints

- Idempotent: Seeds must be safe to run multiple times
- Ordered: Seeds run in specified order
- Optional: No seeds required initially
