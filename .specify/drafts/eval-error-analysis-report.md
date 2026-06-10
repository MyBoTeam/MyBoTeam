# EDD Error Analysis Report

## Scope

System: promptfoo
Source: continuation from `evals.init`
Use case detected: local-first desktop AI assistant with daemon-owned task
execution, encrypted secrets, per-task OpenCode runtimes, and bundled MCP tools.

## Trace Collection Status

No production traces, support reports, or failing eval traces were provided in
this session. The current drafts are architecture-derived seed criteria, not
evidence-saturated goldset records.

## Open Coding Summary

Synthetic review of AD.md, SECURITY.md, README.md, and agent-core package
documentation produced four provisional failure patterns:

| Pattern | Draft | Basis | Severity | Confidence |
|---------|-------|-------|----------|------------|
| Local privacy boundary violation | eval-001 | Architecture constraints | HIGH | MEDIUM |
| Renderer privilege boundary collapse | eval-002 | Renderer-to-daemon flow | HIGH | MEDIUM |
| Cross-task runtime leakage | eval-003 | Per-task runtime ADR | HIGH | MEDIUM |
| Sensitive operation without review | eval-004 | Security and permission docs | HIGH | MEDIUM |

## Saturation

Theoretical saturation: false
Traces analyzed: 0
Reason: criteria were seeded from architecture, not observed trace clusters.

## Coverage Gaps

- Need at least 20 full task/conversation traces.
- Need concurrent task traces to validate runtime isolation criteria.
- Need connector and MCP tool traces involving external side effects.
- Need negative examples from real permission, auth, and file-operation failures.

## Handoff Notes

Before `/evals.clarify`, review these draft criteria with real traces. Accept
only criteria whose pass/fail examples match observed failures or deliberately
chosen adversarial scenarios.
