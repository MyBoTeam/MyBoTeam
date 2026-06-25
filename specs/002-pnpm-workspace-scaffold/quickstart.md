# Quickstart: pnpm Workspace + Monorepo Scaffold

**Date**: 2026-06-25
**Feature**: 002-pnpm-workspace-scaffold

## Prerequisites

- Node.js 24 installed
- pnpm installed (`npm install -g pnpm`)
- Git repository initialized

## Setup

### 1. Create pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "packages/mcp-servers/*"

onlyBuiltDependencies: []
```

### 2. Create root package.json

```json
{
  "name": "myboteam",
  "private": true,
  "scripts": {
    "build": "pnpm -r run build",
    "dev": "pnpm -r run dev",
    "check": "pnpm -r run check",
    "test": "pnpm -r run test"
  }
}
```

### 3. Create .npmrc

```ini
use-node-version=24.15.0
```

### 4. Create directories

```bash
mkdir -p apps
mkdir -p packages/mcp-servers
```

## Verification

### Test workspace configuration

```bash
# Install dependencies (should succeed)
pnpm install

# List workspace packages (should show patterns)
pnpm ls --depth 0 -r
```

### Test scripts

```bash
# These should run without errors (no packages yet)
pnpm run build
pnpm run dev
pnpm run check
pnpm run test
```

### Test directory structure

```bash
# Verify directories exist
ls -la apps/
ls -la packages/
ls -la packages/mcp-servers/
```

## Expected Results

- `pnpm install` completes without errors
- Workspace patterns are recognized
- Scripts execute without errors (no-op since no packages)
- All directories exist

## Troubleshooting

### Error: "No projects found"

- Ensure `pnpm-workspace.yaml` exists at repository root
- Check that directory patterns are correct

### Error: "Node.js version mismatch"

- Ensure `.npmrc` contains `use-node-version=24.15.0`
- Ensure Node.js 24.15.0 is installed

### Error: "Permission denied"

- Ensure directories are writable
- Check file permissions
