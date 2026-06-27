# Implementation Plan: PID Lock Manager

**Branch**: `MAO-145` | **Date**: 2026-06-26 | **Spec**: `specs/004-pid-lock-manager/spec.md`
**Input**: Feature specification from `/specs/004-pid-lock-manager/spec.md`

## Summary

Implement a PID lock manager as a functional API in `packages/agent-core/src/daemon/` that prevents multiple daemon instances from running simultaneously. Uses atomic file operations (write temp + linkSync) for race-free lock acquisition, JSON payload for lock metadata, and process liveness checks for stale lock detection. Based on the v0.3.0 implementation pattern with the functional `acquirePidLock()` API returning a `PidLockHandle`.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+)
**Primary Dependencies**: Node.js `fs` (linkSync, openSync, writeSync, readFileSync, unlinkSync), `crypto` (randomBytes), `path`
**Storage**: File system (PID files: `daemon.pid`, `agent.pids`)
**Testing**: Vitest (unit tests) — project standard
**Target Platform**: macOS, Linux (POSIX file permissions, linkSync)
**Project Type**: Library (shared package `packages/agent-core`)
**Performance Goals**: Lock acquire/release <50ms, stale detection <50ms, fail-fast <100ms
**Constraints**: Single-user desktop app, synchronous file operations acceptable, 0o600 permissions on PID file
**Scale/Scope**: Single daemon process, ~200 lines of implementation code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ PASS | Spec exists with user stories, acceptance scenarios, success criteria |
| II. Test-First Quality | ✅ PASS | Unit tests planned for all operations (acquire, release, stale, corrupt, race) |
| III. Simplicity & Surgical Changes | ✅ PASS | Functional API, no classes, minimal abstraction (~143 lines based on v0.3.0) |
| IV. Human Oversight | ✅ PASS | Plan reviewed before task generation; SYNC tasks for core logic |
| V. Observability, Security & Immutability | ✅ PASS | 0o600 permissions, no secrets in code, immutable payload objects |
| VI. Code Structure & Cleanliness | ✅ PASS | Single file ~143 lines, barrel export, one function per responsibility; PidLockHandle includes isAcquired for status |
| VII. Source Reference (MANDATORY) | ✅ PASS | v0.2.0 and v0.3.0 sources read and understood |

## Project Structure

### Documentation (this feature)

```text
specs/004-pid-lock-manager/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── team-context.md      # Team AI directives context
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
packages/agent-core/src/daemon/
├── pid-lock.ts          # Main implementation (acquirePidLock, PidLockError, types)
├── socket-path.ts       # getPidFilePath() — provided by M2-5 or stubbed
└── index.ts             # Barrel export for daemon module

packages/agent-core/tests/unit/
└── pid-lock.test.ts     # Unit tests

packages/agent-core/tests/integration/
└── pid-lock.test.ts     # Integration tests (atomic operations, stale detection)
```

**Structure Decision**: Follows v0.3.0 pattern — functional API in `packages/agent-core/src/daemon/pid-lock.ts`. The `socket-path.ts` provides `getPidFilePath()`. Barrel export in `index.ts`.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid — core lock logic requires human review (SYNC), boilerplate and tests are agent-delegatable (ASYNC).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Core Lock Logic | 3 | 0 | Atomic operations, error handling, stale detection — critical path |
| Types & Exports | 0 | 2 | Interface definitions, barrel export — mechanical |
| Unit Tests | 0 | 4 | Test scaffolding and assertions — well-defined from spec |
| Integration Tests | 1 | 1 | Atomic race condition test needs careful design |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**
- `acquirePidLock()` — core lock acquisition with atomic operations, stale retry, error handling
- `PidLockError` class — typed error with existingPid for conflict detection
- `release()` — must reliably delete PID file; failure leaves stale lock

**Agent-Delegated [ASYNC] Classifications:**
- `PidLockPayload` interface definition
- Barrel export additions to `index.ts`
- Unit test scaffolding (acquire, release, stale detection, corrupted files)
- `saveAgentPids()` and `cleanupAgentProcesses()` — straightforward file I/O

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Create pid-lock.ts with types | ASYNC | Mechanical | Low | Interface definitions only |
| Implement acquirePidLock() | SYNC | Criticality | High | Core atomic operations, race condition handling |
| Implement release() on handle | SYNC | Criticality | High | Must reliably clean up; failure leaves stale lock |
| Implement PidLockError | ASYNC | Mechanical | Low | Standard error class pattern |
| Implement saveAgentPids() | ASYNC | Simplicity | Low | Simple file write |
| Implement cleanupAgentProcesses() | ASYNC | Simplicity | Low | Process kill loop with error handling |
| Add barrel exports | ASYNC | Mechanical | Low | Re-export from index.ts |
| Write unit tests | ASYNC | Well-defined | Low | Spec provides exact scenarios |
| Write integration test for atomicity | SYNC | Complexity | Medium | Race condition simulation requires careful setup |

## Complexity Tracking

> No constitution violations — all principles satisfied.

| Item | Decision | Rationale |
|------|----------|-----------|
| PidLockError as class | Extends Error (class-based) | Standard TypeScript error subclassing — idiomatic, not over-abstraction. Constitution III targets speculative abstractions, not language-standard patterns. |
| saveAgentPids permissions | 0o600 (owner-read-only) | Consistent with daemon.pid permissions. File descriptor properly closed via try/finally. |
| pid-lock.ts line count | 183 lines — under 200 threshold | Constitution VI guideline met. |
| Multiple exports in pid-lock.ts | Acceptable — high cohesion | 3 functions + 1 class + 2 interfaces in one focused module. Splitting would harm readability. All exports are tightly related to PID lock management. |
