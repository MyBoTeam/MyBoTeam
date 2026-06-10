# Development View: Daemon

**Date**: 2026-06-09
**Source ADRs**: ADR-001, ADR-002, ADR-003, ADR-004, ADR-005
**Status**: Generated from accepted ADRs

## Purpose

The Daemon development view describes the package that owns long-lived runtime
services, local RPC routes, task orchestration, storage access, and connector
domain logic.

## Code Organization

```text
apps/daemon/src/index.ts             Process entrypoint and shutdown
apps/daemon/src/app-setup.ts         Service wiring and route registration
apps/daemon/src/daemon-routes-*.ts   Typed daemon method registration
apps/daemon/src/task-service*.ts     Task lifecycle and task event handling
apps/daemon/src/opencode             Per-task OpenCode server runtime handling
apps/daemon/src/*-service.ts         Storage, settings, connector, and helper services
```

## Development Elements

| Element | Responsibility |
|---------|----------------|
| Route Modules | Register typed daemon methods and notifications |
| Services | Own task, storage, settings, connectors, and secrets behavior |
| OpenCode Runtime Code | Spawns and tracks one runtime per active task |
| Unit Tests | Validate daemon service and runtime behavior |
| tsup Build | Produces packaged daemon dist assets |

## Development Constraints

Daemon changes must preserve local-only API exposure, payload validation, and
best-effort recovery semantics. Task execution changes must respect per-task
OpenCode runtime isolation.
