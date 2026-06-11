# Development View: Agent Core

**Date**: 2026-06-09
**Source ADRs**: ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006
**Status**: Generated from accepted ADRs

## Purpose

Agent Core development centers on shared contracts, reusable factories, storage,
provider support, daemon transports, and OpenCode configuration generation.

## Code Organization

```text
packages/agent-core/src/common      Shared public/common types
packages/agent-core/src/daemon      JSON-RPC clients, servers, transports, locks
packages/agent-core/src/storage     sql.js database, repositories, migrations
packages/agent-core/src/providers   Provider validation and model discovery
packages/agent-core/src/opencode    OpenCode config, auth, CLI, MCP generation
packages/agent-core/src/factories   Factory APIs consumed by daemon/desktop
```

## Development Elements

| Element | Responsibility |
|---------|----------------|
| ESM Package | Requires `.js` extensions and no `require()` in app logic |
| Public Exports | Define contracts for `common`, root, and `desktop-main` |
| Migration Tests | Verify bidirectional storage migrations |
| Provider Tests | Validate model/provider configuration behavior |
| Split Workflow | Publishes or refreshes agent-core subtree for downstream use |

## Development Constraints

Agent Core changes have broad blast radius. Public API changes must update
downstream web, desktop, and daemon consumers in the same change set and run
relevant workspace tests.
