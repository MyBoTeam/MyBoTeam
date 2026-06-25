# Research: pnpm Workspace + Monorepo Scaffold

**Date**: 2026-06-25
**Feature**: 002-pnpm-workspace-scaffold

## Research Questions

### 1. What should the pnpm-workspace.yaml structure be?

**Decision**: Use v0.2.0 structure with `apps/*`, `packages/*`, `packages/mcp-servers/*` patterns

**Rationale**:
- The ticket specifies "Source: v0.2.0 (pnpm-workspace.yaml, root package.json)"
- The acceptance criteria define these exact patterns
- This is a proven structure from the v0.2.0 project

**Alternatives Considered**:
- Flat structure without `mcp-servers` subdirectory — Rejected because ticket explicitly requires it
- Nested `apps/web`, `apps/api` — Rejected because out of scope (no application code)

### 2. What should the root package.json scripts do?

**Decision**: Use `pnpm -r` commands that delegate to individual workspace packages

**Rationale**:
- `pnpm -r` recursively runs commands in all workspace packages
- This is the standard pattern for monorepo script delegation
- Allows each package to define its own build/dev/check/test scripts
- Root scripts provide a unified entry point for developers

**Alternatives Considered**:
- Stub scripts that echo "Not implemented yet" — Rejected because it provides no value
- Scripts from a shared package — Rejected because adds unnecessary complexity for scaffold

### 3. What should the onlyBuiltDependencies list contain?

**Decision**: Empty list `[]` — no packages require native compilation

**Rationale**:
- The scaffold has no application code or dependencies
- Native dependencies (like `better-sqlite3`, `sharp`) are added later
- Empty list is the safest default for a scaffold

**Alternatives Considered**:
- Include common native packages — Rejected because adds unused configuration
- Omit the setting — Rejected because FR-009 requires it

### 4. What should the .npmrc configuration include?

**Decision**: Only `use-node-version=24.15.0` — minimal configuration

**Rationale**:
- The ticket specifies `.npmrc with use-node-version=24` (updated to 24.15.0 for pnpm compatibility)
- No additional security settings needed for scaffold
- Minimal configuration reduces complexity

**Alternatives Considered**:
- Add `ignore-scripts=true` — Rejected because not needed for scaffold
- Add `strict-peer-dependencies=true` — Rejected because adds friction for developers

### 5. How should error handling work for pnpm install?

**Decision**: Fail fast with clear error message

**Rationale**:
- Standard pnpm behavior — exits with clear error on failure
- No custom error handling needed for scaffold
- Developer can see exactly what went wrong

**Alternatives Considered**:
- Silent failure — Rejected because poor developer experience
- Automatic retry — Rejected because adds complexity without benefit

## Research Summary

All research questions resolved. The scaffold is straightforward:
- Based on v0.2.0 structure
- Minimal configuration (3 files, 2 directories)
- Standard pnpm patterns
- No custom error handling needed

**No NEEDS CLARIFICATION items remain.**
