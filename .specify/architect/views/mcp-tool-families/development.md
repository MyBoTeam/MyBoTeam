# Development View: MCP Tool Families

**Date**: 2026-06-09
**Source ADRs**: ADR-006
**Status**: Generated from accepted ADRs

## Purpose

MCP Tool Families are developed as nested packages grouped by connector family.
They are packaged into desktop resources and referenced by generated OpenCode
configuration.

## Code Organization

```text
packages/agent-core/mcp-tools/dev-browser*     Browser automation families
packages/agent-core/mcp-tools/gmail-mcp        Gmail tool family
packages/agent-core/mcp-tools/calendar-mcp     Calendar tool family
packages/agent-core/mcp-tools/gws-mcp          Google Workspace CLI family
packages/agent-core/mcp-tools/whatsapp         WhatsApp tool family
packages/agent-core/mcp-tools/*task*           Task helper tool families
```

## Development Elements

| Element | Responsibility |
|---------|----------------|
| Tool Packages | Own connector-specific MCP server behavior |
| Build Scripts | Produce `dist` entrypoints for dev and packaged modes |
| OpenCode MCP Generator | Resolves commands and injects tool entries |
| Tool Tests | Validate family-specific behavior where available |
| Package Filters | Exclude test/tmp/browser-data artifacts from packaged output |

## Development Constraints

Connector-specific logic should stay in the relevant tool family. Required tools
must have packaged dist outputs; missing assets fail validation and task startup.
