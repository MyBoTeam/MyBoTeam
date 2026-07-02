# Implementation Plan: ProviderClient Interface

**Branch**: `MAO-152` | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-provider-client-interface/spec.md`

## Summary

Define a standardized ProviderClient interface for LLM provider communication with type-safe Zod validation, tool calling support, AsyncIterable streaming, and typed error handling. This is the foundational interface that all subsequent LLM features (M4-2 through M4-5) depend on.

## Technical Context

**Language/Version**: TypeScript 6.0+
**Primary Dependencies**: Zod (runtime validation), Vitest (testing)
**Storage**: N/A (interface definitions only)
**Testing**: Vitest with contract tests
**Target Platform**: Node.js daemon (Electron renderer/daemon architecture)
**Project Type**: Library (shared types package)
**Performance Goals**: N/A (interface definitions, no runtime overhead)
**Constraints**: Must conform to Biome lint rules without config changes
**Scale/Scope**: 8 type definitions, 3 interface methods, 4 error categories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ PASS | Spec exists with user stories and acceptance criteria |
| II. Test-First Quality | ✅ PASS | Contract tests required per FR-004 |
| III. Simplicity & Surgical Changes | ✅ PASS | Interface definitions only, no over-engineering |
| IV. Human Oversight | ✅ PASS | SYNC tasks for interface design, ASYNC for type definitions |
| V. Observability, Security & Immutability | ✅ PASS | No secrets, immutable types |
| VI. Code Structure & Cleanliness | ✅ PASS | Files under 200 lines, single responsibility |
| VII. Source Reference (MANDATORY) | ✅ PASS | v0.2.0 conversation-provider.ts analyzed |
| VIII. Git Hooks | ✅ PASS | No --no-verify usage |
| IX. Linter/Formatter Configs | ✅ PASS | No config modifications |
| X. Test Location | ✅ PASS | Tests colocated in packages/types/tests/ |

## Project Structure

### Documentation (this feature)

```text
specs/009-provider-client-interface/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/spec.tasks)
```

### Source Code (repository root)

```text
packages/types/
├── src/
│   ├── provider.ts           # Existing Provider type (keep)
│   ├── provider-client.ts    # NEW: ProviderClient interface + method types
│   ├── chat.ts               # NEW: ChatRequest, ChatResponse, ChatMessage
│   ├── tools.ts              # NEW: ToolDefinition, ToolCall
│   ├── streaming.ts          # NEW: StreamingChunk, AsyncIterable types
│   ├── models.ts             # NEW: ModelInfo type
│   ├── errors.ts             # NEW: ProviderError discriminated union
│   └── index.ts              # Updated: export new types
├── tests/
│   ├── contract/
│   │   └── provider-client.contract.test.ts  # NEW: contract tests
│   └── unit/
│       ├── chat.test.ts       # NEW: validation schema tests
│       ├── tools.test.ts      # NEW: tool type tests
│       ├── streaming.test.ts  # NEW: streaming type tests
│       ├── models.test.ts     # NEW: model info tests
│       └── errors.test.ts     # NEW: error type tests
└── package.json
```

**Structure Decision**: Types go in `packages/types/src/` following existing pattern. Contract tests in `packages/types/tests/contract/` per Constitution Principle X.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid model — interface design requires human review ([SYNC]), type definitions are mechanical and agent-delegatable ([ASYNC]).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Interface Design | 2 | 0 | Core interface shape requires human judgment |
| Type Definitions | 0 | 5 | Mechanical Zod schema authoring |
| Error Types | 1 | 2 | Discriminated union design needs review |
| Contract Tests | 1 | 3 | Test structure needs review, assertions mechanical |
| Documentation | 0 | 2 | Quickstart and data model are straightforward |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- ProviderClient interface method signatures — core contract affecting all downstream features
- Error type discriminated union — affects error handling patterns across the codebase

**Agent-Delegated [ASYNC] Classifications:**

- Zod schema definitions for ChatRequest, ChatResponse, StreamingChunk, ModelInfo
- Contract test assertions for type validation
- Data model documentation

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Define ProviderClient interface | [SYNC] | Architecture impact | High | Core contract for M4-2 through M4-5 |
| Define ChatMessage/ChatRequest/ChatResponse types | [ASYNC] | Mechanical | Low | Follows established Zod patterns |
| Define ToolDefinition/ToolCall types | [ASYNC] | Mechanical | Low | Follows established Zod patterns |
| Define StreamingChunk + AsyncIterable | [SYNC] | Architecture impact | Medium | Streaming pattern affects API design |
| Define ModelInfo type | [ASYNC] | Mechanical | Low | Simple metadata type |
| Define ProviderError discriminated union | [SYNC] | Architecture impact | Medium | Error handling patterns |
| Write contract tests | [ASYNC] | Mechanical | Low | Test assertions follow patterns |
| Update index.ts exports | [ASYNC] | Mechanical | Low | Export additions |

## Complexity Tracking

> No constitution violations detected — all principles satisfied.
