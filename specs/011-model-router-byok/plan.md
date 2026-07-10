# Implementation Plan: Model Router + BYOK Key Injection

**Branch**: `MAO-156` | **Date**: 2026-07-09 | **Spec**: [specs/011-model-router-byok/spec.md](specs/011-model-router-byok/spec.md)
**Input**: Feature specification from `/specs/011-model-router-byok/spec.md`

## Summary

Implement a cross-provider model router (`ModelRouter`) that selects the appropriate LLM provider based on agent configuration, with a fallback chain that includes exponential-backoff dead-host cooldown, and secure BYOK (Bring Your Own Key) injection at runtime. The router sits between the agent layer and the existing provider clients, providing provider selection, fallback orchestration, health tracking, and credential injection without modifying existing provider implementations.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, ESM)
**Primary Dependencies**: Zod (validation), existing `@myboteam/types`, existing `@myboteam/agent-core` provider infrastructure
**Storage**: Vault (existing encrypted secrets vault for BYOK keys), in-memory health state (not persisted)
**Testing**: Vitest (unit), with integration tests colocated in `packages/agent-core/tests/`
**Target Platform**: Node.js daemon (macOS/Linux)
**Project Type**: Monorepo (pnpm workspaces) — daemon + renderer
**Performance Goals**: Routing decision < 10ms (excluding network), fallback activation < 100ms after primary failure
**Constraints**: Must not modify existing `ProviderClient` interface or provider implementations; must use `ProviderClientResult<T>` for all router operations
**Scale/Scope**: 5 provider types, ~50 max custom providers per user, single daemon instance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution**: v1.6.0 (`.specify/memory/constitution.md`)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ | Spec with user stories, FR/SC complete |
| II. Test-First Quality | ✅ | Unit tests colocated in `tests/unit/providers/` |
| III. Simplicity & Surgical Changes | ✅ | Minimal implementation, no speculative features |
| IV. Human Oversight | ✅ | [SYNC] tasks marked for review |
| V. Observability & Security | ✅ | BYOK masking, no key logging |
| VII. Source Reference | ✅ | Source analysis in spec.md |
| VIII. Git Hooks | ✅ | No `--no-verify` |
| IX. Linter/Formatter Configs | ✅ | No config changes |
| X. Test Location | ✅ | Tests colocated with source |

**Gate**: PASS — All applicable principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/011-model-router-byok/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /spec.plan)
```

### Source Code (repository root)

```text
packages/types/src/
├── provider.ts              # ProviderType, Provider, ProviderConfig (EXISTING)
├── provider-client.ts       # ProviderClient, ProviderClientResult (EXISTING)
├── agent.ts                 # AgentConfig (EXISTING - needs fallbackProviderIds)
├── chat.ts                  # ChatRequest, ChatResponse (EXISTING)
├── router.ts                # NEW: ModelRouter types, FallbackChainResult, ProviderHealthState
└── errors.ts                # RouterError, RouterErrorCode (NEW)

packages/agent-core/src/providers/
├── model-router.ts          # NEW: ModelRouter class
├── provider-registry.ts     # NEW: ProviderRegistry class
├── provider-health.ts       # NEW: ProviderHealthTracker (cooldown state machine)
├── byok-injector.ts         # NEW: BYOK key injection logic
├── tools/
│   ├── router-error-mapper.ts   # NEW: classifyTransient() / classifyPermanent()
│   └── (existing files unchanged)
├── (existing provider files unchanged)
└── (existing tools files unchanged)

packages/agent-core/tests/unit/
├── model-router.test.ts         # NEW
├── provider-registry.test.ts    # NEW
├── provider-health.test.ts      # NEW
├── byok-injector.test.ts        # NEW
└── router-error-mapper.test.ts  # NEW
```

**Structure Decision**: Monorepo with packages. New files go in `packages/types/src/` (types) and `packages/agent-core/src/providers/` (implementation). Tests colocated in `packages/agent-core/tests/unit/`.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid execution model. Security-critical BYOK injection and router orchestration require human review ([SYNC]). Type definitions, utility functions, and unit tests are suitable for agent delegation ([ASYNC]).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Type Definitions | 0 | 3 | Zod schemas are mechanical, low-risk |
| Router Core Logic | 2 | 0 | Routing + fallback chain is critical path, needs review |
| Health Tracker | 1 | 1 | State machine needs review; unit tests are ASYNC |
| BYOK Injection | 2 | 0 | Security-critical, must be human-reviewed |
| Error Classification | 0 | 2 | Utility functions, well-defined rules |
| Unit Tests | 0 | 5 | Test writing is safe for delegation |
| Integration | 1 | 0 | Wiring into existing agent layer needs review |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**
- ModelRouter.chatCompletion() — core routing + fallback orchestration
- BYOK key injection and vault decryption — security boundary
- ProviderHealthTracker state machine — correctness critical

**Agent-Delegated [ASYNC] Classifications:**
- Zod type definitions (router.ts, errors.ts)
- router-error-mapper.ts (classifyTransient/classifyPermanent)
- All unit tests
- barrel export updates

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Define router types | [ASYNC] | Type definitions | Low | Mechanical Zod schema work |
| ModelRouter class | [SYNC] | Core logic | High | Routing + fallback + health integration |
| ProviderRegistry class | [ASYNC] | Registry | Medium | Simple lookup + registration |
| ProviderHealthTracker | [SYNC] | State machine | High | Exponential backoff correctness, concurrent access |
| BYOKInjector | [SYNC] | Security | High | Vault decryption, key lifecycle, masking |
| classifyTransient/Permanent | [ASYNC] | Utility | Low | Pure function, well-defined rules |
| Unit tests (all) | [ASYNC] | Tests | Low | Test writing, no production risk |
| AGENTS.md update | [ASYNC] | Config | Low | Simple file edit |

## Complexity Tracking

> No constitution violations to justify.
