# Research: Schema Migrations Manager

**Feature**: Schema Migrations Manager
**Date**: 2026-06-26
**Status**: Complete

## Research Tasks

### 1. better-sqlite3 Transaction API

**Task**: Investigate better-sqlite3 transaction API for migration wrapping

**Finding**:
- better-sqlite3 supports synchronous transactions via `db.transaction()` wrapper
- Transaction types: `IMMEDIATE`, `EXCLUSIVE`, `DEFERRED`
- For migrations, use `IMMEDIATE` to prevent concurrent writes
- Transaction automatically rolls back on error

**Decision**: Use `db.transaction()` with `IMMEDIATE` type for each migration

**Rationale**: 
- Synchronous API matches better-sqlite3's synchronous design
- `IMMEDIATE` prevents write conflicts during migration
- Automatic rollback on error ensures atomicity

**Alternatives Considered**:
- Manual BEGIN/COMMIT/ROLLBACK: More control but error-prone
- DEFERRED transaction: Less protection against concurrent writes

### 2. Lock-Based Synchronization Patterns

**Task**: Research lock-based synchronization patterns for SQLite

**Finding**:
- SQLite supports advisory locks via `PRAGMA lock_status`
- File-based locking using `fcntl` or `flock` for cross-process synchronization
- For single-process (daemon), in-memory lock flag is sufficient
- For multi-process (multiple app instances), file-based lock is needed

**Decision**: Use file-based lock (`.local-data/migration.lock`) for cross-process synchronization

**Rationale**:
- Multiple app instances may start simultaneously
- File-based lock prevents race conditions across processes
- Lock file is simple to implement and debug

**Alternatives Considered**:
- In-memory lock: Only works within single process
- Database-level lock: Conflicts with application data access
- Mutex library: Over-engineered for this use case

### 3. Migration File Organization

**Task**: Find best practices for migration file organization and versioning

**Finding**:
- Sequential numbering: `001_create_users.sql`, `002_add_email.sql`
- Single directory: `migrations/` with all files
- Each file contains up and down functions
- Metadata file tracks applied migrations

**Decision**: Sequential numbering with single directory structure

**Rationale**:
- Simple to understand and maintain
- Matches spec requirement for sequential integers
- Easy to consolidate into init migration

**Alternatives Considered**:
- Timestamp-based: More complex, less predictable
- Semantic versioning: Over-engineered for simple migrations
- Multiple directories: Unnecessary complexity

### 4. Init Migration Consolidation

**Task**: Investigate init migration consolidation techniques

**Finding**:
- Combine all existing migrations into single `001_init.sql`
- Mark as init migration with special flag
- New databases apply only init migration
- Existing databases skip init migration (version > 1)

**Decision**: Create `001_init.sql` containing all current schema

**Rationale**:
- Simplifies new deployments
- Maintains backward compatibility for existing databases
- Reduces migration count for fresh installs

**Alternatives Considered**:
- Keep all migrations: More complex for new deployments
- Generate init from existing migrations: Adds build complexity

### 5. Seed File Patterns

**Task**: Research seed file patterns for database initialization

**Finding**:
- Seed files run after migrations complete
- Each seed file is idempotent (can run multiple times)
- Seeds are optional (no initial seeds required)
- Seed files stored in separate `seeds/` directory

**Decision**: Create seed manager with empty seed registry

**Rationale**:
- Provides foundation for future use
- No initial seeds required per spec
- Simple interface for adding seeds later

**Alternatives Considered**:
- Inline seeding in migrations: Couples schema and data
- External seed tool: Over-engineered for initial implementation

## Summary

| Research Area | Decision | Confidence |
|---------------|----------|------------|
| Transaction API | `db.transaction()` with `IMMEDIATE` | High |
| Lock Synchronization | File-based lock (`.local-data/migration.lock`) | High |
| Migration Organization | Sequential numbering, single directory | High |
| Init Consolidation | `001_init.sql` with all current schema | High |
| Seed Pattern | Empty seed registry with manager | High |

## Open Questions

None. All research tasks completed with clear decisions.

## Recommendations

1. Implement migration manager with file-based lock for cross-process safety
2. Use `db.transaction()` with `IMMEDIATE` type for atomic migrations
3. Create `001_init.sql` consolidating all existing migrations
4. Implement seed manager with empty registry for future extensibility
5. Add comprehensive unit and integration tests for all migration operations
