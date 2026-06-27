# Implementation Plan: Schema Migrations Manager

**Branch**: `003-schema-migrations-manager` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-schema-migrations-manager/spec.md`

**Note**: This template is filled in by the `/spec.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement a schema migrations manager for better-sqlite3 that automatically applies pending migrations on application startup, supports rollback to target versions, and provides idempotent execution. The manager uses sequential integer versioning, lock-based concurrency control, and transaction wrapping per migration. All existing migrations will be consolidated into a single init migration file for new deployments.

## Technical Context

**Language/Version**: TypeScript (Node.js)

**Primary Dependencies**: better-sqlite3 (synchronous SQLite driver)

**Storage**: better-sqlite3 (WAL mode, same database as application data)

**Testing**: Vitest (unit + integration tests)

**Target Platform**: Desktop application (Electron)

**Project Type**: Monorepo (packages/agent-core, packages/daemon, packages/web, packages/desktop)

**Performance Goals**: Application starts with database schema synchronized in under 5 seconds for up to 50 migrations

**Constraints**: Each migration wrapped in its own transaction; lock-based concurrency prevents race conditions

**Scale/Scope**: Single-user desktop application; migrations run on startup; max 50 migrations expected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Alignment | Notes |
|-----------|-----------|-------|
| Spec-Driven Dev | ✅ Compliant | Spec completed with user stories, acceptance scenarios, and measurable success criteria |
| Test-First Quality | ✅ Compliant | Unit tests for migration apply/rollback; integration tests for transaction handling |
| Simplicity & Surgical Changes | ✅ Compliant | Minimal code: migration manager, migration table, lock mechanism |
| Human Oversight | ✅ Plan reviewed; tasks classified [SYNC]/[ASYNC] |
| Observability, Security & Immutability | ✅ Compliant | Migration logging; lock prevents concurrent execution; immutable released migrations |
| Code Structure & Cleanliness | ✅ Compliant | Split into manager.ts, lock.ts, validator.ts, loader.ts; small focused functions |

## Project Structure

### Documentation (this feature)

```text
specs/003-schema-migrations-manager/
├── plan.md              # This file (/spec.plan command output)
├── research.md          # Phase 0 output (/spec.plan command)
├── data-model.md        # Phase 1 output (/spec.plan command)
├── quickstart.md        # Phase 1 output (/spec.plan command)
├── contracts/           # Phase 1 output (/spec.plan command)
└── tasks.md             # Phase 2 output (/spec.tasks command - NOT created by /spec.plan)
```

### Source Code (repository root)

```text
packages/agent-core/
├── src/
│   └── storage/
│       ├── index.ts              # Storage exports
│       ├── migrations/
│       │   ├── manager.ts        # Migration manager orchestration
│       │   ├── lock.ts           # File-based lock mechanism
│       │   ├── validator.ts      # Migration validation
│       │   ├── loader.ts         # File loading and JSON parsing
│       │   ├── 001_init.ts       # Init migration for new deployments
│       │   ├── types.ts          # Migration types and interfaces
│       │   └── index.ts          # Migrations exports
│       └── seeds/
│           ├── manager.ts        # Seed manager orchestration
│           ├── validator.ts      # Seed validation
│           ├── loader.ts         # Seed file loading
│           ├── types.ts          # Seed types and interfaces
│           └── index.ts          # Seeds exports
└── tests/
    ├── unit/
    │   └── storage/
    │       ├── migrations/
    │       │   └── manager.test.ts    # Unit tests for migration manager
    │       └── seeds/
    │           └── manager.test.ts    # Unit tests for seed manager
    └── integration/
        └── storage/
            ├── migrations/
            │   ├── manager.test.ts    # Integration tests for migration manager
            │   └── performance.test.ts # Performance validation tests
            └── seeds/
                └── manager.test.ts    # Integration tests for seed manager
```

**Structure Decision**: The schema migrations manager is a core storage component that belongs in `packages/agent-core/src/storage/migrations/`. This aligns with ADR-004 (Storage Architecture) and the monorepo structure defined in ADR-007.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations detected. The implementation follows all principles:

- **Spec-Driven Dev**: Feature has comprehensive spec with 5 user stories and 11 functional requirements
- **Test-First Quality**: Unit and integration tests defined before implementation
- **Simplicity**: Minimal code: migration manager + lock mechanism + transaction wrapper
- **Human Oversight**: Core logic tasks [SYNC] require human review; test tasks [ASYNC] can be delegated but require macro-review
- **Observability**: Migration logging included in requirements (FR-009)
- **Code Structure**: Split into focused modules (manager.ts, lock.ts, validator.ts, loader.ts); §VI guideline exceeded on manager.ts (323 lines) due to orchestration cohesion — acceptable per guideline "use judgment when the split would harm cohesion"

## Implementation Approach

### Phase 0: Research & Resolve Unknowns

**Research Tasks**:
1. Investigate better-sqlite3 transaction API for migration wrapping
2. Research lock-based synchronization patterns for SQLite
3. Find best practices for migration file organization and versioning
4. Investigate init migration consolidation techniques
5. Research seed file patterns for database initialization

**Output**: `research.md` with decisions and rationale

### Phase 1: Design & Contracts

**Data Model** (`data-model.md`):
- Migration entity: version (integer), name (string), up function, down function
- Migration table: version, name, applied_at timestamp
- Migration lock: lock key, locked_at timestamp, process_id

**Contracts** (`contracts/`):
- MigrationManager class: apply(), rollback(), status(), applyMigration(), rollbackMigration()
- Migration interface: version, name, up(), down()
- SeedManager class: apply(), rollbackAll(), executeSeed(), rollbackSeed()

**Output**: `data-model.md`, `contracts/`, `quickstart.md`

### Phase 2: Task Decomposition

Tasks will be generated in `/spec.tasks` command, classified as:
- **[SYNC]**: Core migration manager implementation (requires human review)
- **[SYNC]**: Transaction handling (requires human review)
- **[SYNC]**: Lock-based concurrency (requires human review)
- **[ASYNC]**: Unit tests (can be delegated)
- **[ASYNC]**: Integration tests (can be delegated)

## Gate Evaluation

### Pre-Phase 0 Gate

| Gate | Status | Notes |
|------|--------|-------|
| Spec approved | ✅ PASS | Spec completed with clarifications |
| Constitution check | ✅ PASS | All principles compliant |
| Research needed | ✅ PASS | 5 research tasks identified |

### Post-Phase 1 Gate (to be evaluated after Phase 1)

| Gate | Status | Notes |
|------|--------|-------|
| Data model complete | PENDING | Will be evaluated after Phase 1 |
| Contracts defined | PENDING | Will be evaluated after Phase 1 |
| Constitution re-check | PENDING | Will be evaluated after Phase 1 |
