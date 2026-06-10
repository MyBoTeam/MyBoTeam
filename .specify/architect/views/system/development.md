# Development View: System

**Date**: 2026-06-09
**Source ADRs**: ADR-001
**Status**: Generated from accepted ADRs

## Purpose

The system development view describes the repository-level organization and the
workspace contracts that keep the local-first desktop product cohesive.

## Code Organization

```text
apps/web       React renderer package
apps/desktop   Electron shell and packaging package
apps/daemon    Long-lived background daemon package
packages/agent-core  Shared contracts, storage, providers, runtime primitives
packages/agent-core/mcp-tools  First-party MCP tool families
```

## Development Elements

| Element | Responsibility |
|---------|----------------|
| pnpm Workspace | Coordinates package installation, builds, and tests |
| TypeScript | Provides shared cross-workspace type contracts |
| Biome | Formats and checks source files |
| Vitest / Playwright | Validate unit, integration, and desktop E2E behavior |
| GitHub Actions | Runs CI, release, and split-package workflows |

## Development Constraints

Changes crossing workspace boundaries must update shared types and run relevant
workspace tests. Markdown documents are exempt from source-file line limits when
a cohesive document is clearer.
