# Quickstart: Schema Migrations Manager

**Feature**: Schema Migrations Manager
**Date**: 2026-06-27
**Status**: Complete

## Overview

The Schema Migrations Manager provides automatic database schema synchronization for better-sqlite3. It runs pending migrations on application startup, supports rollback to target versions, and ensures idempotent execution.

## Prerequisites

- Node.js 18+
- better-sqlite3 installed
- TypeScript configured

## Installation

The migration manager is part of `packages/agent-core`. No separate installation required.

## Basic Usage

### 1. Initialize Migration Manager

```typescript
import { MigrationManager } from '@myboteam/agent-core/storage';
import Database from 'better-sqlite3';

const db = new Database('.local-data/myboteam.db');
const migrationsDir = './migrations';

const manager = new MigrationManager({
  db,
  migrationsPath: migrationsDir,
  lockFilePath: '.local-data/migration.lock',
  lockTimeout: 30000,
});
```

### 2. Apply Migrations on Startup

```typescript
// In your application startup code
async function startApp() {
  const manager = new MigrationManager({
    db,
    migrationsPath: './migrations',
  });
  
  try {
    const results = await manager.apply();
    
    if (results.length > 0) {
      console.log(`Applied ${results.length} migrations`);
      results.forEach(r => {
        console.log(`  - ${r.name} (v${r.version}) in ${r.duration}ms`);
      });
    } else {
      console.log('No pending migrations');
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}
```

### 3. Create Migration Files

```typescript
// migrations/001_create_users.ts
export default {
  version: 1,
  name: 'create_users',
  up: (db: Database) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  },
  down: (db: Database) => {
    db.exec('DROP TABLE IF EXISTS users;');
  }
};
```

### 4. Rollback Migrations

```typescript
// Rollback to version 1 (removes versions 2 and 3)
const result = await manager.rollback(1);

if (result.success) {
  console.log(`Rolled back to version ${result.targetVersion}`);
  console.log(`Rolled back versions: ${result.rolledBackVersions.join(', ')}`);
}
```

### 5. Get Migration Status

```typescript
const applied = await manager.getAppliedMigrations();
const pending = await manager.getPendingMigrations();

console.log(`Applied migrations: ${applied.length}`);
console.log(`Pending migrations: ${pending.length}`);
```

## File Structure

```
packages/agent-core/
├── src/
│   └── storage/
│       ├── migrations/
│       │   ├── manager.ts        # MigrationManager orchestration
│       │   ├── lock.ts           # File-based lock mechanism
│       │   ├── validator.ts      # Migration validation
│       │   ├── loader.ts         # File loading and JSON parsing
│       │   ├── 001_init.ts       # Init migration for new deployments
│       │   ├── types.ts          # TypeScript types and interfaces
│       │   └── index.ts          # Exports
│       ├── seeds/
│       │   ├── manager.ts        # SeedManager orchestration
│       │   ├── validator.ts      # Seed validation
│       │   ├── loader.ts         # Seed file loading
│       │   ├── types.ts          # TypeScript types and interfaces
│       │   └── index.ts          # Exports
│       └── index.ts              # Storage module exports
└── tests/
    ├── unit/
    │   └── storage/
    │       ├── migrations/
    │       │   └── manager.test.ts
    │       └── seeds/
    │           └── manager.test.ts
    └── integration/
        └── storage/
            ├── migrations/
            │   ├── manager.test.ts
            │   └── performance.test.ts
            └── seeds/
                └── manager.test.ts
```

## Configuration

### Database Path

```typescript
// Default path
const db = new Database('.local-data/myboteam.db');

// Custom path (via environment variable)
const dbPath = process.env.MYBOTEAM_DATA_DIR || '.local-data';
const db = new Database(`${dbPath}/myboteam.db`);
```

### Migration Directory

```typescript
// Default directory
const migrationsDir = './migrations';

// Custom directory
const migrationsDir = process.env.MIGRATIONS_DIR || './migrations';
```

### Lock File

```typescript
// Default lock file path
const lockFile = '.local-data/migration.lock';

// Lock timeout (default: 30 seconds)
const lockTimeout = 30000;
```

## Error Handling

The migration manager returns structured results for each operation:

### Migration Result

```typescript
const results = await manager.apply();

results.forEach(result => {
  if (result.success) {
    console.log(`Migration ${result.name} applied in ${result.duration}ms`);
  } else {
    console.error(`Migration ${result.name} failed: ${result.error}`);
  }
});
```

### Rollback Result

```typescript
const result = await manager.rollback(1);

if (result.success) {
  console.log(`Rolled back ${result.rolledBackVersions.length} migrations`);
} else {
  console.error(`Rollback failed: ${result.error}`);
}
```

## Testing

### Run All Tests

```bash
cd packages/agent-core
pnpm test
```

### Run Unit Tests

```bash
pnpm test -- --reporter=verbose tests/unit/storage/migrations/
pnpm test -- --reporter=verbose tests/unit/storage/seeds/
```

### Run Integration Tests

```bash
pnpm test -- --reporter=verbose tests/integration/storage/migrations/
pnpm test -- --reporter=verbose tests/integration/storage/seeds/
```

### Run Performance Tests

```bash
pnpm test -- --reporter=verbose tests/integration/storage/migrations/performance.test.ts
```

## Testing with JSON Migrations

For testing, you can load migrations from JSON:

```typescript
const migrationJson = {
  version: 1,
  name: 'create_users_table',
  upSql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)',
  downSql: 'DROP TABLE IF EXISTS users',
};

const migration = manager.loadMigrationFromJson(JSON.stringify(migrationJson));
await manager.applyMigration(migration!);
```

## Best Practices

### Migration Design

1. **Keep migrations small**: One logical change per migration
2. **Make migrations idempotent**: Use `IF NOT EXISTS` for tables
3. **Always provide down function**: Enable rollbacks
4. **Test both directions**: Verify up and down work correctly

### Transaction Safety

1. **Wrap each migration in a transaction**: Ensure atomicity
2. **Use IMMEDIATE transactions**: Prevent write conflicts
3. **Handle errors gracefully**: Rollback on any failure

### Lock Management

1. **Acquire lock before starting**: Prevent concurrent execution
2. **Release lock on completion**: Even on failure
3. **Handle stale locks**: Check if lock-holding process is alive

### Seeding

1. **Single-process assumption**: SeedManager does not use file-based locks. Seeds are designed for single-process execution (e.g., application startup).
2. **Run after migrations**: Seeds depend on tables created by migrations. Always call `manager.apply()` before `seedManager.apply()`.
3. **Idempotent seeds**: Each seed tracks its name in `schema_seeds` table. Re-running skips already-applied seeds.

### Testing

1. **Use in-memory database**: Fast, isolated tests
2. **Test rollback scenarios**: Verify down migrations work
3. **Test concurrent access**: Verify lock prevents race conditions
4. **Test error handling**: Verify graceful failure

## Troubleshooting

### Lock Stuck

```bash
# Check lock file
cat .local-data/migration.lock

# Remove stale lock (if process is dead)
rm .local-data/migration.lock
```

### Database Corrupted

```bash
# Backup database
cp .local-data/myboteam.db .local-data/myboteam.db.backup

# Delete database and re-apply migrations
rm .local-data/myboteam.db
# Restart application - migrations will be applied automatically
```

## API Reference

See `contracts/interfaces.md` for complete API documentation.
