# Research: Agent Configuration System

**Date**: 2026-07-11
**Feature**: 012-agent-configuration
**Source**: Linear MAO-157

## Research Questions

### RQ-001: AgentConfig Schema Design

**Question**: What fields should the AgentConfig type include?

**Decision**: Adopt v0.2.0 `AgentConfigSchema` patterns with extensions for M5-1 requirements.

**Rationale**:
- v0.2.0 defines: id, name, role, model, provider, params, secrets, skills, mcps
- M5-1 adds: unique name enforcement, 20-agent capacity, audit logging
- ADR-002 defines: AgentStatus with 6-state lifecycle

**Alternatives Considered**:
- Extend with additional fields (description, instructions) — rejected, defer to ADR-002 materialization
- Simplify to minimal fields — rejected, v0.2.0 patterns are proven

**Sources**:
- `v0.2.0/packages/types/src/agent-config.ts` — Schema definition
- ADR-002 — AgentDefinition fields
- ADR-006 — Provider/model per-agent override

---

### RQ-002: Status State Machine

**Question**: What status transitions are valid for agents?

**Decision**: Adopt ADR-002's 6-state lifecycle: idle → materialized → starting → running → stopped → error

**Rationale**:
- ADR-002 defines the canonical state machine for agent lifecycle
- States align with Eve materialization and process management
- `error` can transition back to `idle` for recovery

**Alternatives Considered**:
- 4-state model (idle, busy, error, offline) — rejected, conflicts with ADR-002
- 5-state model (merged) — rejected, loses materialization granularity

**Sources**:
- ADR-002 — Eve Agent Harness state machine
- v0.2.0 `agent-registry.ts:164-183` — setStatus() with VALID_TRANSITIONS

---

### RQ-003: Capacity Limit

**Question**: What is the maximum number of agents per daemon instance?

**Decision**: 20 agents maximum

**Rationale**:
- Default set is 3 (orchestrator, secretary, accountant)
- 20 provides 6x headroom for user-defined agents
- SQLite handles 20 rows trivially
- Desktop app use case doesn't need hundreds of agents

**Alternatives Considered**:
- Unlimited — rejected, no guard against runaway growth
- 50 — rejected, excessive for desktop use case

---

### RQ-004: Audit Logging Format

**Question**: What information should audit logs contain for configuration mutations?

**Decision**: Structured audit entry: config ID, operation type (create/update/delete), timestamp

**Rationale**:
- Aligns with Constitution Principle V (Observability)
- Minimal but sufficient for tracing configuration changes
- No performance impact on CRUD operations

**Alternatives Considered**:
- Full diff logging — rejected, too verbose for config changes
- No logging — rejected, violates observability principle

---

### RQ-005: Access Control

**Question**: Should configuration operations require authentication?

**Decision**: No access control — local daemon with process-level trust via Unix socket

**Rationale**:
- Desktop app runs on user's machine
- Unix socket provides process-level isolation
- No network exposure, no remote access
- Adding auth would be over-engineering

**Alternatives Considered**:
- Unix socket ownership validation — rejected, unnecessary for single-user desktop
- API key/token — rejected, adds complexity without security benefit

---

### RQ-006: SQLite Schema Alignment

**Question**: Does the existing `agent_registry` table support all AgentConfig fields?

**Decision**: Assume schema exists with all required columns (per assumption in spec)

**Rationale**:
- M1-4 or M2-1 initializes the database
- ADR-004 defines the `agents` table
- v0.2.0 `agent-registry.ts` uses: id, name, description, capabilities, status, role, config_json, metadata, secrets, skills, mcp_servers, provider, resource_limits, last_seen_at, created_at, updated_at

**Alternatives Considered**:
- Create migration — rejected, assume schema exists per spec assumptions

**Sources**:
- ADR-004 — Storage Architecture
- v0.2.0 `agent-registry.ts:38-60` — INSERT statement with all columns
