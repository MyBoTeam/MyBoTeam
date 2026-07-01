## Discovered Team Context

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-061 | context_modules/rules/architecture/immediate_close_shutdown.md | Rule | Use socket.destroy() instead of socket.end() for immediate cleanup on daemon shutdown | High |
| CDR-2026-060 | context_modules/rules/architecture/source_reference_analysis.md | Rule | Mandatory source code analysis from previous versions before implementing features | High |
| CDR-2026-008 | context_modules/rules/architecture/dependency_injection.md | Rule | Dependency injection pattern for loose coupling and testability | Medium |

_Searched 62 CDR entries, 3 matches found._

---

### CDR-2026-061: Immediate Close on Shutdown for Daemons

**Full content:**

```markdown
---
type: Rule
title: Immediate Close on Shutdown for Daemons
description: Use socket.destroy() instead of socket.end() for immediate cleanup on daemon shutdown
tags:
  - daemon
  - lifecycle
  - shutdown
  - nodejs
timestamp: 2026-06-28T00:00:00Z
id: rule-immediate-close-shutdown
cdr_ref: CDR-2026-061
created: 2026-06-28
modified: 2026-06-28
verified: 2026-06-28
age_days: 0
evidence:
  - commit: 8b1af32
    message: "feat(MAO-147): JSON-RPC 2.0 server over Unix domain socket"
  - file: packages/agent-core/src/daemon/rpc-server.ts
    lines: "145-160"
    description: "stop() method with immediate close pattern"
---

> ⚠️ **Memory Verification**
> This directive is 0 days old. Before applying:
> - [ ] Pattern still exists in current codebase
> - [ ] Rule is actively followed by team
> - [ ] No conflicting rules introduced
> 
> **Verification Date**: 2026-06-28
> **Verify Again After**: 2026-07-28 (30 days)

# Immediate Close on Shutdown for Daemons

## Summary

On daemon/server shutdown, immediately destroy all client sockets without waiting for pending writes. This prevents hanging during shutdown and ensures clean resource cleanup.

## Context

Daemon processes need to shut down promptly. Pending writes may never complete if clients are unresponsive. Waiting for graceful close can cause the daemon to hang indefinitely.

## Decision

Use `socket.destroy()` (not `socket.end()`) for immediate cleanup on shutdown:

```typescript
async stop(): Promise<void> {
  // Immediate close - destroy all sockets
  for (const client of this.clients.values()) {
    client.socket.destroy();
  }
  this.clients.clear();

  return new Promise<void>((resolve) => {
    if (!this.server) {
      resolve();
      return;
    }
    this.server.close(() => resolve());
    this.server = null;
  });
}
```

## Why Not Graceful Close

| Approach | Behavior | Risk |
|----------|----------|------|
| `socket.end()` | Waits for pending writes | May hang if client unresponsive |
| `socket.destroy()` | Immediately closes | Pending data lost (acceptable for shutdown) |

## When to Use

- Daemon/server shutdown handlers
- Process signal handlers (SIGTERM, SIGINT)
- Cleanup on uncaught exceptions

## When NOT to Use

- Client-initiated graceful disconnect (use `end()`)
- Data integrity critical scenarios
- Non-daemon processes with long-running connections

## Source

Contributed from: myboteam_v0.5.0
CDR: CDR-2026-061
Date: 2026-06-28

## Evidence

- `packages/agent-core/src/daemon/rpc-server.ts:145-160` — stop() method
- Commit `8b1af32`: Implementation following Accomplish reference behavior
- Matches Accomplish daemon shutdown pattern

## Verification Log

| Date | Verified By | Notes |
|------|-------------|-------|
| 2026-06-28 | myboteam_v0.5.0 | Initial publication via /levelup.implement |
```

---

### CDR-2026-060: Source Reference Analysis Before Planning

**Full content:**

```markdown
---
type: Rule
title: Source Reference Analysis Before Planning
description: Mandatory source code analysis from previous versions before implementing features
tags:
  - planning
  - source-reference
  - constitution
  - process
timestamp: 2026-06-28T00:00:00Z
id: rule-source-reference-analysis
cdr_ref: CDR-2026-060
created: 2026-06-28
modified: 2026-06-28
verified: 2026-06-28
age_days: 0
evidence:
  - commit: 8b1af32
    message: "feat(MAO-147): JSON-RPC 2.0 server over Unix domain socket"
  - file: specs/006-json-rpc-unix-socket/plan.md
    lines: "11-66"
    description: "Full source reference analysis section"
  - file: specs/006-json-rpc-unix-socket/tasks.md
    lines: "26-27"
    description: "Every task has source references"
---

> ⚠️ **Memory Verification**
> This directive is 0 days old. Before applying:
> - [ ] Pattern still exists in current codebase
> - [ ] Rule is actively followed by team
> - [ ] No conflicting rules introduced
> 
> **Verification Date**: 2026-06-28
> **Verify Again After**: 2026-07-28 (30 days)

# Source Reference Analysis Before Planning

## Summary

Supplementary example demonstrating how to apply Constitution Principle VII (Source Reference MANDATORY). Every feature plan MUST include a "Source Reference Analysis" section with specific files, line numbers, and patterns to adopt or avoid.

## Context

Before implementing any feature, reading and analyzing reference source code from previous versions ensures continuity, prevents reimplementation, and builds on proven patterns. This is a mandatory prerequisite for planning.

## Decision

Every `plan.md` MUST include a "Source Reference Analysis" section containing:

1. **Specific files analyzed** with line numbers
2. **Key patterns to adopt** from reference implementations
3. **Patterns NOT to adopt** with rationale for exclusion
4. **Exact file:line references** in task descriptions

## Implementation Example

From MAO-147 (JSON-RPC Unix Socket Server):

```markdown
## Source Reference Analysis (MANDATORY)

### v0.2.0 Reference Implementation

**Source Location**: `/packages/daemon/src/`

**Files Analyzed**:
- `rpc-server.ts` (310 lines) - Main RPC server
- `socket-transport.ts` (89 lines) - Client-side transport
- `socket-path.ts` (29 lines) - PathResolver class

**Key Patterns to Adopt**:
1. `DaemonRpcServer` class with `registerMethod()`, `notify()`
2. `DaemonTransport` interface with `send()`, `onMessage()`
3. NDJSON framing: Messages delimited by `\n`

**Patterns NOT to Adopt** (not needed for v0.5.0):
- Authentication - Local trust model
- Rate limiting - Not required
```

## Checklist

When creating a plan.md:

- [ ] Identified relevant reference implementations
- [ ] Listed specific files with line numbers
- [ ] Documented patterns to adopt
- [ ] Documented patterns NOT to adopt with rationale
- [ ] Added source references to task descriptions

## Source

Contributed from: myboteam_v0.5.0
CDR: CDR-2026-060
Date: 2026-06-28

## Evidence

- `specs/006-json-rpc-unix-socket/plan.md:11-66` — Full source reference analysis
- `specs/006-json-rpc-unix-socket/tasks.md:26-27` — Every task has source references
- Commit `8b1af32`: Implementation following source reference patterns

## Verification Log

| Date | Verified By | Notes |
|------|-------------|-------|
| 2026-06-28 | myboteam_v0.5.0 | Initial publication via /levelup.implement |
```

---

### CDR-2026-008: Dependency Injection

**Full content:**

```markdown
---
id: rule-rules-architecture-dependency_injection
cdr_ref: null
created: 2026-05-23
modified: 2026-05-23
verified: 2026-05-23
age_days: 0
evidence: []
---

# Dependency Injection

All services and components should use dependency injection (DI) rather than creating dependencies directly. This promotes loose coupling, testability, and maintainability. Use constructor injection as the primary method, with field injection only when necessary for framework integration. Dependencies should be defined as interfaces when possible to enable easy mocking and swapping of implementations.
```

---

### Changes from Previous Discovery

- **New**: CDR-2026-061 — Immediate Close on Shutdown for Daemons (Rule)
- **New**: CDR-2026-060 — Source Reference Analysis Before Planning (Rule)
- **New**: CDR-2026-008 — Dependency Injection (Rule)