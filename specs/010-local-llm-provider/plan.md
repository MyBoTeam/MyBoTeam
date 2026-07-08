# Implementation Plan: Local LLM Provider (Ollama/LMStudio)

**Branch**: `010-local-llm-provider` | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-local-llm-provider/spec.md`

## Summary

Implement ProviderClient interface implementations for Ollama and LMStudio local LLM providers, enabling MyBot to use local models as alternatives to cloud-based APIs. The feature includes provider configuration, model discovery, chat completion, streaming, auto-discovery, and full observability.

## Technical Context

**Language/Version**: TypeScript 6.0.3  
**Primary Dependencies**: zod (runtime validation), vitest (testing), biome (linting)  
**Storage**: Application settings system (existing infrastructure)  
**Testing**: vitest 4.1.9  
**Target Platform**: Node.js desktop application (Electron-based)  
**Project Type**: Desktop application with daemon architecture  
**Performance Goals**: Chat completion <30s, streaming first token <5s, model listing <2s, auto-discovery <5s  
**Constraints**: Local providers must expose OpenAI-compatible API endpoints  
**Scale/Scope**: Single-user desktop application, local network only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ PASS | Spec exists with user stories, acceptance scenarios, success criteria |
| II. Test-First Quality | ✅ PASS | Contract tests required (FR-011), test locations defined |
| III. Simplicity & Surgical Changes | ✅ PASS | Minimal implementation following existing patterns |
| IV. Human Oversight | ✅ PASS | SYNC/ASYNC classification planned |
| V. Observability, Security & Immutability | ✅ PASS | Structured logging + metrics (FR-015, FR-016), auth support (FR-018) |
| VI. Code Structure & Cleanliness | ✅ PASS | Files <200 lines, single responsibility |
| VII. Source Reference (MANDATORY) | ✅ PASS | Source reference analysis completed |
| VIII. Git Hooks | ✅ PASS | No --no-verify usage |
| IX. Linter/Formatter Configs | ✅ PASS | No config modifications |
| X. Test Location | ✅ PASS | Tests colocated with code |

**Post-Design Re-evaluation**: All principles continue to pass after Phase 1 design.

## Source Reference Analysis (MANDATORY)

### v0.2.0 Reference Implementation

**Source Location**: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.2.0/packages/daemon/src/`

**Files Analyzed**:
- No direct provider implementations found in v0.2.0 (cloud-only era)

### v0.4.0 Reference Implementation

**Source Location**: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.4.0/packages/agent-core/src/`

**Files Analyzed**:
- Provider interface patterns (if any exist)

### Current Codebase (v0.5.0)

**Source Location**: `/Users/mavishay/Projects/MaorInnovations/myboteam_v0.5.0/.worktrees/MAO-154/packages/`

**Key Patterns to Adopt**:
1. ProviderClient interface from `types/src/provider-client.ts:6-10`
2. Provider schema with type enum from `types/src/provider.ts:3`
3. ChatRequest/ChatResponse types from `types/src/chat.ts`
4. StreamingChunk type from `types/src/streaming.ts`
5. ProviderError with category from `types/src/errors.ts`

**MAO-153 Provider Infrastructure (Reusable)**:
1. `provider-errors.ts` — `toProviderError()` function for mapping SDK errors to ProviderError types
2. `provider-helpers.ts` — `isProviderError()`, `safeJsonParse()` utility functions
3. `metrics.ts` — `MetricsEmitter` class for provider metrics
4. `health-check.ts` — `checkHealth()` function with timeout support
5. `provider-config.ts` — Provider configuration patterns

**Patterns NOT to Adopt**:
- Cloud-specific authentication patterns (local providers use optional API keys)
- Rate limiting enforcement (respect headers only, per FR-017)
- Retry logic (local providers MUST NOT include retry logic per FR-014)

## Project Structure

### Documentation (this feature)

```text
specs/010-local-llm-provider/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/spec.tasks command)
```

### Source Code (repository root)

```text
packages/agent-core/src/services/providers/        # NEW: Local providers
├── index.ts                    # Provider factory/registry
├── ollama-provider.ts          # Ollama ProviderClient implementation
├── lmstudio-provider.ts        # LMStudio ProviderClient implementation
├── local-provider-base.ts      # Shared base class for local providers
├── provider-discovery.ts       # Auto-discovery service
└── types.ts                    # Provider-specific types

packages/agent-core/src/providers/                  # EXISTING: Cloud providers (MAO-153)
├── provider-errors.ts          # REUSE: toProviderError() for error mapping
├── provider-helpers.ts         # REUSE: isProviderError(), safeJsonParse()
├── metrics.ts                  # REUSE: MetricsEmitter for metrics
└── provider-config.ts          # REUSE: Configuration patterns

packages/agent-core/tests/contract/providers/
├── ollama-provider.test.ts     # Contract tests for Ollama
├── lmstudio-provider.test.ts   # Contract tests for LMStudio
└── provider-discovery.test.ts  # Discovery service tests
```

**Structure Decision**: Local providers are placed in `packages/agent-core/src/services/providers/` following the existing services pattern. Cloud providers from MAO-153 are in `packages/agent-core/src/providers/`. Shared utilities (error mapping, metrics, health checks) should be imported from the existing cloud provider infrastructure to avoid duplication.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid execution model with human review for architectural decisions and agent delegation for implementation tasks.

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Provider Implementation | 2 | 4 | Base class + interface implementation requires review; boilerplate can be delegated |
| Configuration & Discovery | 1 | 2 | Configuration schema requires review; implementation is straightforward |
| Testing | 1 | 3 | Contract test design requires review; test writing can be delegated |
| Observability | 0 | 2 | Logging/metrics patterns are well-established |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**
- Provider base class design (architectural decision)
- Configuration schema definition (data model impact)
- Contract test design (test strategy)

**Agent-Delegated [ASYNC] Classifications:**
- Ollama provider implementation (follows base class pattern)
- LMStudio provider implementation (follows base class pattern)
- Provider discovery implementation (straightforward port scanning)
- Unit test writing (follows existing patterns)

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Design provider base class | [SYNC] | Architecture | High | Core abstraction that all providers depend on |
| Define configuration schema | [SYNC] | Data Model | Medium | Impacts all provider implementations |
| Design contract tests | [SYNC] | Test Strategy | Medium | Defines acceptance criteria for all providers |
| Implement Ollama provider | [ASYNC] | Implementation | Low | Follows established patterns |
| Implement LMStudio provider | [ASYNC] | Implementation | Low | Follows established patterns |
| Implement provider discovery | [ASYNC] | Implementation | Low | Straightforward port scanning |
| Write unit tests | [ASYNC] | Implementation | Low | Follows existing test patterns |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations identified. All principles can be satisfied with standard implementation patterns.
