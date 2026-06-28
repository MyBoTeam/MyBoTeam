# Implementation Plan: Data Directory Manager

**Branch**: `005-data-directory-manager` | **Date**: 2026-06-27 | **Spec**: [link](spec.md)
**Input**: Feature specification from `/specs/005-data-directory-manager/spec.md`

## Summary

Implement a data directory manager that resolves and creates the data directory with standard subdirectories (data/, logs/, vault/) at ~/.myboteam/ or a custom location via MYBOTEAM_DATA_DIR environment variable. The implementation will extend the existing PathResolver pattern from v0.2.0 with directory creation, cross-platform path resolution, file locking for concurrent access, and logging.

## Technical Context

**Language/Version**: TypeScript/Node.js (consistent with existing codebase)
**Primary Dependencies**: Node.js built-in modules (fs, path, os, crypto), proper-lockfile (file locking for concurrent access)
**Storage**: File system operations (no database for this feature)
**Testing**: Vitest (consistent with existing test framework)
**Target Platform**: Windows, macOS, Linux (cross-platform)
**Project Type**: Desktop application (Electron + daemon)
**Performance Goals**: Directory creation within 2 seconds (aspirational), clean command within 2 seconds
**Constraints**: Must work on Windows, macOS, and Linux; must handle concurrent access with file locks
**Scale/Scope**: Single-user desktop application, local file system operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Alignment | Notes |
|-----------|-----------|-------|
| Spec-Driven Dev | ✅ Compliant | Feature has approved specification with user stories |
| Test-First Quality | ✅ Compliant | Unit tests for path resolution required by spec |
| Simplicity | ✅ Compliant | Extends existing PathResolver pattern, minimal abstraction |
| Human Oversight | ✅ Compliant | Clear acceptance criteria for human review |
| Security | ✅ Compliant | Vault security delegated to MAO-144, file locks for concurrency |
| Code Structure | ✅ Compliant | Single module for path resolution, co-located tests |
| Source Reference | ✅ Compliant | Source from v0.2.0 PathResolver analyzed |

## Project Structure

### Documentation (this feature)

```text
specs/005-data-directory-manager/
├── plan.md              # This file (/spec.plan command output)
├── research.md          # Phase 0 output (/spec.plan command)
├── data-model.md        # Phase 1 output (/spec.plan command)
├── quickstart.md        # Phase 1 output (/spec.plan command)
├── contracts/           # Phase 1 output (/spec.plan command)
└── tasks.md             # Phase 2 output (/spec.tasks command - NOT created by /spec.plan)
```

### Source Code (repository root)

```text
packages/daemon/src/
├── path-resolver.ts     # Extended PathResolver with directory creation
├── data-directory.ts    # DataDirectoryManager class
└── ...

packages/daemon/tests/
├── path-resolver.test.ts
├── data-directory.test.ts
└── ...
```

**Structure Decision**: Single package structure within existing daemon package. PathResolver and DataDirectoryManager are closely related and should be in the same package. Tests are co-located in the tests directory following existing patterns.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: This feature will use a hybrid execution model combining human expertise ([SYNC]) with autonomous agent delegation ([ASYNC]).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 2 | 3 | Core path resolution needs review; directory creation is straightforward |
| Data Operations | 1 | 2 | File locking logic needs review; directory creation is mechanical |
| UI Components | 0 | 0 | No UI components in this feature |
| Integrations | 1 | 1 | Cross-platform testing needs review; implementation is standard |
| Infrastructure | 1 | 1 | Clean command needs review; logging is standard |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- Path resolution logic (cross-platform compatibility critical)
- File locking implementation (concurrent access safety)
- Error handling strategy (fail-fast behavior)

**Agent-Delegated [ASYNC] Classifications:**

- Directory creation logic (straightforward fs operations)
- Logging implementation (standard console/file logging)
- Unit test writing (following existing test patterns)

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Implement PathResolver.getDataDir() | SYNC | Cross-platform compatibility | High | Must work correctly on all platforms |
| Implement DataDirectoryManager.create() | ASYNC | Mechanical directory creation | Low | Standard fs.mkdirSync operations |
| Implement file locking | SYNC | Concurrent access safety | High | Critical for data integrity |
| Implement logging | ASYNC | Standard logging | Low | Console/file logging is straightforward |
| Write unit tests | ASYNC | Following existing patterns | Low | Test patterns well established |
| Implement clean command | SYNC | Data deletion safety | Medium | Must handle edge cases correctly |
| Cross-platform testing | SYNC | Platform-specific behavior | Medium | Requires testing on multiple platforms |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution principles are satisfied.
