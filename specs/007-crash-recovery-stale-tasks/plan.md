# Implementation Plan: Crash Recovery — PID Detection, Stale Tasks

**Branch**: `007-crash-recovery-stale-tasks` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-crash-recovery-stale-tasks/spec.md`

## Summary

Implement crash recovery for the myboteam daemon by detecting stale running tasks after crashes, marking them as failed, and supporting graceful shutdown with task drain. The feature extends the existing PID lock manager (004-pid-lock-manager) with crash detection on startup, adds RPC-based shutdown method (cross-platform), and implements agent process cleanup.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS
**Primary Dependencies**: better-sqlite3, @modelcontextprotocol/sdk, node-cron
**Storage**: SQLite (better-sqlite3 WAL mode) — existing task CRUD module
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Cross-platform (macOS, Windows, Linux) — Electron desktop app + Node.js daemon
**Project Type**: Desktop application with background daemon (monorepo structure)
**Performance Goals**: Crash detection < 100ms, graceful shutdown < 30s (drain timeout)
**Constraints**: Single-user desktop app; no multi-user lock conflicts; cross-platform compatibility
**Scale/Scope**: Single daemon instance; ~11 existing ADRs; M3 daemon infrastructure milestone

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Compliant | Feature spec created with user stories and acceptance scenarios |
| II. Test-First Quality | ✅ Compliant | Unit and integration tests planned for crash recovery and graceful shutdown |
| III. Simplicity & Surgical Changes | ✅ Compliant | Minimal changes: extend PID lock, add RPC shutdown method, update task status |
| IV. Human Oversight & Goal-Driven Execution | ✅ Compliant | SYNC tasks for core logic; ASYNC for tests and documentation |
| V. Observability, Security & Immutability | ✅ Compliant | Logging warnings for stale tasks; lock file security; atomic file operations |
| VI. Code Structure & Cleanliness | ✅ Compliant | Files under 200 lines; single responsibility per module |
| VII. Source Reference (MANDATORY) | ✅ Compliant | Reference implementation analyzed (Accomplish: apps/daemon/src/index.ts) |
| VIII. Git Hooks Are Non-Negotiable | ✅ Compliant | No --no-verify usage; hooks respected |
| IX. Linter/Formatter Configs Are Protected | ✅ Compliant | No config modifications; code conforms to existing biome/eslint rules |

**Gate Result**: PASS — No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/007-crash-recovery-stale-tasks/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── team-context.md      # Discovered CDRs (existing)
└── checklists/          # Quality checklists (existing)
```

### Source Code (repository root)

```text
packages/agent-core/src/daemon/
├── pid-lock.ts          # Existing PID lock manager (004-pid-lock-manager)
├── agent-pids.ts        # NEW: Agent PID file read/write/terminate (extracted from pid-lock.ts)
├── agent-tracker.ts     # NEW: Agent child process tracking wrapper
└── shutdown-manager.ts  # NEW: Graceful shutdown with drain logic

apps/daemon/src/
├── index.ts             # MODIFY: Add crash recovery, RPC shutdown methods inline
└── scheduler.ts         # MODIFY: Stop accepting tasks on shutdown

packages/agent-core/src/storage/crud/
└── task.ts              # Existing task CRUD (read-only reference, not modified)
```

**Structure Decision**: Existing monorepo structure. Modifications to existing files plus two new modules in daemon package.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid model — human review ([SYNC]) for core daemon logic; agent-delegated ([ASYNC]) for tests and documentation.

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 3 | 0 | Core crash recovery and shutdown logic requires human review |
| Data Operations | 1 | 0 | Task status update logic needs review |
| Integrations | 1 | 0 | RPC shutdown method needs review |
| Infrastructure | 1 | 0 | Shutdown manager needs review |
| Tests | 0 | 3 | Unit and integration tests can be delegated |
| Documentation | 0 | 1 | Research and data model docs can be delegated |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- Crash detection logic in daemon startup (FR-001, FR-002, FR-003)
- Graceful shutdown drain logic with timeout (FR-006, FR-007, FR-008, FR-009)
- RPC shutdown method implementation (FR-005)
- Agent process cleanup on shutdown (FR-011)

**Agent-Delegated [ASYNC] Classifications:**

- Unit tests for crash recovery (SC-006)
- Integration tests for graceful shutdown (SC-006)
- Research documentation (research.md)
- Data model documentation (data-model.md)

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Implement crash detection in daemon startup | SYNC | Criticality (daemon reliability) | High | Core crash recovery logic; affects daemon lifecycle |
| Implement graceful shutdown manager | SYNC | Complexity (drain logic, timeout) | High | Complex state management; timeout handling |
| Add shutdown RPC method | SYNC | Security (cross-platform RPC) | Medium | Extends existing contract; needs security review |
| Update task status on crash recovery | SYNC | Data integrity | Medium | Modifies task state; needs atomicity guarantees |
| Write unit tests for crash recovery | ASYNC | Test-only code | Low | Test code; no production impact |
| Write integration tests for shutdown | ASYNC | Test-only code | Low | Test code; no production impact |
| Generate research documentation | ASYNC | Documentation only | Low | Reference documentation; no code impact |
