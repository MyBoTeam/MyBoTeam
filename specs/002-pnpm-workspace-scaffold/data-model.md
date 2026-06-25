# Data Model: pnpm Workspace + Monorepo Scaffold

**Date**: 2026-06-25
**Feature**: 002-pnpm-workspace-scaffold

## Overview

This scaffold defines configuration files and directory structure for a pnpm monorepo. There are no runtime data entities — only configuration files that define the workspace structure.

## Configuration Files

### pnpm-workspace.yaml

**Purpose**: Defines workspace package locations and build configuration

**Fields**:
- `packages`: Array of glob patterns for workspace packages
  - `apps/*` — Application packages
  - `packages/*` — Shared library packages
  - `packages/mcp-servers/*` — MCP server packages
- `onlyBuiltDependencies`: Array of packages that require native compilation
  - Value: `[]` (empty — no native dependencies in scaffold)

**Validation Rules**:
- Patterns must be non-overlapping
- `onlyBuiltDependencies` must be an array

### package.json (root)

**Purpose**: Root package manifest with workspace scripts

**Fields**:
- `name`: Package name (e.g., `myboteam`)
- `private`: `true` (root package is not published)
- `scripts`: Object with workspace scripts
  - `build`: `pnpm -r run build` — Build all packages
  - `dev`: `pnpm -r run dev` — Start development in all packages
  - `check`: `pnpm -r run check` — Run checks in all packages
  - `test`: `pnpm -r run test` — Run tests in all packages

**Validation Rules**:
- `private` must be `true`
- All four scripts must be present

### .npmrc

**Purpose**: pnpm configuration file

**Fields**:
- `use-node-version`: Node.js version to use
  - Value: `24.15.0`

**Validation Rules**:
- Must contain `use-node-version=24.15.0`

## Directory Structure

### apps/

**Purpose**: Directory for application packages

**Contents**: Empty (scaffold only)

**Validation**: Directory must exist at repository root

### packages/

**Purpose**: Directory for shared library packages

**Contents**: Empty (scaffold only)

**Validation**: Directory must exist at repository root

### packages/mcp-servers/

**Purpose**: Directory for MCP server packages

**Contents**: Empty (scaffold only)

**Validation**: Directory must exist under `packages/`

## Relationships

```text
pnpm-workspace.yaml
├── defines patterns for → apps/*, packages/*, packages/mcp-servers/*
├── configures → onlyBuiltDependencies: []

package.json
├── references → pnpm-workspace.yaml (implicit)
├── defines → scripts: build, dev, check, test

.npmrc
└── configures → use-node-version: 24.15.0

apps/ ← workspace pattern apps/*
packages/ ← workspace pattern packages/*
packages/mcp-servers/ ← workspace pattern packages/mcp-servers/*
```
