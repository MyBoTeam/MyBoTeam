# Feature Specification: pnpm Workspace + Monorepo Scaffold

**Feature Branch**: `002-pnpm-workspace-scaffold`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "M1-1: pnpm workspace + monorepo scaffold for MyBoteam V0.5.0"

## Mission Brief

**Goal**: Set up pnpm workspace and monorepo scaffold for MyBoteam V0.5.0 as the foundation for M1 milestone

**Success Criteria**:
- pnpm-workspace.yaml defines apps/*, packages/*, packages/mcp-servers/*
- Root package.json with build/dev/check/test scripts
- .npmrc with use-node-version=24.15.0
- apps/ and packages/ directories exist

**Constraints**:
- Milestone M1 — Foundation
- Effort: S (Small)
- Source: v0.2.0 (pnpm-workspace.yaml, root package.json)
- No code reuse — structural only

## Out of Scope

- Application code (no packages or apps beyond directory structure)
- CI/CD configuration (GitHub Actions, GitLab CI, etc.)
- Docker or containerization setup
- Testing frameworks (Jest, Vitest, etc.)
- Linting and formatting configuration (ESLint, Prettier, Biome)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize Monorepo Structure (Priority: P1)

As a developer setting up the MyBoteam V0.5.0 project, I need a properly configured pnpm workspace with defined package locations so that the monorepo can support multiple applications and shared packages.

**Why this priority**: This is the foundation for all subsequent development. Without the workspace structure, no other packages can be created or managed.

**Independent Test**: Can be fully tested by running `pnpm install` in the root directory and verifying the workspace configuration is recognized.

**Acceptance Scenarios**:

1. **Given** the repository root, **When** a developer runs `pnpm install`, **Then** pnpm recognizes the workspace configuration without errors
2. **Given** the workspace configuration exists, **When** listing workspace packages, **Then** the `apps/*`, `packages/*`, and `packages/mcp-servers/*` patterns are correctly defined
3. **Given** the root package.json exists, **When** inspecting scripts, **Then** `build`, `dev`, `check`, and `test` scripts are present

---

### User Story 2 - Configure Node Version (Priority: P2)

As a developer, I need the project to enforce a consistent Node.js version across all contributors so that development environments are standardized.

**Why this priority**: Consistent Node.js version prevents "works on my machine" issues and ensures compatibility across the team.

**Independent Test**: Can be tested by running `node --version` after setup and verifying it matches the configured version.

**Acceptance Scenarios**:

1. **Given** the .npmrc file exists, **When** a developer installs dependencies, **Then** pnpm uses Node.js version 24 as specified
2. **Given** the .npmrc configuration, **When** inspecting the file, **Then** `use-node-version=24.15.0` is present

---

### User Story 3 - Verify Directory Structure (Priority: P3)

As a developer, I need the `apps/` and `packages/` directories to exist so that I can start adding applications and shared packages.

**Why this priority**: The directories must exist before any packages can be created within them.

**Independent Test**: Can be tested by listing the root directory and verifying both `apps/` and `packages/` directories exist.

**Acceptance Scenarios**:

1. **Given** the scaffold is complete, **When** listing the root directory, **Then** `apps/` directory exists
2. **Given** the scaffold is complete, **When** listing the root directory, **Then** `packages/` directory exists

---

### Edge Cases

- What happens if a developer uses a Node.js version other than 24? The .npmrc configuration should guide pnpm to use the correct version.
- What happens if the workspace patterns overlap? The configuration should define non-overlapping package locations.
- **Error Handling**: If `pnpm install` fails, the system MUST fail fast with a clear error message indicating the issue (e.g., missing workspace pattern, invalid YAML, Node.js version mismatch).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST have a `pnpm-workspace.yaml` file defining workspace package locations
- **FR-002**: System MUST define `apps/*` as a workspace package pattern
- **FR-003**: System MUST define `packages/*` as a workspace package pattern
- **FR-004**: System MUST define `packages/mcp-servers/*` as a workspace package pattern
- **FR-005**: System MUST have a root `package.json` with `build`, `dev`, `check`, and `test` scripts that use `pnpm -r` to delegate to individual workspace packages
- **FR-006**: System MUST have a `.npmrc` file with `use-node-version=24.15.0`
- **FR-007**: System MUST have an `apps/` directory at the repository root
- **FR-008**: System MUST have a `packages/` directory at the repository root
- **FR-009**: System MUST configure `onlyBuiltDependencies` as an empty list `[]` in pnpm-workspace.yaml (no packages require native compilation)

### Key Entities

- **pnpm-workspace.yaml**: Configuration file defining workspace package locations and build dependencies
- **package.json**: Root package manifest with workspace scripts and metadata
- **.npmrc**: pnpm configuration file specifying Node.js version
- **apps/**: Directory for application packages
- **packages/**: Directory for shared library packages and MCP servers

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can run `pnpm install` in the root directory without errors
- **SC-002**: `pnpm install` completes in under 30 seconds on a reference machine (4-core CPU, 16GB RAM, SSD, Node.js 24)
- **SC-003**: All workspace package patterns are correctly recognized by pnpm
- **SC-004**: Node.js version 24.15.0 is enforced via .npmrc configuration
- **SC-005**: Both `apps/` and `packages/` directories exist and are accessible

## Assumptions

- The repository is already initialized with Git
- pnpm is available as the package manager
- Node.js version 24 is available on development machines
- The workspace structure is based on the v0.2.0 project configuration
- No code reuse from v0.2.0 — structural configuration only
- The `onlyBuiltDependencies` configuration follows pnpm best practices

## Clarifications

### Session 2026-06-25

- Q: What should be explicitly out of scope for this scaffold? → A: No application code, no CI/CD config, no Docker, no testing frameworks, no linting config
- Q: How should `pnpm install` failure scenarios be handled? → A: Fail fast with clear error message
- Q: What should the `onlyBuiltDependencies` list contain? → A: Empty list `[]` — no packages require native compilation
- Q: Should the scaffold include any security-related .npmrc settings? → A: No additional security settings — keep minimal for scaffold
- Q: What should the root `package.json` scripts actually execute? → A: `pnpm -r` commands that delegate to individual workspace packages
