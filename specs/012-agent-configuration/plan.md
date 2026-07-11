# Implementation Plan: Agent Configuration System

**Branch**: `012-agent-configuration` | **Date**: 2026-07-11 | **Spec**: [specs/012-agent-configuration/spec.md](specs/012-agent-configuration/spec.md)
**Input**: Feature specification from `/specs/012-agent-configuration/spec.md`

## Summary

Implement the Agent Configuration System for M5-1: define AgentConfig and InferenceParams types with Zod validation, provide default agent configurations (orchestrator, secretary, accountant), persist configurations in SQLite with CRUD operations, enforce unique names and 20-agent capacity limit, define the 6-state AgentStatus lifecycle (aligned with ADR-002), and log structured audit entries for configuration mutations.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, ESM)
**Primary Dependencies**: Zod (validation), better-sqlite3 (storage), existing `@myboteam/types`, existing `@myboteam/agent-core`
**Storage**: SQLite (better-sqlite3, WAL mode) — existing `agent_registry` table from M1-4/M2-1
**Testing**: Vitest (unit), colocated in `packages/*/tests/unit/`
**Target Platform**: Node.js daemon (macOS/Linux)
**Project Type**: Monorepo (pnpm workspaces) — daemon + renderer
**Performance Goals**: Configuration validation < 5ms, startup load < 1 second for 20 agents
**Constraints**: Must align with ADR-002 (Eve Agent Harness), ADR-004 (SQLite + Vault), ADR-006 (LLM Provider Model)
**Scale/Scope**: 20 max agents per daemon, 3 defaults, single daemon instance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ | Spec with 5 user stories, 13 FRs, 6 SCs complete |
| II. Test-First Quality | ✅ | Unit tests colocated in `tests/unit/` |
| III. Simplicity & Surgical Changes | ✅ | Minimal implementation, no speculative features |
| IV. Human Oversight | ✅ | [SYNC] tasks marked for review |
| V. Observability & Security | ✅ | Audit logging, no auth needed (local daemon) |
| VII. Source Reference | ✅ | Source analysis in plan.md below |
| VIII. Git Hooks | ✅ | No `--no-verify` |
| IX. Linter/Formatter Configs | ✅ | No config changes |
| X. Test Location | ✅ | Tests colocated with source |
| XI. PR Review Discipline | ✅ | All comments will be addressed inline |

**Gate**: PASS — All applicable principles satisfied.

## Source Reference Analysis (MANDATORY)

### v0.2.0 Reference Implementation

**Source Location**: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.2.0/packages/`

**Files Analyzed**:
- `types/src/agent-config.ts` (47 lines) — AgentConfigSchema with Zod validation
- `daemon/src/agent-registry.ts` (237 lines) — AgentRegistry with CRUD in SQLite

**Key Patterns to Adopt**:
1. `AgentConfigSchema` with Zod `.object()` and `.strict()` mode for strict validation
2. `InferenceParamsSchema` with optional fields and numeric bounds
3. `AgentConfig` type inferred from Zod schema via `z.infer<>`
4. `AgentConfigPartial` for update operations using `.partial()`
5. `AgentRegistry` class with `register()`, `list()`, `getById()`, `update()`, `delete()` methods
6. `setStatus()` method with `VALID_STATUSES` and `VALID_TRANSITIONS` guards
7. SQLite parameterized queries with `db.run()` and `db.exec()`
8. UUID generation via `randomUUID()` from `node:crypto`
9. JSON serialization for complex fields (capabilities, metadata, secrets, skills, mcpServers)

**Patterns NOT to Adopt** (not needed for v0.5.0):
- `MessageRouter` integration — defer to M5-2 (Agent Registry & Lifecycle)
- `reconcileWithFilesystem()` — defer to M5-3 (Agent Materialization)
- `registerCallback()` / `sendMessage()` — defer to M5-2 (message routing)
- `AgentRecord` with full runtime fields — this spec focuses on configuration only

**File References in Task Descriptions**:
- `types/src/agent-config.ts:1-47` — Schema and type definitions
- `daemon/src/agent-registry.ts:24-79` — register() method with SQLite INSERT
- `daemon/src/agent-registry.ts:81-92` — list() and getById() methods
- `daemon/src/agent-registry.ts:94-156` — update() method with partial fields
- `daemon/src/agent-registry.ts:158-162` — delete() method
- `daemon/src/agent-registry.ts:164-183` — setStatus() with transition validation

## Project Structure

### Documentation (this feature)

```text
specs/012-agent-configuration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/spec.tasks command)
```

### Source Code (repository root)

```text
packages/types/src/
├── agent-config.ts          # AgentConfigSchema, InferenceParamsSchema, AgentConfig, InferenceParams (MODIFY — align with v0.2.0 patterns)
├── agent-status.ts          # AgentStatus enum, VALID_TRANSITIONS map (NEW)
└── index.ts                 # Re-exports (MODIFY — add AgentStatus exports)

packages/agent-core/src/
├── agent-registry.ts        # AgentRegistry class with CRUD + setStatus() (CREATE — new file for this feature)
├── agent-defaults.ts        # Default agent configurations (NEW)
└── index.ts                 # Re-exports (MODIFY — add new exports)

packages/agent-core/tests/unit/
├── agent-config.test.ts     # Validation tests (NEW)
├── agent-registry.test.ts   # CRUD + status transition tests (NEW)
└── agent-defaults.test.ts   # Default config tests (NEW)
```

**Structure Decision**: Monorepo with packages. Types go in `packages/types/src/` (shared). Implementation goes in `packages/agent-core/src/`. Tests colocated in `packages/agent-core/tests/unit/`. Aligns with existing v0.2.0 structure.

## Triage Framework: [SYNC] vs [ASYNC] Task Classification

**Execution Strategy**: Hybrid execution model. Type definitions and validation logic are suitable for agent delegation ([ASYNC]). Registry CRUD with SQLite operations and status state machine require human review ([SYNC]).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Type Definitions | 0 | 2 | Zod schemas are mechanical, low-risk |
| Registry CRUD | 2 | 0 | SQLite operations need review for correctness |
| Status State Machine | 1 | 0 | State transitions are critical path |
| Default Configs | 0 | 1 | Constants, low-risk |
| Unit Tests | 0 | 3 | Test code is ASYNC-delegatable |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- Registry CRUD operations — SQLite queries with parameterized inputs, must prevent SQL injection and ensure atomicity
- Status state machine — Transition validation must be exhaustive, invalid transitions must be rejected

**Agent-Delegated [ASYNC] Classifications:**

- Zod schema definitions — Mechanical type definitions with clear validation rules
- Default agent configurations — Static constants with no logic
- Unit test code — Test implementations following established patterns

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Define AgentConfigSchema | ASYNC | Simplicity | Low | Zod schema, mechanical |
| Define InferenceParamsSchema | ASYNC | Simplicity | Low | Zod schema, mechanical |
| Define AgentStatus enum | ASYNC | Simplicity | Low | TypeScript enum |
| Implement AgentRegistry.register() | SYNC | Data integrity | High | SQLite INSERT with validation |
| Implement AgentRegistry.update() | SYNC | Data integrity | High | SQLite UPDATE with partial fields |
| Implement AgentRegistry.delete() | SYNC | Data integrity | Medium | SQLite DELETE |
| Implement setStatus() | SYNC | State correctness | High | Transition validation |
| Add capacity check (20 agents) | ASYNC | Simplicity | Low | COUNT query + guard |
| Add audit logging | ASYNC | Simplicity | Low | Structured log entries |
| Create default configs | ASYNC | Simplicity | Low | Static constants |
| Write unit tests | ASYNC | Test code | Low | Test implementations |

## Complexity Tracking

No constitution violations. All principles satisfied.
