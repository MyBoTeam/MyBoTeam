# Implementation Plan: SQLite Storage Layer (better-sqlite3, WAL)

**Branch**: `MAO-142` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-sqlite-storage-layer/spec.md`

## Summary

Implement a local-first SQLite storage layer using better-sqlite3 with WAL mode in the `packages/agent-core` shared package. Provides an `AgentStorage` class with CRUD operations for all 11 entities defined in AD.md, a consolidated init migration, typed error handling, structured JSON logging, and a multi-mode seeding mechanism (dev/test/production).

## Source Reference (MANDATORY)

**Source**: v0.2.0 `packages/daemon/src/database-service.ts` and `packages/daemon/src/migrations/*.ts`

Key findings from v0.2.0 source:
- **DatabaseService class**: Uses sql.js with checkpoint timer (30s), process exit handler, in-memory mode for tests
- **Migration pattern**: Version-based migrations with `_migrations` table tracking applied versions
- **Schema**: 8 tables in v0.2.0 (vault, skills, mcps, settings, agent_registry, tasks, conversations, messages)
- **Dependencies**: sql.js ^1.11.0, pino ^9.0.0, zod ^4.4.3
- **Testing**: Vitest with separate integration config

Migration to v0.5.0:
- Replace sql.js with better-sqlite3 (synchronous API, WAL mode)
- Consolidate all v0.2.0 migrations into single init migration
- Rename tables: agent_registry → agent, mcps → mcp_server
- Extend schema: add task_todo, memory_entry, note, schedule, document_version, agent_mcp_assignment
- Add new fields: task.verification_status, task.continuation_count
- Remove: vault (separate encrypted storage), skills (runtime files), settings (key-value)

## Technical Context

**Language/Version**: TypeScript (Node.js 24)
**Primary Dependencies**: better-sqlite3 (replacing sql.js from v0.2.0), pino (structured logging)
**Storage**: SQLite (better-sqlite3, WAL mode) — 2 database files: myboteam.db, myboteam_dev.db; test mode uses `:memory:` (in-memory)
**Testing**: Vitest (workspace)
**Target Platform**: Cross-platform (Node.js runtime)
**Project Type**: library (shared package in packages/agent-core)
**Performance Goals**: <500ms database initialization, <100ms per CRUD operation
**Constraints**: Single-user desktop app, synchronous better-sqlite3 API, WAL mode for concurrent reads
**Scale/Scope**: 11 entities, 2 database files (myboteam.db, myboteam_dev.db) + :memory: for tests, consolidated init migration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ PASS | Spec exists with 8 user stories, 14 functional requirements, 7 success criteria |
| II. Test-First Quality | ✅ PASS | Unit tests required for every CRUD operation (SC-004); contract tests for AgentStorage API |
| III. Simplicity & Surgical Changes | ✅ PASS | Single package, minimal dependencies, no speculative abstractions |
| IV. Human Oversight & Goal-Driven Execution | ✅ PASS | Human review required before merge; success criteria defined per user story |
| V. Observability, Security & Immutability | ✅ PASS | Structured JSON logging with correlation IDs (FR-014); typed errors (FR-013); no secrets in this feature |
| VI. Code Structure & Cleanliness | ✅ PASS | Files under 200 lines; one class per module; clean separation of concerns |
| VII. Source Reference (MANDATORY) | ✅ PASS | Source code from v0.2.0 reviewed: `packages/daemon/src/database-service.ts`, `packages/daemon/src/migrations/*.ts` |

**Gate Result**: PASS — no violations to justify

## Project Structure

### Documentation (this feature)

```text
specs/003-sqlite-storage-layer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── agent-storage.md # AgentStorage API contract
└── tasks.md             # Phase 2 output (/spec.tasks)
```

### Source Code (repository root)

```text
packages/agent-core/
├── src/
│   ├── storage/
│   │   ├── agent-storage.ts        # Main AgentStorage facade (142 LOC)
│   │   ├── database.ts             # Database initialization and connection
│   │   ├── logger.ts               # Structured JSON logging with correlation IDs
│   │   ├── runner.ts               # Migration runner with _migrations tracking
│   │   ├── seeder.ts               # Multi-mode seeding mechanism
│   │   ├── errors.ts               # Typed error classes
│   │   ├── index.ts                # Public API barrel exports
│   │   ├── migrations/
│   │   │   ├── 001-init.ts         # Consolidated init migration (11 tables)
│   │   │   └── index.ts            # Migration list export
│   │   └── crud/
│   │       ├── agent.ts            # Agent CRUD operations
│   │       ├── task.ts             # Task and TaskTodo CRUD operations
│   │       ├── conversation.ts     # Conversation and Message CRUD operations
│   │       ├── memory.ts           # MemoryEntry CRUD operations
│   │       ├── mcp.ts              # McpServer and AgentMcpAssignment CRUD operations
│   │       ├── note.ts             # Note CRUD operations
│   │       ├── schedule.ts         # Schedule CRUD operations
│   │       └── document-version.ts # DocumentVersion CRUD operations
│   ├── types/
│   │   ├── entities.ts             # Entity interfaces
│   │   └── queries.ts              # Query filter types
│   └── index.ts                    # Package-level public API exports
├── tests/
│   └── unit/
│       └── storage/
│           ├── agent-storage.test.ts
│           ├── contract.test.ts
│           ├── conversation.test.ts
│           ├── database.test.ts
│           ├── document-version.test.ts
│           ├── edge-cases.test.ts
│           ├── mcp-server.test.ts
│           ├── memory-entry.test.ts
│           ├── migration.test.ts
│           ├── note-schedule.test.ts
│           ├── query-filters.test.ts
│           ├── schema-validation.test.ts
│           └── task.test.ts
├── package.json
└── tsconfig.json
```

**Structure Decision**: Standard monorepo library layout. Storage module lives in `packages/agent-core/src/storage/` with clear separation: database connection, migrations, seeder, error classes, and the main AgentStorage facade delegating to 8 domain-specific CRUD modules in `crud/`. Types live in `packages/agent-core/src/types/`.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid execution model — [SYNC] for architecture-critical tasks, [ASYNC] for repetitive CRUD implementations.

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|------------------------|-----------|
| Database Setup | 2 | 1 | Schema DDL and migration require careful review; init function is straightforward |
| Entity CRUD | 0 | 11 | Repetitive pattern — each entity follows same create/read/update/delete/query pattern |
| Error Handling | 1 | 0 | Typed error hierarchy design requires review |
| Logging | 1 | 0 | Structured logging integration requires review |
| Seeding | 1 | 1 | Mode selection logic requires review; seed data generation is mechanical |
| Testing | 2 | 4 | Contract tests require review; unit tests follow established patterns |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- Schema DDL (001-init.ts) — incorrect schema breaks all downstream features
- Error class hierarchy — affects API contract for all consumers
- Structured logging integration — must align with project-wide logging strategy
- Contract tests — define the public API boundary

**Agent-Delegated [ASYNC] Classifications:**

- Entity CRUD methods (11 entities) — repetitive pattern, well-defined by spec
- Unit tests for CRUD operations — follow established test patterns
- Seed data generation — mechanical data creation
- Type definitions — straightforward interface generation from AD.md

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Database initialization + WAL | SYNC | Architecture critical | High | Foundation for all data operations |
| Schema DDL (11 tables) | SYNC | Architecture critical | High | Incorrect schema breaks everything |
| Error class hierarchy | SYNC | API contract | Medium | Public interface affects all consumers |
| Structured logging | SYNC | Cross-cutting concern | Medium | Must integrate with project logging |
| Agent CRUD methods | ASYNC | Repetitive pattern | Low | Well-defined by spec, follows pattern |
| Task CRUD methods | ASYNC | Repetitive pattern | Low | Well-defined by spec, follows pattern |
| Conversation CRUD methods | ASYNC | Repetitive pattern | Low | Well-defined by spec, follows pattern |
| Memory/Note/Schedule CRUD | ASYNC | Repetitive pattern | Low | Well-defined by spec, follows pattern |
| MCP Assignment CRUD | ASYNC | Repetitive pattern | Low | Well-defined by spec, follows pattern |
| Consolidated init migration | SYNC | Architecture critical | High | Replaces all v0.2.0 migrations |
| Seeder (multi-mode) | SYNC | Design decision | Medium | Mode selection and idempotency logic |
| Seed data generation | ASYNC | Mechanical | Low | Data creation follows template |
| Unit tests (11 entities) | ASYNC | Repetitive pattern | Low | Follow established test patterns |
| Contract tests | SYNC | API boundary | High | Defines public API for consumers |
| Type definitions | ASYNC | Mechanical | Low | Interface generation from AD.md |
| Quickstart documentation | ASYNC | Documentation | Low | Template-based documentation |

## Complexity Tracking

> **No violations to justify** — all constitution principles pass without deviation.
