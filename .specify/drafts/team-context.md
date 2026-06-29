## Discovered Team Context

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-061 | context_modules/rules/architecture/immediate_close_shutdown.md | Rule | Immediate close on shutdown for daemons | High |
| CDR-2026-060 | context_modules/rules/architecture/source_reference_analysis.md | Rule | Mandatory source code analysis before planning | High |
| CDR-2026-062 | context_modules/rules/devops/lint_compliance_no_config_changes.md | Rule | Fix code to match existing lint rules | Medium |

_Searched 62 CDR entries, 3 matches found._

### Changes from Previous Discovery

- **New**: CDR-2026-061 — Immediate close on shutdown for daemons (Rule)
- **New**: CDR-2026-060 — Source reference analysis before planning (Rule)
- **New**: CDR-2026-062 — Lint compliance without config changes (Rule)
- **Dropped**: CDR-2026-050 — API communication patterns (Rule)
- **Dropped**: CDR-2026-051 — Authentication patterns (Rule)
- **Dropped**: CDR-2026-053 — Observability and error management (Rule)
- **Dropped**: CDR-2026-055 — Full-stack testing strategies (Rule)
- **Dropped**: CDR-2026-038 — Senior Fullstack Developer persona (Persona)

---

## Full Context Module Content

### CDR-2026-061: Immediate Close on Shutdown for Daemons

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

### CDR-2026-060: Source Reference Analysis Before Planning

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

### CDR-2026-062: Lint Compliance Without Config Changes

---
type: Rule
title: Lint Compliance Without Config Changes
description: Fix code to match existing lint rules rather than weakening the rules
tags:
  - lint
  - compliance
  - code-quality
  - configuration
timestamp: 2026-06-28T00:00:00Z
id: rule-lint-compliance
cdr_ref: CDR-2026-062
created: 2026-06-28
modified: 2026-06-28
verified: 2026-06-28
age_days: 0
evidence:
  - commit: 8b1af32
    message: "feat(MAO-147): JSON-RPC 2.0 server over Unix domain socket"
  - file: packages/agent-core/src/storage/crud/*.ts
    lines: "multiple"
    description: "8 CRUD files fixed"
  - file: packages/agent-core/src/vault/vault-rwlock.ts
    lines: "shift()! fixed"
    description: "shift()! fixed"
  - file: packages/agent-core/src/vault/vault-key-provider.ts
    lines: "unused param fixed"
    description: "unused param fixed"
  - file: packages/agent-core/tests/performance/concurrent-connections.test.ts
    lines: "console.log fixed"
    description: "console.log fixed"
---

# Lint Compliance Without Config Changes

## Summary

Always fix code to match existing lint rules. Never modify `biome.json`, `.eslintrc`, `tsconfig.json`, or similar tooling configuration files. Use type assertions instead of `!` operator, prefix unused parameters with `_`, and use `process.stdout.write` in performance-sensitive code.

## Context

Linter configurations define project-wide quality standards. Modifying configs to suppress errors weakens the codebase. The agent's job is to make code conform to existing standards, not to lower the bar.

## Decision

Always fix code to match existing lint rules. Never modify `biome.json`, `.eslintrc`, `tsconfig.json`, or similar tooling configuration files. Use type assertions instead of `!` operator, prefix unused parameters with `_`, and use `process.stdout.write` in performance-sensitive code.

## Source

Contributed from: myboteam_v0.5.0
CDR: CDR-2026-062
Date: 2026-06-28

## Evidence

- Commit `8b1af32`: Multiple lint fixes applied
- `packages/agent-core/src/storage/crud/*.ts` — 8 CRUD files fixed
- `packages/agent-core/src/vault/vault-rwlock.ts` — shift()! fixed
- `packages/agent-core/src/vault/vault-key-provider.ts` — unused param fixed
- `packages/agent-core/tests/performance/concurrent-connections.test.ts` — console.log fixed

## Verification Log

| Date | Verified By | Notes |
|------|-------------|-------|
| 2026-06-28 | myboteam_v0.5.0 | Initial publication via /levelup.implement |

---

*This file is maintained by the LevelUp workflow. CDRs are added through PRs from project contributions.*