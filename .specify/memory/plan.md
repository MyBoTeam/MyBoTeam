# Implementation Plan: Custom Provider Configuration

**Branch**: `010-custom-provider-config` | **Date**: 2026-07-02 | **Spec**: [link](spec.md)
**Input**: Feature specification from `/specs/010-custom-provider-config/spec.md`

**Note**: This template is filled in by the `/spec.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement custom LLM provider configuration with URL, API key, and model name, supporting OpenAI-compatible endpoints with secure credential storage. Builds upon existing provider infrastructure from v0.3.0, extending the `testCustomConnection()` function to include full configuration management, validation, and secure storage.

## Technical Context

**Language/Version**: TypeScript 6.0.3  
**Primary Dependencies**: Node.js fetch API, existing vault infrastructure, existing provider utilities  
**Storage**: Existing vault service (encrypted storage)  
**Testing**: Vitest 4.1.9  
**Target Platform**: Node.js runtime (cross-platform)  
**Project Type**: Library/package (agent-core package)  
**Performance Goals**: Connection tests within 10 seconds, configuration save/load under 100ms  
**Constraints**: Must use existing vault infrastructure, must be OpenAI-compatible, must not store API keys in plaintext  
**Scale/Scope**: Up to 50 custom providers per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I (Spec-Driven Development)**: ✅ PASS - Feature has complete specification with user stories, acceptance scenarios, and success criteria.

**Principle II (Test-First Quality)**: ✅ PASS - Unit tests required for config validation; contract tests for provider interface; integration tests for vault storage.

**Principle III (Simplicity & Surgical Changes)**: ✅ PASS - Extends existing provider infrastructure; minimal new code; follows existing patterns.

**Principle IV (Human Oversight & Goal-Driven Execution)**: ✅ PASS - Success criteria defined; multi-step plan with verification; SYNC tasks for security-critical components.

**Principle V (Observability, Security & Immutability)**: ✅ PASS - API keys encrypted at rest; logging for connection tests; validation at system boundaries.

**Principle VII (Source Reference)**: ✅ PASS - Source reference analysis completed for v0.3.0 custom.ts; patterns to adopt and avoid documented.

**Principle VIII (Git Hooks)**: ✅ PASS - Will use git hooks for commits; no --no-verify.

**Principle IX (Linter/Formatter Configs)**: ✅ PASS - Will not modify biome.json or other configs; will fix code to match existing rules.

**Principle VI (Code Structure & Cleanliness)**: ✅ PASS - Will keep files under 200 lines; single responsibility per file.

**Principle X (Test Location)**: ✅ PASS - Tests will be colocated in packages/agent-core/tests/unit/ and tests/contract/.

## Project Structure

### Documentation (this feature)

```text
specs/010-custom-provider-config/
├── plan.md              # This file (/spec.plan command output)
├── research.md          # Phase 0 output (/spec.plan command)
├── data-model.md        # Phase 1 output (/spec.plan command)
├── quickstart.md        # Phase 1 output (/spec.plan command)
├── contracts/           # Phase 1 output (/spec.plan command)
└── tasks.md             # Phase 2 output (/spec.tasks command - NOT created by /spec.plan)
```

### Source Code (repository root)

```text
packages/agent-core/
├── src/
│   ├── providers/
│   │   ├── custom.ts           # Existing: testCustomConnection()
│   │   ├── custom-config.ts    # NEW: Custom provider configuration management
│   │   └── custom-validation.ts # NEW: URL, API key, model validation
│   ├── vault/
│   │   └── vault-service.ts    # Existing: encrypted storage
│   └── utils/
│       ├── url.ts              # Existing: validateHttpUrl()
│       └── sanitize.ts         # Existing: sanitizeString()
└── tests/
    ├── unit/
    │   └── providers/
    │       ├── custom-config.test.ts      # NEW: Unit tests for configuration
    │       └── custom-validation.test.ts  # NEW: Unit tests for validation
    └── contract/
        └── providers/
            └── custom-provider.test.ts    # NEW: Contract tests for provider interface
```

**Structure Decision**: Extends existing agent-core package structure. New files added to providers directory following existing patterns. Tests colocated per Principle X.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: This feature will use a hybrid execution model combining human expertise ([SYNC]) with autonomous agent delegation ([ASYNC]).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 2 | 3 | Configuration management (SYNC), validation logic (ASYNC) |
| Data Operations | 1 | 2 | Vault integration (SYNC), storage operations (ASYNC) |
| UI Components | 0 | 0 | No UI components in this feature |
| Integrations | 2 | 1 | Provider connection tests (SYNC), API format handling (ASYNC) |
| Infrastructure | 1 | 1 | Error handling patterns (SYNC), logging setup (ASYNC) |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- **Vault integration**: Security-critical; requires human review for encryption implementation
- **Provider connection tests**: Network operations with security implications; requires validation
- **Error handling patterns**: Security-sensitive error messages; must not leak secrets

**Agent-Delegated [ASYNC] Classifications:**

- **Validation logic**: URL format validation, API key format validation
- **Storage operations**: CRUD operations for provider configuration
- **API format handling**: Response format detection and transformation

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Implement CustomProvider entity | [ASYNC] | Data model | Low | Straightforward entity definition |
| Implement vault integration | [SYNC] | Security | High | Encryption implementation requires human review |
| Implement URL validation | [ASYNC] | Business logic | Low | Uses existing validateHttpUrl() utility |
| Implement connection tests | [SYNC] | Security/Integration | High | Network operations with security implications |
| Implement response format handling | [ASYNC] | Business logic | Low | Auto-detection logic with clear patterns |

## Complexity Tracking

> **No Constitution violations detected. All principles satisfied.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
