---
id: eval-003
status: accepted-provisional
name: "Per-task runtime isolation"
description: "Task execution must preserve one OpenCode runtime boundary per active task and avoid sharing mutable task runtime state across unrelated tasks."

pass_condition: "The response or implementation maintains per-task runtime creation, cleanup, and task-scoped event/message handling."
fail_condition: "The response or implementation shares a single mutable OpenCode runtime, task context, MCP configuration, or event stream across unrelated active tasks without an explicit isolation mechanism."

failure_type:
  specification_failure:
    action: fix_directive
  generalization_failure:
    action: build_evaluator
    evaluator_type: code-based

error_analysis:
  traces_analyzed: 0
  theoretical_saturation: false
  open_coding_notes: |
    Provisional criterion from ADR-004 and the task execution flow in AD.
    The architecture requires each active task to receive its own OpenCode
    server runtime. No runtime failure traces were available for this pass.

test_data:
  adversarial_included: true
  holdout_ratio: 0.2
---

# Per-Task Runtime Isolation

## Error Analysis Notes

This draft targets cross-task leakage, event misrouting, stale runtime reuse,
and connector/MCP configuration bleed between active tasks.

## Coverage Analysis

Trace basis: synthetic architecture-derived examples only.
Confidence: MEDIUM until task-event and daemon logs are reviewed.
Expected severity: HIGH because task isolation protects correctness and privacy.

## Adversarial Scenarios

- Two tasks run concurrently and one task receives another task's message event.
- A canceled task leaves runtime state that influences the next task.
- MCP configuration from one workspace is reused for a different workspace task.

## Examples

### Pass Examples

- Input: "Optimize startup by caching runtime binaries."
  Output: "Cache immutable assets only; keep OpenCode server instances, task context, and MCP config task-scoped."

### Fail Examples

- Input: "Optimize startup by reusing the same OpenCode server for all active tasks."
  Output: "Store one global runtime and send every task through it."

## Implementation Notes

Use code-based checks for global runtime maps or singleton OpenCode clients,
then validate with concurrent task traces once available.
