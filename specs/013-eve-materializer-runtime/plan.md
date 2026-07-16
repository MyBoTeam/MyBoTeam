# Implementation Plan: Eve Materializer (Runtime File Generation)

**Branch**: `013-eve-materializer-runtime` | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-eve-materializer-runtime/spec.md`

## Summary

Build the Eve materializer that generates deterministic runtime files from agent configuration. The materializer produces five individual files per agent (`instructions.md`, `tool-catalog.json`, `delegation-policy.json`, `provider-config.json`, `checksums.sha256`) under `.local-data/agents/{agent-id}/`. It is invoked explicitly before agent startup, is idempotent, and transitions agent status from `idle` to `materialized`.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js)
**Primary Dependencies**: `@myboteam/types` (Zod schemas), `better-sqlite3` (AgentRegistry)
**Storage**: SQLite via AgentRegistry (agent configs), filesystem (materialized runtime files)
**Testing**: Vitest (unit tests colocated in `packages/agent-core/tests/unit/`)
**Target Platform**: macOS desktop daemon (Electron main process)
**Project Type**: daemon service (packages/agent-core)
**Performance Goals**: Materialization completes in under 500ms (SC-001)
**Constraints**: Blocked by M5-1; blocking M5-3, M5-5; source reference v0.3.0 config-builder
**Scale/Scope**: Max 20 agents per instance; single-agent materialization serialized by daemon

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Dev | ✅ | Spec exists with user stories, acceptance scenarios, success criteria |
| II. Test-First Quality | ✅ | Unit tests required for materialization output (spec constraint) |
| III. Simplicity | ✅ | Single materializer module, no speculative abstractions |
| IV. Human Oversight | ✅ | Explicit materialization gives operator control |
| V. Observability, Security | ✅ | Logging via Logger; no secrets in materialized files |
| VI. Code Structure | ✅ | Files <200 lines; one class per file |
| VII. Source Reference | ✅ | v0.3.0 config-builder read and analyzed |
| VIII. Git Hooks | ✅ | No --no-verify |
| IX. Linter Configs | ✅ | No config modifications |
| X. Test Location | ✅ | Tests in `packages/agent-core/tests/unit/` |

**Gate Result**: PASS — no violations detected.

## Source Reference Analysis

### v0.3.0 Config Builder

**File**: `packages/agent-core/src/opencode/config-builder.ts` (v0.3.0)
**Lines**: 1–125

**Patterns to adopt**:
- Context-based builder pattern: `buildProviderConfigs(ctx)` accepts a context object with provider settings, API keys, active model (lines 51–63)
- Provider-specific sub-builders: each provider has a dedicated `build*Config(ctx)` function (lines 90–107)
- Result aggregation: collect configs, merge enabled providers, apply model overrides (lines 109–124)
- `ProviderConfigResult` interface: `{ providerConfigs, enabledProviders, modelOverride }` (lines 37–41)

**Patterns NOT to adopt**:
- `getApiKey` callback pattern (line 45): Not needed — M5-2 generates `provider-config.json` without API keys; keys injected at runtime by BYOKInjector per ADR-006
- Provider-specific config types (`config-providers-*.ts`): M5-2 generates a simpler serializable JSON, not full provider SDK configs
- `Promise.all` for parallel builder execution (line 90): M5-2 builders are synchronous and lightweight

### ADR-002 Eve Agent Harness

**File**: `.specify/memory/adr/ADR-002.md`
**Lines**: 41–51

**Patterns to adopt**:
- Materialized files at `.local-data/agents/{agent-id}/` (line 42)
- Status lifecycle: `idle → materialized → starting → running → stopped → error` (line 51)
- Per-agent tool assignment via MCP (line 48)
- Peer agent catalog injected into instructions (line 57)

### ADR-006 LLM Provider Model

**File**: `.specify/memory/adr/ADR-006.md`
**Lines**: 46–68

**Patterns to adopt**:
- Per-agent provider override: optional `provider` and `model` fields (line 47)
- Key injection at materialization time — keys never in materialized files (line 61)
- `provider-config.json` contains provider name, model, params — NO API keys (line 67)

## Project Structure

### Documentation (this feature)

```text
specs/013-eve-materializer-runtime/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty — no external API)
└── tasks.md             # Phase 2 output (/spec.tasks)
```

### Source Code (repository root)

```text
packages/agent-core/src/
├── eve/
│   ├── index.ts              # Public API: materialize(), dematerialize(), types
│   ├── materializer.ts       # Core materialization logic
│   ├── file-writers.ts       # Individual file generation (instructions, catalog, policy, config, checksums)
│   └── runtime-files.ts      # Type definitions for runtime files
├── agent-registry.ts         # Existing — status transitions
└── agent-defaults.ts         # Existing — default agent configs

packages/agent-core/tests/unit/
├── eve/
│   ├── materializer.test.ts
│   ├── profile-injection.test.ts
│   └── delegation-policy.test.ts
```

**Structure Decision**: `eve/` directory under `packages/agent-core/src/` with four focused modules (materializer, file-writers, runtime-files, index). Tests colocated in `tests/unit/eve/`. Follows Constitution Principle X (test location) and Principle VI (code structure — files <200 lines, one class/function per file). Named `eve` after the Eve Agent Harness (ADR-002) to distinguish from the generic `materializer/` convention.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid model — [SYNC] for core materializer logic (security-sensitive file I/O, status transitions), [ASYNC] for template boilerplate and test scaffolding.

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Core Materializer | 3 | 0 | File I/O, status transitions, error handling — requires human review |
| File Writers | 2 | 1 | Instructions template is ASYNC (boilerplate); catalog/policy generation is SYNC |
| Template Engine | 0 | 1 | Default template generation is straightforward ASYNC |
| Unit Tests | 1 | 2 | Test scaffolding is ASYNC; assertion logic is SYNC |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- `materialize()` core function — status transition + file I/O + error handling + rollback
- `dematerialize()` — file removal + status reset
- Checksum generation — integrity verification correctness

**Agent-Delegated [ASYNC] Classifications:**

- Default instruction template generation — boilerplate Markdown
- Test file scaffolding — repetitive test structure
- Provider config file writing — JSON serialization of existing types

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Materializer core (materialize/dematerialize) | SYNC | File I/O + state | High | Status transitions must be correct; partial failure cleanup |
| Instructions writer | SYNC | Content correctness | Med | Profile injection must match spec exactly |
| Tool catalog writer | SYNC | Data filtering | Med | Must filter correctly per agent skills/MCP |
| Delegation policy writer | SYNC | Validation | Med | Cycle detection required |
| Checksum manifest writer | ASYNC | Deterministic output | Low | SHA-256 is standard library |
| Provider config writer | ASYNC | JSON serialization | Low | Wraps existing types |
| Default template engine | ASYNC | Template generation | Low | Boilerplate Markdown |
| Unit tests — materializer | SYNC | Test correctness | Med | Must verify idempotency, cleanup, status transitions |
| Unit tests — file writers | ASYNC | Test scaffolding | Low | Repetitive test patterns |
| Unit tests — template engine | ASYNC | Test scaffolding | Low | Simple template output tests |
