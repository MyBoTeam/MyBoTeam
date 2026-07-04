# Implementation Plan: OpenAI + Anthropic Providers

**Branch**: `MAO-153` | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-openai-anthropic-providers/spec.md`

## Summary

Implement OpenAI and Anthropic provider clients satisfying the ProviderClient interface for LLM integration in the MyBoteam daemon. Uses official SDK packages (`openai`, `@anthropic-ai/sdk`) with SSE streaming, tool call extraction, model fallback, health checks, and basic metrics.

## Technical Context

**Language/Version**: TypeScript 6.0+
**Primary Dependencies**: `openai` (OpenAI SDK), `@anthropic-ai/sdk` (Anthropic SDK), Zod (runtime validation), Vitest (testing)
**Storage**: N/A (provider clients are stateless)
**Testing**: Vitest with contract tests and unit tests (mocked APIs)
**Target Platform**: Node.js daemon (Electron renderer/daemon architecture)
**Project Type**: Library (provider implementations in packages/)
**Performance Goals**: < 100ms time-to-first-chunk for streaming, max 10 concurrent requests per provider
**Constraints**: Must conform to Biome lint rules without config changes, must satisfy ProviderClient interface from MAO-152
**Scale/Scope**: 2 provider implementations, 14 functional requirements, 5 user stories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ PASS | Spec exists with user stories and acceptance criteria |
| II. Test-First Quality | ✅ PASS | Unit tests (FR-010) and contract tests (FR-011) required |
| III. Simplicity & Surgical Changes | ✅ PASS | Provider implementations follow existing patterns |
| IV. Human Oversight | ✅ PASS | SYNC tasks for provider design, ASYNC for implementations |
| V. Observability, Security & Immutability | ✅ PASS | Health checks (FR-012) and metrics (FR-013) included |
| VI. Code Structure & Cleanliness | ✅ PASS | Files under 200 lines, single responsibility |
| VII. Source Reference (MANDATORY) | ✅ PASS | v0.2.0 conversation-provider.ts analyzed |
| VIII. Git Hooks | ✅ PASS | No --no-verify usage |
| IX. Linter/Formatter Configs | ✅ PASS | No config modifications |
| X. Test Location | ✅ PASS | Tests colocated in packages/*/tests/ |

## Project Structure

### Documentation (this feature)

```text
specs/010-openai-anthropic-providers/
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
├── provider.ts           # Existing Provider type (keep)
├── provider-client.ts    # Existing ProviderClient interface (keep)
├── chat.ts               # Existing ChatRequest, ChatResponse types (keep)
├── tools.ts              # Existing ToolDefinition, ToolCall types (keep)
├── streaming.ts          # Existing StreamingChunk type (keep)
├── models.ts             # Existing ModelInfo type (keep)
├── errors.ts             # Existing ProviderError type (keep)
└── index.ts              # Updated: export new provider types

packages/agent-core/src/
├── providers/
│   ├── openai-provider.ts      # NEW: OpenAI provider implementation
│   ├── anthropic-provider.ts   # NEW: Anthropic provider implementation
│   ├── provider-config.ts      # NEW: ProviderConfig type definition
│   ├── provider-errors.ts      # NEW: SDK error to ProviderError mapping
│   ├── provider-helpers.ts     # NEW: Shared helpers (isProviderError, safeJsonParse, executeWithFallback)
│   ├── retry-handler.ts        # NEW: Retry logic with configurable backoff
│   ├── concurrency-limiter.ts  # NEW: Semaphore-based concurrency control
│   ├── model-fallback.ts       # NEW: Model fallback strategy
│   ├── health-check.ts         # NEW: Health check implementation
│   └── metrics.ts              # NEW: Basic metrics emission
└── index.ts                    # Updated: export provider modules

packages/agent-core/tests/
├── contract/
│   ├── openai-provider.contract.test.ts   # NEW: contract tests
│   ├── anthropic-provider.contract.test.ts # NEW: contract tests
│   └── error-responses.contract.test.ts   # NEW: error response contract tests
└── unit/
    ├── openai-provider.test.ts            # NEW: unit tests
    ├── anthropic-provider.test.ts         # NEW: unit tests
    ├── retry-handler.test.ts              # NEW: retry logic unit tests
    ├── model-fallback.test.ts             # NEW: unit tests
    ├── health-check.test.ts               # NEW: unit tests
    └── metrics.test.ts                    # NEW: unit tests
```

**Structure Decision**: Providers go in `packages/agent-core/src/providers/` following existing daemon architecture. Types remain in `packages/types/src/`. Tests colocated per Constitution Principle X.

## Source Reference Analysis (MANDATORY)

### v0.2.0 Reference Implementation

**Source Location**: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.2.0/packages/daemon/src/`

**Files Analyzed**:
- `conversation-provider.ts` (287 lines) - Main LLM provider integration
- Lines 17-40: `buildRequest()` - Request formatting for OpenAI vs Anthropic
- Lines 42-180: `tryModel()` - Core API caller with SSE streaming, tool call extraction
- Lines 182-226: `callProviderApi()` - Unified entry point with model fallback
- Lines 228-244: `registerStreamChunkRpc()` - RPC registration pattern

**Key Patterns to Adopt**:
1. **Provider detection** (line 190): Model ID pattern matching (`claude` → Anthropic, else OpenAI)
2. **SSE streaming** (lines 100-162): Reader-based streaming with buffer handling
3. **Tool call extraction** (lines 72-98, 126-156): Aggregation of streaming tool call chunks
4. **Model fallback** (lines 196-221): Try requested → try without date suffix → try fallback model
5. **Timeout handling** (line 62): `AbortSignal.timeout(120000)` for 120s default

**Patterns NOT to Adopt** (not needed for v0.5.0):
- **Direct HTTP fetch** (lines 58-63): Use official SDK packages instead
- **Mixed response handling** (lines 68-99): SDK handles response parsing
- **Inline error text extraction** (lines 65-66): Use typed ProviderError instead
- **Hardcoded base URLs** (lines 191-193): Use ProviderConfig.baseUrl

**Exact File:Line References for Tasks**:
- `conversation-provider.ts:190` → Provider detection logic
- `conversation-provider.ts:100-162` → SSE streaming pattern
- `conversation-provider.ts:72-98` → Anthropic tool call extraction
- `conversation-provider.ts:141-156` → OpenAI tool call extraction
- `conversation-provider.ts:196-221` → Model fallback pattern

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: This feature will use a hybrid execution model combining human expertise ([SYNC]) with autonomous agent delegation ([ASYNC]).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Provider Interface Design | 2 | 0 | Core contract requires human judgment |
| Provider Implementation | 0 | 4 | Mechanical SDK integration |
| Error Handling | 1 | 2 | Discriminated union design needs review |
| Health Checks & Metrics | 0 | 2 | Straightforward implementation |
| Contract Tests | 1 | 2 | Test structure needs review, assertions mechanical |
| Unit Tests | 0 | 3 | Mechanical test authoring |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- OpenAI provider class design — core contract affecting all downstream features
- Anthropic provider class design — must match OpenAI provider patterns
- Error type mapping — affects error handling patterns across the codebase

**Agent-Delegated [ASYNC] Classifications:**

- SDK integration for chat completion and streaming
- Model fallback logic implementation
- Health check endpoint implementation
- Metrics emission implementation
- Unit test assertions

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Design OpenAI provider class | [SYNC] | Architecture impact | High | Core contract for LLM integration |
| Design Anthropic provider class | [SYNC] | Architecture impact | High | Must match OpenAI patterns |
| Implement OpenAI chatCompletion | [ASYNC] | Mechanical | Low | SDK integration follows patterns |
| Implement OpenAI streamChat | [ASYNC] | Mechanical | Low | SDK integration follows patterns |
| Implement Anthropic chatCompletion | [ASYNC] | Mechanical | Low | SDK integration follows patterns |
| Implement Anthropic streamChat | [ASYNC] | Mechanical | Low | SDK integration follows patterns |
| Design error type mapping | [SYNC] | Architecture impact | Medium | Error handling patterns |
| Implement model fallback | [ASYNC] | Mechanical | Low | Pattern from v0.2.0 |
| Implement health checks | [ASYNC] | Mechanical | Low | Standard implementation |
| Implement metrics emission | [ASYNC] | Mechanical | Low | Standard implementation |
| Write contract tests | [ASYNC] | Mechanical | Low | Test assertions follow patterns |
| Write unit tests | [ASYNC] | Mechanical | Low | Test assertions follow patterns |

## Complexity Tracking

> No constitution violations detected — all principles satisfied.
