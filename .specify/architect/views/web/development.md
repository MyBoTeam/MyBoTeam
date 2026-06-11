# Development View: Web

**Date**: 2026-06-09
**Source ADRs**: ADR-002
**Status**: Generated from accepted ADRs

## Purpose

The Web development view captures the renderer package structure and its
dependency on shared contract types and preload API wrappers.

## Code Organization

```text
apps/web/src/client/config    Typed API wrappers and platform/i18n config
apps/web/src/client/stores    Zustand stores and task state actions
apps/web/src/client/pages     Route-level UI experiences
apps/web/src/client/components Reusable UI and domain components
apps/web/locales              Translation resources
apps/web/__tests__            Unit and integration renderer tests
```

## Development Elements

| Element | Responsibility |
|---------|----------------|
| Vite | Builds standalone renderer assets |
| React Router | Owns page routing |
| Zustand | Owns renderer state slices |
| Shared Types | Imported from agent-core for task and daemon contracts |
| Vitest / Testing Library | Validate renderer units and integration flows |

## Development Constraints

Renderer code must use ES module asset imports for packaged compatibility. API
changes must flow through shared types and preload wrappers instead of direct
privileged access.
