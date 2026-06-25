# Implementation Plan: pnpm Workspace + Monorepo Scaffold

**Branch**: `002-pnpm-workspace-scaffold` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-pnpm-workspace-scaffold/spec.md`

## Summary

Set up pnpm workspace and monorepo scaffold for MyBoteam V0.5.0 as the foundation for M1 milestone. This includes creating `pnpm-workspace.yaml`, root `package.json`, `.npmrc`, and the `apps/` and `packages/` directories. The workspace structure is based on v0.2.0 with no code reuse — structural configuration only.

## Technical Context

**Language/Version**: TypeScript (Node.js 24)

**Primary Dependencies**: pnpm (package manager)

**Storage**: N/A (configuration files only)

**Testing**: N/A (scaffold only — no application code to test)

**Target Platform**: Cross-platform (Node.js runtime)

**Project Type**: monorepo

**Performance Goals**: `pnpm install` completes in under 30 seconds

**Constraints**: M1 Foundation milestone, Effort S (Small), Source v0.2.0, No code reuse

**Scale/Scope**: Scaffold only — 3 config files, 2 directories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ PASS | Spec exists with user stories and acceptance criteria |
| II. Test-First Quality | ⚠️ DEFERRED | No tests for scaffold (config files only). Validation via `pnpm install` acceptance scenarios |
| III. Simplicity & Surgical Changes | ✅ PASS | Minimal scaffold — 3 files, 2 directories |
| IV. Human Oversight & Goal-Driven Execution | ✅ PASS | Human review required before merge |
| V. Observability, Security & Immutability | ⚠️ DEFERRED | No logging/metrics (scaffold only). Security: minimal .npmrc |
| VI. Code Structure & Cleanliness | ✅ PASS | Clean monorepo structure |

**Gate Result**: PASS with deferred items (acceptable for scaffold milestone)

## Project Structure

### Documentation (this feature)

```text
specs/002-pnpm-workspace-scaffold/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A for scaffold)
└── tasks.md             # Phase 2 output (NOT created by /spec.plan)
```

### Source Code (repository root)

```text
# Monorepo scaffold structure
pnpm-workspace.yaml     # Workspace package definitions
package.json             # Root package manifest with scripts
.npmrc                   # pnpm configuration (Node.js version)
apps/                    # Directory for application packages
packages/                # Directory for shared library packages
└── mcp-servers/         # Subdirectory for MCP server packages
```

**Structure Decision**: Standard pnpm monorepo layout with `apps/` for applications and `packages/` for shared code. The `packages/mcp-servers/` subdirectory is included for MCP server packages as specified in the workspace patterns.

## Complexity Tracking

> **No violations to justify** — this is a minimal scaffold with clean structure.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
