<!--
  Sync Impact Report
  ==================
  Version change: 1.0.0 → 1.1.0
  Bump rationale: New principle added — Code Structure & Cleanliness (MINOR).
  Modified principles:
    - Added "VI. Code Structure & Cleanliness" with 3 rules
  Added sections: None (new principle under Core Principles).
  Removed sections: None.
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ — Already generic; Constitution Check section references constitution dynamically.
    - .specify/templates/spec-template.md ✅ — No principle-specific references; stable.
    - .specify/templates/tasks-template.md ✅ — No principle-specific references; stable.
  Deferred TODOs: None. All placeholders resolved.
-->

# MyBot Team Constitution

## Core Principles

### I. Spec-Driven Development

Every feature MUST start with a written specification before any code is
written. Specifications define user stories with clear priorities (P1, P2,
P3...), independent testability criteria, acceptance scenarios (Given/When/Then
format), and measurable success criteria. No implementation work begins without
an approved specification. User stories MUST be independently implementable,
testable, and deployable as standalone increments.

### II. Test-First Quality

Automated tests MUST be written before or alongside implementation. Tests MUST
fail before implementation begins (RED phase). Each user story MUST be
independently testable. Contract and integration tests are REQUIRED for any
inter-service or public API boundaries. Tests are organized as
`tests/contract/`, `tests/integration/`, `tests/unit/`. Critical paths and
security boundaries MUST have test coverage before shipping. Refuse to ship
when critical coverage is missing.

### III. Simplicity & Surgical Changes

Minimum code that solves the problem — nothing speculative, no features beyond
what was asked, no abstractions for single-use code, no "flexibility" that
wasn't requested. When editing existing code, touch only what your changes
require. Match existing style even if you would do it differently. Remove
imports/variables/functions your changes made unused, but do not remove
pre-existing dead code unless asked. Reject overcomplicated solutions; if 200
lines could be 50, rewrite it.

### IV. Human Oversight & Goal-Driven Execution

Every autonomous contribution MUST receive human review before merge. Define
explicit success criteria before starting any task. Multi-step tasks MUST state
a brief plan with verification criteria for each step. Agents operate within
guardrails; engineers are accountable for final outcomes. SYNC tasks require
human micro-review upon completion; ASYNC tasks may be delegated but require
macro-review. If uncertain, ask rather than guess — surface tradeoffs and state
assumptions explicitly.

### V. Observability, Security & Immutability

All features MUST include logging, metrics, and deterministic workflows for
traceability. Follow least privilege for credentials, validate all inputs,
prefer managed secrets — never ship hard-coded tokens. Prefer immutable state:
always create new objects, never mutate shared state. Services MUST be
stateless, externalizing state to databases or caches. Adopt zero trust:
verify and authenticate every request regardless of origin.

### VI. Code Structure & Cleanliness

Clean code principles MUST be maintained at all times. Name things
intentionally, keep functions small, avoid duplication, and follow the language
idioms of the project.

Files SHOULD stay under 200 lines. When a file exceeds this threshold, prefer
splitting it into multiple files grouped by functionality. This is a guideline,
not a hard rule — use judgment when the split would harm cohesion.

Each file MUST contain at most one top-level class, one top-level function, or
one UI component. If a file would naturally hold more than one, split each into
its own file. This keeps modules focused, testable, and easy to navigate.

## Development Workflow

The project follows a gated Agentic SDLC cycle:

1. **Specify** — Feature specification is created from natural language input.
   Feature branch is created before specification via git hooks.
2. **Clarify** — Up to 3 clarification questions resolve ambiguity before
   planning. Review gate: spec must be approved before planning.
3. **Plan** — Technical research, data models, contracts, and implementation
   plan are generated. A Constitution Check gate validates plan alignment with
   principles. Review gate: plan must be approved before task generation.
4. **Tasks** — Plan is decomposed into dependency-ordered tasks grouped by user
   story. Tasks are classified as [SYNC] (human review required) or [ASYNC]
   (agent-delegatable).
5. **Implement** — Tasks are executed phase-by-phase following dependency order.
   Micro-reviews after each SYNC task; macro-review after ASYNC batches.
6. **Verify** — Four-pillar assessment: Spec Compliance, Code Quality, Test
   Adequacy, Risk & Evidence. Each pillar scored 0–100; all MUST be ≥70 for
   overall PASS. Test gate enforces all tests passing.
7. **Trace** — Execution traces are generated for learning and future reference.

## Quality Gates & Compliance

| Gate | Trigger | Requirement |
|------|---------|-------------|
| Review-Spec | Before plan | Spec approved by human reviewer |
| Review-Plan | Before tasks | Plan approved by human reviewer |
| Micro-Review | After each SYNC task | Task verified against success criteria |
| Macro-Review | After ASYNC batch | Batch verified by human reviewer |
| Verification | Before merge | 4-pillar assessment all ≥70, tests pass |

Complexity Tracking is REQUIRED when any constitution principle is violated:
document the violation, why it is needed, and why the simpler alternative was
rejected. Quickstart validation and documentation review run before final merge.

## Governance

This Constitution supersedes all other practices and serves as the binding
decision-making framework for the project.

**Amendment Procedure**: Proposed amendments MUST include documented rationale,
stakeholder approval, and a migration plan. Amendments are recorded by updating
this file following the versioning policy below.

**Versioning Policy**:
- MAJOR: Backward-incompatible governance changes, principle removals, or
  redefinitions.
- MINOR: New principle/section added or materially expanded guidance.
- PATCH: Clarifications, wording, typo fixes, non-semantic refinements.

**Compliance Review**: Required at each `spec.plan` gate via the Constitution
Check section. Deviations MUST be recorded in the Complexity Tracking table
with justification.

**Supplementary Guidance**: The team constitution at
`team-ai-directives/context_modules/constitution.md` provides additional
principles (Documentation Matters, Immutability, Stateless Services, Memory as
the Harness Core) that supplement — but do not override — this document.

**Version**: 1.1.0 | **Ratified**: 2026-06-24 | **Last Amended**: 2026-06-24
