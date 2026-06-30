# Implementation Plan: M3.4 Login Item Auto-Start

**Branch**: `007-login-item-auto-start` | **Date**: 2026-06-29 | **Spec**: `/specs/007-login-item-auto-start/spec.md`
**Input**: Feature specification from `/specs/007-login-item-auto-start/spec.md`

## Summary

Implement macOS login item auto-start functionality for the daemon process. The feature enables users to configure the daemon to start automatically on macOS login using MyBoTeam defaults as the primary approach, with Service Management framework as fallback. Includes state management (Disabled/Enabled/Error), logging, error handling, and external state synchronization.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: Service Management framework (macOS), MyBoTeam defaults pattern  
**Storage**: User preferences (UserDefaults/AppStorage) for auto-start preference persistence  
**Testing**: Vitest (unit), Vitest (integration)  
**Target Platform**: macOS 13.4+ (Ventura or later, for `sfltool dumpbtm` support)  
**Project Type**: Desktop application (daemon)  
**Performance Goals**: Auto-start within 5 seconds of user login  
**Constraints**: Uses MyBoTeam defaults as primary, Service Management as fallback  
**Scale/Scope**: Single-user desktop application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ PASS | Specification complete with user stories and acceptance criteria |
| II. Test-First Quality | ✅ PASS | Tests written before implementation enforced via TDD ordering in tasks.md |
| III. Simplicity & Surgical Changes | ✅ PASS | Minimal implementation using MyBoTeam defaults pattern |
| IV. Human Oversight & Goal-Driven Execution | ✅ PASS | Clear success criteria defined |
| V. Observability, Security & Immutability | ✅ PASS | Logging and error handling specified |
| VI. Code Structure & Cleanliness | ✅ PASS | Will follow existing project patterns |
| VII. Source Reference (MANDATORY) | ✅ PASS | MyBoTeam reference analyzed |
| VIII. Git Hooks Are Non-Negotiable | ✅ PASS | Will use standard git workflow |
| IX. Linter/Formatter Configs Are Protected | ✅ PASS | No config modifications planned |

**Constitution Check Result**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/007-login-item-auto-start/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /spec.plan)
```

### Source Code (repository root)

```text
packages/agent-core/src/
├── daemon/
│   ├── login-item-manager.ts      # Login item registration, disable, status, and path management (T014, T023, T030, T031, T039, T040)
│   ├── login-item-manager-registration.ts # Registration helper functions extracted from manager (T014, T023, T039)
│   ├── login-item-state.ts        # State machine for login item states (T004)
│   ├── login-item-logger.ts       # Logging for login item events (T006, T018, T026, T034)
│   ├── login-item-log-types.ts    # Types and enums for login item logging
│   ├── login-item-registration.ts  # Registration handler for login items (T015, T024)
│   ├── login-item-service-mgmt.ts # Service Management framework fallback (T016)
│   ├── login-item-validator.ts    # Path and label validation (T019)
│   ├── login-item-errors.ts       # Error codes, handling, and retry logic (T007, T038)
│   ├── login-item-system-query.ts # macOS system state query for login items (T033)
│   └── login-item-persistence.ts  # UserDefaults/AppStorage persistence (T004a)
├── services/
│   └── auto-start-service.ts      # Service layer for auto-start functionality (T017, T025, T032)
├── types/
│   └── login-item.ts              # Type definitions for login item entities (T002, T005)
└── ui/
    └── auto-start-settings.ts     # Framework-agnostic settings view model builder (T043-T046)

tests/
├── unit/
│   └── daemon/
│       ├── login-item-manager.test.ts           # T008, T020, T027, T028, T036
│       ├── login-item-registration.test.ts        # T009, T021
│       ├── login-item-service-mgmt.test.ts      # T010
│       ├── login-item-validator.test.ts         # T011
│       └── login-item-errors.test.ts            # T035
└── integration/
    └── daemon/
        ├── auto-start-enable.test.ts            # T012
        ├── startup-timing.test.ts               # T013
        ├── auto-start-disable.test.ts           # T022
        ├── auto-start-status.test.ts            # T029
        └── macos-compat.test.ts                 # T043
```

**Structure Decision**: Extends existing daemon architecture in `packages/agent-core/src/daemon/`. Retry logic consolidated into `login-item-errors.ts`. Path updates and reinstallation detection integrated into `login-item-manager.ts`. System query uses `sfltool` and `osascript` fallback for macOS login item detection. UI provides framework-agnostic view model builders.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid execution model combining human expertise ([SYNC]) with autonomous agent delegation ([ASYNC]).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 2 | 3 | Core login item management requires human review; helper functions can be delegated |
| Data Operations | 1 | 2 | State transitions need review; persistence can be delegated |
| UI Components | 1 | 1 | Settings UI requires design review; toggles can be delegated |
| Integrations | 1 | 1 | macOS API integration requires human verification; logging can be delegated |
| Infrastructure | 0 | 2 | Testing infrastructure can be delegated |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**
- Login item registration with macOS Service Management framework (security-sensitive)
- State machine implementation (critical for correctness)
- Error handling and retry logic (user experience impact)

**Agent-Delegated [ASYNC] Classifications:**
- Unit test generation
- Logging implementation
- Type definitions and interfaces
- Documentation updates

### Triage Audit Trail

| Task ID | Task Description | Classification | Primary Criteria | Risk Level | Rationale |
|---------|------------------|----------------|------------------|------------|-----------|
| T014 | Implement LoginItemManager.enable() | [SYNC] | Security/Criticality | High | macOS API integration requires human verification |
| T023 | Implement LoginItemManager.disable() | [SYNC] | Security/Criticality | High | macOS API integration requires human verification |
| T030 | Implement LoginItemManager.getStatus() | [SYNC] | Security/Criticality | High | macOS API integration requires human verification |
| T039 | Implement duplicate registration prevention | [SYNC] | Complexity | High | State transitions must be correct for reliability |
| T006 | Create LoginItemLogger | [ASYNC] | Simplicity | Low | Straightforward logging implementation |
| T008-T013 | Write US1 tests | [ASYNC] | Simplicity | Low | Test generation is well-defined |
| T043 | Implement auto-start toggle UI | [SYNC] | UX Impact | Medium | User interface changes require design review |
| T044 | Implement auto-start status display | [SYNC] | UX Impact | Medium | User interface changes require design review |

## Source Reference Analysis (CDR-2026-060)

### Files Analyzed

| Reference Source | File | Key Patterns |
|------------------|------|--------------|
| MyBoTeam | `/Users/mavishay/Projects/Accomplish/accomplish` | Login item defaults pattern, Service Management integration |
| v0.4.0 | `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.4.0/packages/agent-core/src/daemon/` | Daemon architecture, socket transport, RPC patterns |

### Patterns to Adopt

1. **MyBoTeam defaults pattern**: Use UserDefaults/AppStorage for login item preference persistence (from MyBoTeam reference)
2. **Service Management framework**: macOS-native API for login item registration with permission handling (from MyBoTeam reference)
3. **Daemon architecture**: Extend existing daemon structure in `packages/agent-core/src/daemon/` (from v0.4.0)
4. **Logger pattern**: Follow existing `logger.ts` pattern for LoginItemLogger (from v0.4.0)

### Patterns NOT to Adopt

| Pattern | Rationale |
|---------|-----------|
| LaunchAgent plist approach | Service Management framework is more modern and handles permissions automatically |
| SQLite for login item state | Overkill for single-user preference; UserDefaults sufficient |
| Separate daemon process for login item | Unnecessary complexity; integrate into existing daemon |

### Source References in Task Descriptions

- T004-T007: State machine patterns from MyBoTeam defaults
- T014-T019: Login item registration from MyBoTeam Service Management integration
- T006, T018, T026, T034: Logger patterns from v0.4.0 `logger.ts`

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations detected. All principles are satisfied or will be satisfied during implementation.
