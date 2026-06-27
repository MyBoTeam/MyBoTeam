# Feature Specification: Schema Migrations Manager

**Feature Branch**: `003-schema-migrations-manager`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-143/m2-2-schema-migrations-manager"

**Linear Issue**: [MAO-143](https://linear.app/maor-innovations-ltd/issue/MAO-143/m2-2-schema-migrations-manager)

**Milestone**: M2 — Data Layer

**Blocked By**: M2-1

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Migration on Startup (Priority: P1)

When the application starts, the system automatically detects and applies any pending database schema migrations. The migrations manager checks the migration table for the current schema version, compares it against available migration files, and runs any new "up" migrations in sequence. This ensures the database is always up-to-date with the application code.

**Why this priority**: This is the core functionality that ensures the database schema stays synchronized with the application. Without this, the application cannot function correctly with schema changes.

**Independent Test**: Can be fully tested by starting the application with pending migrations and verifying they are applied in the correct order.

**Acceptance Scenarios**:

1. **Given** the database has no migration history, **When** the application starts, **Then** all migrations run in sequence and the migration table records the current version
2. **Given** the database is at version 1, **When** migrations v2 and v3 are available, **Then** only v2 and v3 run, and the version is updated to 3
3. **Given** the database is at the latest version, **When** the application starts, **Then** no migrations run
4. **Given** a migration is already applied, **When** the application starts, **Then** it is not re-applied

---

### User Story 2 - Migration Rollback (Priority: P2)

When a migration causes issues or a release needs to be reverted, the system provides a mechanism to roll back to a specific target version. This runs all intermediate down migrations in reverse order, returning the database to a known good state.

**Why this priority**: Rollback capability is essential for production safety and recovery, but is secondary to the core migration functionality.

**Independent Test**: Can be fully tested by applying multiple migrations, then rolling back to a specific version and verifying the schema reverts correctly.

**Acceptance Scenarios**:

1. **Given** migrations v1, v2, v3 are applied, **When** rollback is triggered to target version 1, **Then** v3 and v2 down migrations run in reverse order and the version reverts to 1
2. **Given** a down migration is not available for an intermediate migration, **When** rollback is attempted, **Then** an appropriate error is raised and no changes are made
3. **Given** a rollback completes successfully, **When** the migration table is queried, **Then** only migrations up to the target version are recorded

---

### User Story 3 - Idempotent Migration Execution (Priority: P1)

Migrations can be run multiple times without side effects. If a migration is already applied, running it again does nothing. This ensures safety in development environments where applications may be restarted frequently and in CI/CD pipelines where migrations may be triggered multiple times.

**Why this priority**: Idempotency is critical for reliability and must be present from the initial implementation to prevent data corruption or schema inconsistency.

**Independent Test**: Can be fully tested by running the same migration twice and verifying the database state is unchanged after the second run.

**Acceptance Scenarios**:

1. **Given** migration v1 is already applied, **When** the migration manager runs, **Then** v1 is skipped and no changes occur
2. **Given** the migration table is corrupted or missing, **When** the migration manager runs, **Then** it recreates the table and applies migrations from the beginning

---

### User Story 4 - Init Migration Consolidation (Priority: P2)

All existing migrations are consolidated into a single initialization migration file. This provides a clean starting point for new deployments while maintaining the ability to track incremental changes for existing databases.

**Why this priority**: This simplifies new deployments and reduces complexity, but existing systems can continue working with the current migration history.

**Independent Test**: Can be fully tested by deploying to a fresh database and verifying only the init migration runs.

**Acceptance Scenarios**:

1. **Given** a fresh database with no schema, **When** migrations run, **Then** only the init migration applies
2. **Given** an existing database at version N, **When** migrations run, **Then** only migrations after N apply (the init migration is skipped)

---

### User Story 5 - Seeding Mechanism (Priority: P3)

A basic seeding mechanism is available for inserting initial data after migrations. This provides a foundation for test data and default configurations, though the initial implementation will have no seeds.

**Why this priority**: This is a convenience feature that adds value but is not critical for the core migration functionality.

**Independent Test**: Can be fully tested by creating a seed file and verifying data is inserted after migrations.

**Acceptance Scenarios**:

1. **Given** migrations complete successfully, **When** seeding is enabled, **Then** seed files run in order
2. **Given** no seed files exist, **When** seeding is enabled, **Then** the process completes without error

---

### Edge Cases

- **Migration failure midway**: Transaction rolls back, migration version not recorded, `MigrationError` thrown with version and SQL details, application startup fails with clear error message
- **Database connection loss**: Migration transaction rolls back, lock released, `ConnectionError` thrown, application fails to start
- **Concurrent migration attempts**: Lock-based synchronization prevents race conditions; `LockError` thrown with lock holder info, second instance fails with "migration in progress" error
- **Missing down migration**: Rollback to target version fails with `RollbackError` if any intermediate migration lacks a down function
- **Version conflicts**: Migration file integrity validation prevents duplicate versions; `ValidationError` thrown with conflict details, system refuses to start

### Error Types

Implementation uses structured result objects (`MigrationResult`, `RollbackResult`, `SeedResult`) rather than thrown exception classes. Each result includes `success`, `error`, and `duration` fields.

| Error Pattern | When Occurs | Result Fields |
|---------------|-------------|---------------|
| Migration failure | Migration SQL execution fails | `success: false`, `error`, `version`, `name`, `duration` |
| Lock failure | Cannot acquire lock | `apply()` returns empty results (logs warning) |
| Rollback failure | Missing down migration or migration file not found | `success: false`, `error`, `rolledBackVersions`, `duration` |
| Validation failure | Migration file integrity fails | `validateMigration()` returns `false`, logs warning |
| Database connection loss | Transaction rolls back | `success: false`, `error` message includes connection details |

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain a migration table that tracks applied migration versions and names
- **FR-002**: System MUST run all pending "up" migrations on application startup in version order
- **FR-003**: System MUST provide "down" migrations for each "up" migration to enable rollback
- **FR-004**: System MUST be idempotent — running migrations multiple times produces the same result
- **FR-005**: System MUST merge all current migrations into a single init migration file for new deployments
- **FR-006**: System MUST create a seeding mechanism that runs after migrations complete
- **FR-007**: System MUST track migration metadata including version, name, and applied timestamp
- **FR-008**: System MUST prevent concurrent migration execution using lock-based synchronization with 30-second timeout (fail if lock is held; stale locks from crashed processes are automatically released)
- **FR-009**: System MUST log migration execution status and errors for debugging (testable: log output captured via test spy, assertions verify log format includes timestamp, level, migration version, and message)
- **FR-010**: System MUST validate migration file integrity before execution
- **FR-011**: System MUST wrap each migration in its own database transaction

### Key Entities

- **Migration**: Defined by FR-001, FR-003, FR-011 (version, name, up/down functions, transaction wrapping)
- **Migration Table**: Defined by FR-001, FR-007 (tracks versions, names, timestamps)
- **Migration File**: Physical file containing migration logic for a specific version
- **Seed File**: File containing data insertion logic to run after migrations (FR-006)
- **Migration Lock**: Defined by FR-008 (prevents concurrent execution with 30-second timeout)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Application starts with database schema synchronized in under 5 seconds for up to 50 migrations (measured from migration start to completion, including file loading, validation, and SQL execution)
- **SC-002**: Zero data loss during migration execution with proper transaction handling
- **SC-003**: 100% of existing migrations consolidated into init migration with no functional changes
- **SC-004**: Migration rollback completes in under 10 seconds for any single migration (measured from rollback start to completion, including transaction overhead and SQL execution)
- **SC-005**: System handles concurrent startup attempts without schema corruption (lock-based synchronization prevents race conditions)
- **SC-006**: All migrations are idempotent and can be run 100 times without side effects

## Assumptions

- The application uses better-sqlite3 for database operations (as indicated in the issue)
- The database schema is defined through SQL migration files
- Migrations are executed in a single-threaded manner within the application lifecycle
- The migration table is stored in the same database as the application data
- Existing migration patterns from v0.2.0 (using sql.js) can be adapted for better-sqlite3
- The seeding mechanism is a foundation for future use, with no initial seeds required
- Migrations are stored in a known directory structure within the project
- The application has write access to the database file on startup

## Clarifications

### Session 2026-06-26

- Q: How should migration versions be formatted? → A: Sequential integers (1, 2, 3)
- Q: How should migrations be triggered? → A: Automatic on application startup
- Q: How should database transactions be handled during migrations? → A: Each migration wrapped in its own transaction
- Q: How should rollback (down migrations) work? → A: Roll back to a specific target version (e.g., v5 → v2), running all intermediate down migrations
- Q: How should the system handle concurrent migration attempts? → A: Lock-based: acquire lock before migration, fail if locked
