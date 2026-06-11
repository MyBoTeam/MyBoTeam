<!--
Sync Impact Report
Version change: 1.1.0 -> 1.2.0
Modified principles:
- III. Testable, Observable, Reproducible Workflows
- Development Workflow and Quality Gates
Added sections: none
Removed sections: none
Templates requiring updates:
- not required: .specify/templates/plan-template.md
- not required: .specify/templates/spec-template.md
- not required: .specify/templates/tasks-template.md
- not required: .specify/templates/commands/*.md (directory absent)
- not required: .specify/presets/agentic-sdlc/commands/adlc.spec.tasks.md
- reviewed: AGENTS.md
Follow-up TODOs: none
Amendment rationale:
- Added a non-negotiable approval gate for any git command using --no-verify.
-->

# MyBoTeam Constitution

## Core Principles

### I. Human Oversight and Accountability
AI-generated code, specifications, tasks, and automation changes MUST remain
reviewable by a human before merge or release. Agent work MUST preserve enough
context for reviewers to understand intent, touched files, verification results,
and unresolved risks. Production deployments, infrastructure changes, credential
handling, and security-sensitive behavior MUST require explicit human approval.

Rationale: MyBoTeam operates autonomous agents on a user's desktop. Human
accountability is required because agent mistakes can affect local files,
credentials, and user workflows.

### II. Local-First Security and Privacy
Features MUST preserve the local-first product model: credentials and sensitive
user data stay on the user's machine unless the user explicitly configures an
external provider or integration. Secrets MUST be encrypted at rest, never
hard-coded, never logged, and accessed with least privilege. Inputs crossing IPC,
daemon, provider, MCP, or file-system boundaries MUST be validated and treated as
untrusted.

Rationale: Trust in MyBoTeam depends on private desktop operation, explicit
provider choice, and strong containment around automation capabilities.

### III. Testable, Observable, Reproducible Workflows
Every behavior change MUST include automated tests before or alongside the
implementation, or document why automated coverage is not practical and how the
change was otherwise verified. Plans and tasks MUST define success criteria,
validation commands, and user-story-level independent tests. Runtime behavior
that affects task execution, credentials, storage, IPC, or provider calls MUST be
observable through appropriate logs, events, or state transitions without
exposing secrets. Git verification bypasses are exceptional: any git command
using `--no-verify` MUST receive explicit, special user approval for that exact
command before it is run.

Rationale: The app spans React, Electron, daemon, and agent-core boundaries.
Reliable changes require tests, traceable workflows, and reproducible
verification across those layers.

### IV. Simplicity and Surgical Change
Changes MUST be the minimum code and documentation needed to satisfy the stated
goal. Implementations MUST avoid speculative features, one-off abstractions,
unrequested configurability, and unrelated refactors. Contributors MUST match
existing project structure and style, remove only dead code created by their own
change, and keep each changed line traceable to the accepted requirement.

Rationale: The split architecture is already complex enough. Small, localized
changes reduce regression risk and keep reviews effective.

### V. Explicit Assumptions and Goal-Driven Delivery
Specifications, plans, and implementation notes MUST state material assumptions,
ambiguities, tradeoffs, and success criteria before execution. If a requirement
has multiple plausible interpretations, the ambiguity MUST be resolved through a
clarification, a documented assumption, or a clearly scoped default. Work MUST
loop through implementation and verification until the stated success criteria
are met or a blocker is recorded.

Rationale: Agentic workflows only compound safely when decisions and verification
evidence are explicit enough for future humans and agents to reuse.

## Product and Technical Constraints

MyBoTeam is a TypeScript monorepo with three primary application boundaries:
`apps/web` for the React UI, `apps/desktop` for the Electron shell, and
`packages/agent-core` for shared business logic, storage, MCP tooling, and daemon
contracts. Work MUST respect those boundaries and the IPC/preload API contract.

The `@myboteam/agent-core` package is ESM. Internal imports in agent-core MUST
use `.js` extensions and MUST NOT use `require()`. Web image assets MUST use ES
module imports so packaged desktop builds resolve assets correctly.

Storage migrations MUST preserve released migration history: released migration
files MUST NOT be modified. New migrations MUST be added with the next version,
include executable `up` and `down` paths, and verify both directions with
agent-core tests.

Runtime process spawning from Electron or daemon code MUST follow the documented
bundled Node.js path guidance. Provider credentials, OAuth tokens, API keys, and
MCP secrets MUST use the encrypted storage path and MUST NOT appear in logs,
fixtures, screenshots, or generated traces.

## Development Workflow and Quality Gates

Before implementation, plans MUST include a Constitution Check covering human
review, security/privacy, testing, observability, simplicity, assumptions, and
workspace boundary impact. Any violation MUST be documented with a simpler
alternative and cannot proceed unless explicitly accepted.

Task lists MUST group work by independently testable user story. Each story MUST
include validation steps and relevant tests. Test tasks are required for behavior
changes unless the task records a justified exception and an alternate
verification method.

After any code change, `pnpm check` MUST run unless the environment prevents it.
Additional workspace tests MUST run for touched areas:
`pnpm -F @myboteam/web test` for web changes,
`pnpm -F @myboteam/desktop test` for desktop changes, and
`pnpm -F @myboteam/agent-core test` for agent-core changes. Failed or skipped
verification MUST be reported with the reason and residual risk.

Agents and contributors MUST NOT run `git commit`, `git push`, or any other git
command with `--no-verify` unless the user has granted explicit, special approval
for that exact bypass. Prior approval to run ordinary git commands or general
approval to continue work is not sufficient.

Reviews MUST verify that changes preserve local-first privacy, do not leak
secrets, keep automation behavior auditable, and remain scoped to the approved
requirement. Documentation updates MUST capture new assumptions, public API
contracts, operational hand-off notes, and any changed verification commands.

## Governance

This constitution supersedes conflicting project practices and Spec Kit
templates. AGENTS.md remains the runtime guidance file for repository-specific
commands, architecture notes, and coding conventions, but it MUST align with
these principles.

Amendments require an explicit constitution update, a Sync Impact Report,
semantic versioning rationale, and review of dependent templates and runtime
guidance. Constitution changes MUST NOT be bundled silently into unrelated
feature work.

Versioning policy:
- MAJOR: Removes or redefines a principle in a way that invalidates prior
  compliant work.
- MINOR: Adds a principle or materially expands required governance, workflow,
  or quality gates.
- PATCH: Clarifies wording without changing compliance obligations.

Compliance review is required during `/spec-plan`, `/spec-tasks`, implementation
review, and pre-merge verification. If a principle cannot be satisfied, the plan
MUST record the violation, rejected simpler alternatives, mitigation, owner, and
approval requirement before work continues.

**Version**: 1.2.0 | **Ratified**: 2026-06-09 | **Last Amended**: 2026-06-10
