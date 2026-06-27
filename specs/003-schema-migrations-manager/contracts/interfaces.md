# Interface Contracts: Schema Migrations Manager

**Feature**: Schema Migrations Manager
**Date**: 2026-06-27
**Status**: Updated to match implementation

## MigrationManager Interface

```typescript
class MigrationManager {
  constructor(config: MigrationManagerConfig);

  /**
   * Initialize migration table schema.
   */
  initializeSchema(): Promise<void>;

  /**
   * Acquire lock for migration execution.
   * Uses file-based lock with timeout.
   */
  acquireLock(): Promise<boolean>;

  /**
   * Release migration lock.
   */
  releaseLock(): Promise<void>;

  /**
   * Load all migration files from migrations directory.
   */
  loadMigrations(): Promise<Migration[]>;

  /**
   * Load migration from JSON content (for testing).
   */
  loadMigrationFromJson(jsonContent: string): Migration | null;

  /**
   * Load migration from JSON content without validation (for testing).
   */
  loadMigrationFromJsonUnsafe(jsonContent: string): Migration | null;

  /**
   * Validate migration structure.
   */
  validateMigration(migration: unknown): boolean;

  /**
   * Validate migration sequence (no gaps, no duplicates).
   */
  validateMigrationSequence(migrations: Migration[]): boolean;

  /**
   * Get applied migrations from database.
   */
  getAppliedMigrations(): Promise<MigrationRecord[]>;

  /**
   * Get pending migrations (not yet applied).
   */
  getPendingMigrations(): Promise<Migration[]>;

  /**
   * Get migration status.
   * Returns current version, applied, and pending migrations.
   */
  status(): Promise<{
    currentVersion: number | null;
    applied: MigrationRecord[];
    pending: Migration[];
  }>;

  /**
   * Apply a single migration.
   * Wraps in IMMEDIATE transaction. Returns structured result.
   */
  applyMigration(migration: Migration): Promise<MigrationResult>;

  /**
   * Rollback a single migration.
   * Wraps in IMMEDIATE transaction. Returns structured result.
   */
  rollbackMigration(migration: Migration): Promise<MigrationResult>;

  /**
   * Apply all pending migrations.
   * Acquires lock, applies in version order, releases lock.
   * Returns array of results per migration.
   */
  apply(): Promise<MigrationResult[]>;

  /**
   * Rollback to target version.
   * Runs down migrations in reverse order for versions > target.
   * Returns structured result with rolled-back versions.
   */
  rollback(targetVersion: number): Promise<RollbackResult>;
}
```

## Migration Interface

```typescript
interface Migration {
  /** Sequential version number (positive integer) */
  version: number;

  /** Human-readable migration name */
  name: string;

  /**
   * Apply migration to database.
   * @param db - better-sqlite3 database instance
   */
  up(db: Database): void;

  /**
   * Rollback migration from database.
   * @param db - better-sqlite3 database instance
   */
  down(db: Database): void;
}
```

## SeedManager Interface

```typescript
class SeedManager {
  constructor(config: SeedManagerConfig);

  /**
   * Initialize seed table schema.
   */
  initializeSchema(): Promise<void>;

  /**
   * Get applied seeds from database.
   */
  getAppliedSeeds(): Promise<SeedRecord[]>;

  /**
   * Get pending seeds (not yet applied).
   */
  getPendingSeeds(): Promise<Seed[]>;

  /**
   * Load all seed files from seeds directory.
   */
  loadSeeds(): Promise<Seed[]>;

  /**
   * Load seed from JSON content (for testing).
   */
  loadSeedFromJson(jsonContent: string): Seed | null;

  /**
   * Validate seed structure.
   */
  validateSeed(seed: unknown): boolean;

  /**
   * Execute a single seed.
   * Wraps in IMMEDIATE transaction. Returns structured result.
   */
  executeSeed(seed: Seed): Promise<SeedResult>;

  /**
   * Rollback a single seed.
   * Wraps in IMMEDIATE transaction. Returns structured result.
   */
  rollbackSeed(seed: Seed): Promise<SeedResult>;

  /**
   * Apply all pending seeds.
   * Seeds run in order (no lock — single-process assumption).
   */
  apply(): Promise<SeedResult[]>;

  /**
   * Rollback all applied seeds in reverse order.
   */
  rollbackAll(): Promise<SeedResult[]>;
}
```

## Seed Interface

```typescript
interface Seed {
  /** Unique seed name */
  name: string;

  /** Execution order (lower runs first) */
  order: number;

  /**
   * Insert seed data into database.
   * @param db - better-sqlite3 database instance
   */
  seed(db: Database): void;

  /**
   * Remove seed data from database.
   * @param db - better-sqlite3 database instance
   */
  rollback(db: Database): void;
}
```

## Result Types

```typescript
interface MigrationResult {
  /** Whether operation succeeded */
  success: boolean;

  /** Version that was applied or rolled back */
  version: number;

  /** Migration name */
  name: string;

  /** Error message if failed */
  error?: string;

  /** Duration in milliseconds */
  duration: number;
}

interface RollbackResult {
  /** Whether rollback was successful */
  success: boolean;

  /** Target version */
  targetVersion: number;

  /** Versions that were rolled back */
  rolledBackVersions: number[];

  /** Error message if failed */
  error?: string;

  /** Total duration in milliseconds */
  duration: number;
}

interface SeedResult {
  /** Whether operation succeeded */
  success: boolean;

  /** Seed name */
  name: string;

  /** Error message if failed */
  error?: string;

  /** Duration in milliseconds */
  duration: number;
}

interface MigrationRecord {
  /** Migration version number */
  version: number;

  /** Migration name */
  name: string;

  /** Timestamp when migration was applied (ISO 8601) */
  applied_at: string;
}

interface SeedRecord {
  /** Seed name */
  name: string;

  /** Timestamp when seed was applied (ISO 8601) */
  applied_at: string;
}
```

## Configuration Types

```typescript
interface MigrationManagerConfig {
  /** Path to migrations directory */
  migrationsPath: string;

  /** Database instance */
  db: Database;

  /** Lock file path (default: .local-data/migration.lock) */
  lockFilePath?: string;

  /** Lock timeout in milliseconds (default: 30000) */
  lockTimeout?: number;

  /** Logger instance */
  logger?: Logger;
}

interface SeedManagerConfig {
  /** Path to seeds directory */
  seedsPath: string;

  /** Database instance */
  db: Database;

  /** Logger instance */
  logger?: Logger;
}

interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}
```

## Usage Examples

### Apply Migrations

```typescript
import { MigrationManager } from '@myboteam/agent-core/storage';
import Database from 'better-sqlite3';

const db = new Database('.local-data/myboteam.db');
const manager = new MigrationManager({
  db,
  migrationsPath: './migrations',
});

const results = await manager.apply();

results.forEach(r => {
  if (r.success) {
    console.log(`Applied ${r.name} (v${r.version}) in ${r.duration}ms`);
  } else {
    console.error(`Failed ${r.name}: ${r.error}`);
  }
});
```

### Rollback to Target Version

```typescript
const result = await manager.rollback(1);

if (result.success) {
  console.log(`Rolled back ${result.rolledBackVersions.length} migrations`);
} else {
  console.error(`Rollback failed: ${result.error}`);
}
```

### Check Status

```typescript
const status = await manager.status();

console.log(`Current version: ${status.currentVersion}`);
console.log(`Applied: ${status.applied.length}`);
console.log(`Pending: ${status.pending.length}`);
```

### Run Seeds

```typescript
import { SeedManager } from '@myboteam/agent-core/storage';

const seedManager = new SeedManager({
  db,
  seedsPath: './seeds',
});

const results = await seedManager.apply();

results.forEach(r => {
  if (r.success) {
    console.log(`Applied ${r.name} in ${r.duration}ms`);
  } else {
    console.error(`Failed ${r.name}: ${r.error}`);
  }
});
```

## Notes

- **Error handling**: All operations return structured result objects (not thrown exceptions). Check `result.success` for success/failure.
- **Concurrency**: MigrationManager uses file-based lock (30s timeout). SeedManager does not use locks (single-process assumption).
- **Transactions**: Each migration and seed is wrapped in its own `BEGIN IMMEDIATE` transaction.
- **Testing**: Use `loadMigrationFromJson()` and `loadSeedFromJson()` for test convenience.
