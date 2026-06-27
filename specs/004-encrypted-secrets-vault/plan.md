# Implementation Plan: Encrypted Secrets Vault (AES-256-GCM)

**Branch**: `004-encrypted-secrets-vault` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-encrypted-secrets-vault/spec.md`

## Summary

Implement an encrypted secrets vault using AES-256-GCM encryption for secure storage of API keys, OAuth tokens, and credentials. The vault provides local-first, single-user architecture with PBKDF2 key derivation (100k iterations), read-write locks for concurrent access, and a centralized refresh service for OAuth tokens. Secrets are identified by unique string names and tracked through Active/Expired/Deleted lifecycle states.

## Technical Context

**Language/Version**: TypeScript 5.7+ (Node.js)  
**Primary Dependencies**: better-sqlite3, pino (logging), zod (validation)  
**Storage**: AES-256-GCM encrypted JSON file (`.local-data/secure-storage.json`)  
**Testing**: vitest (unit, integration, contract tests)  
**Target Platform**: Desktop (macOS, Windows, Linux)  
**Project Type**: Desktop application (local-first daemon)  
**Performance Goals**: Key derivation <5 seconds, concurrent vault access without corruption  
**Constraints**: No cross-device sync, no multi-user support, secrets never in renderer/logs  
**Scale/Scope**: Single-user, local-first, ~100-1000 secrets per vault

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Compliant | Feature spec with user stories, acceptance scenarios, success criteria |
| II. Test-First Quality | ✅ Compliant | Tests required before implementation, contract/integration tests for vault API |
| III. Simplicity & Surgical Changes | ✅ Compliant | Minimal vault implementation, no speculative features |
| IV. Human Oversight & Goal-Driven Execution | ✅ Compliant | [SYNC] tasks for security-critical code, [ASYNC] for tests |
| V. Observability, Security & Immutability | ✅ Compliant | Encrypted at rest, atomic writes, least privilege for key material |
| VI. Code Structure & Cleanliness | ✅ Compliant | Files <200 lines, single responsibility, TypeScript idioms |
| VII. Source Reference (MANDATORY) | ✅ Compliant | ADR-004 defines storage architecture, vault patterns from v0.2.0-v0.4.0 |

**Gate Result**: PASS — All principles satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/004-encrypted-secrets-vault/
├── plan.md              # This file (/spec.plan command output)
├── research.md          # Phase 0 output (/spec.plan command)
├── data-model.md        # Phase 1 output (/spec.plan command)
├── quickstart.md        # Phase 1 output (/spec.plan command)
├── contracts/           # Phase 1 output (/spec.plan command)
└── tasks.md             # Phase 2 output (/spec.tasks command - NOT created by /spec.plan)
```

### Source Code (repository root)

```text
packages/agent-core/src/
├── vault/
│   ├── vault-service.ts      # Main vault service (CRUD operations)
│   ├── vault-crypto.ts       # AES-256-GCM encryption/decryption
│   ├── vault-key-provider.ts # Key derivation (PBKDF2) and management
│   ├── vault-refresh.ts      # Centralized OAuth token refresh service
│   ├── vault-types.ts        # TypeScript types and interfaces
│   └── index.ts              # Public API exports
├── storage/
│   └── vault-store.ts        # File-based vault storage with atomic writes
└── index.ts                  # Re-exports vault module

packages/types/src/
└── vault.ts                  # Zod schemas and TypeScript types (existing)

packages/agent-core/tests/
├── unit/
│   └── vault/
│       ├── vault-crypto.test.ts
│       ├── vault-key-provider.test.ts
│       └── vault-refresh.test.ts
├── integration/
│   └── vault/
│       ├── vault-file-storage.test.ts
│       └── vault-concurrent-access.test.ts
└── contract/
    └── vault-api.test.ts
```

**Structure Decision**: Vault implementation follows existing `packages/agent-core/src/` pattern. Types remain in `packages/types/src/vault.ts` (already exists). Tests are colocated with the package in `packages/agent-core/tests/` following project convention.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: This feature will use a hybrid execution model combining human expertise ([SYNC]) with autonomous agent delegation ([ASYNC]).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Security-Critical Code | 3 | 0 | AES-256-GCM, PBKDF2, key derivation require human review |
| Business Logic | 2 | 2 | Vault CRUD is straightforward, refresh service needs review |
| Data Operations | 1 | 2 | File storage pattern established, tests can be delegated |
| UI Components | 0 | 0 | No UI in this feature |
| Integrations | 1 | 1 | Refresh service integration needs review |
| Infrastructure | 0 | 2 | File structure follows existing patterns |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- **vault-crypto.ts**: AES-256-GCM implementation with PBKDF2 key derivation — security-critical, requires human cryptographic review
- **vault-key-provider.ts**: Key derivation from platform identifiers — security boundary, requires human review
- **vault-refresh.ts**: OAuth token refresh logic — external service integration, requires human review

**Agent-Delegated [ASYNC] Classifications:**

- **vault-service.ts**: CRUD operations — follows established service patterns
- **vault-store.ts**: File storage with atomic writes — follows existing storage patterns
- **Unit tests**: Test implementation for vault operations
- **Integration tests**: File storage and concurrent access tests

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Implement AES-256-GCM encryption | [SYNC] | Security | High | Cryptographic implementation requires expert review |
| Implement PBKDF2 key derivation | [SYNC] | Security | High | Security boundary for key material |
| Implement vault CRUD service | [ASYNC] | Complexity | Low | Follows established service patterns |
| Implement file storage with atomic writes | [ASYNC] | Complexity | Low | Pattern established in ADR-004 |
| Implement OAuth refresh service | [SYNC] | Integration | Medium | External service integration needs review |
| Write unit tests for crypto | [ASYNC] | Complexity | Low | Test implementation straightforward |
| Write integration tests | [ASYNC] | Complexity | Low | Test patterns established |

## Complexity Tracking

> **No Constitution Check violations requiring justification.**

All implementation follows established patterns from ADR-004 (Storage Architecture) and existing codebase conventions. No architectural deviations required.
