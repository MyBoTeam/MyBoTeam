# Development View: Desktop

**Date**: 2026-06-09
**Source ADRs**: ADR-001, ADR-002, ADR-005, ADR-006
**Status**: Generated from accepted ADRs

## Purpose

The Desktop development view describes the Electron shell code and packaging
pipeline that turns web, daemon, agent-core, Node.js, OpenCode, and MCP assets
into a distributable product.

## Code Organization

```text
apps/desktop/src/main      Electron main process, daemon connector, OS services
apps/desktop/src/preload   Context-bridge handlers and renderer API exposure
apps/desktop/scripts       Packaging, bundling, smoke, and staging scripts
apps/desktop/e2e           Electron Playwright tests and fixtures
apps/desktop/resources     Runtime and packaging resources
```

## Development Elements

| Element | Responsibility |
|---------|----------------|
| Electron Main | Owns shell lifecycle and OS integration |
| Preload | Exposes narrow typed renderer capabilities |
| Packaging Scripts | Stage daemon, MCP tools, bundled Node.js, and web UI |
| E2E Tests | Validate packaged and native Electron behavior |
| Updater Code | Manages release metadata and update flows |

## Development Constraints

Desktop code may bridge OS capabilities but must delegate connector domain logic
and secrets to daemon services. Packaged builds must fail if required MCP or
runtime assets are missing.
