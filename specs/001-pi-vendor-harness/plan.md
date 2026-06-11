# Implementation Plan: Pi Vendor Harness

**Branch**: `001-pi-vendor-harness` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-pi-vendor-harness/spec.md`

## Summary

Plan MAO-66 as a full-parity Pi task harness migration while preserving the existing OpenCode harness until parity is proven. The implementation approach is to copy upstream Pi source into a dedicated `packages/pi-vendor` workspace package, build MyBoTeam Pi wrappers/adapters in a separate `packages/pi-agent-core` workspace package, then route all current task sources through Pi by default via the existing daemon task lifecycle. The current harness stays runnable and is marked deprecated only after automated checks, live credentialed parity evidence, and maintainer approval are recorded in `specs/001-pi-vendor-harness/validation-evidence.md`.

## Technical Context

**Language/Version**: TypeScript, ESM workspace packages, Node.js `>=24.0.0`, pnpm `>=10.33.0`.

**Primary Dependencies**:
- Current MyBoTeam workspaces: `apps/web`, `apps/desktop`, `apps/daemon`, `packages/agent-core`.
- New wrapper package: `packages/pi-agent-core`, depending on `@myboteam/pi-vendor` and shared task contracts from `@myboteam/agent-core`.
- New vendored source package: `packages/pi-vendor`, containing copied upstream Pi source from `earendil-works/pi` tag `v0.79.1`, commit `28df940f0d07b65284849a483be7b06e2ca046ee`.
- Upstream Pi package dependencies verified from current package metadata: `@earendil-works/pi-ai`, `ignore`, `typebox`, `yaml`, plus provider dependencies required by copied `pi-ai`.

**Storage**: Existing local encrypted storage for provider secrets, task records, task messages, todos, connector tokens, settings, and workspaces. MAO-66 requires clean-start acceptance with old task history, messages, and current-harness session state deleted; no backwards resume migration is required.

**Testing**: `pnpm check`; `pnpm -F @myboteam/agent-core test`; `pnpm -F @myboteam/daemon test`; `pnpm -F @myboteam/desktop test`; `pnpm -F @myboteam/web test` when UI/event display behavior changes; clean-start dev validation with `pnpm dev:clean`; packaged desktop build validation; live credentialed provider/tool/MCP/connector regression recorded in `validation-evidence.md`.

**Target Platform**: MyBoTeam desktop app, daemon runtime, packaged Electron build, and local dev runtime.

**Project Type**: TypeScript monorepo desktop app with daemon-owned task execution and shared package contracts.

**Performance Goals**: No material regression versus current harness on comparable validation tasks. Measurement is reviewer-judged and recorded in `validation-evidence.md`, with no fixed numeric threshold.

**Constraints**:
- Planning only in this phase; implementation starts later through Spec Kit task execution.
- Do not remove the existing harness in MAO-66.
- Do not add a normal user-facing harness selector or user-facing deprecation warning.
- Pi routes all current task sources once implemented: UI-created, daemon/background, scheduled, WhatsApp/connector-triggered.
- Provider secrets, connector tokens, task data, logs, traces, fixtures, and screenshots must remain secret-safe.
- Copied upstream code must stay isolated in `packages/pi-vendor` for repeatable upstream refresh.
- MyBoTeam wrappers/adapters must stay isolated in `packages/pi-agent-core`.
- Internal ESM imports in `@myboteam/agent-core` and new ESM packages must use explicit `.js` extensions.
- All task/provider/tool/MCP/connector inputs crossing the Pi boundary must be validated.

**Scale/Scope**:
- Two new workspace packages.
- Shared task manager adapter factory change in `packages/agent-core`.
- Daemon task routing updates across all current task sources.
- Pi adapter coverage for current task lifecycle, events, tools, MCP capabilities, connectors, provider/model mapping, permissions, cancellation/interruption, browser frames, summaries/titles, diagnostics, and validation evidence.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Plan Response |
|-----------|--------|---------------|
| I. Human Oversight and Accountability | PASS | Full parity, deprecation, exclusions, validation gaps, and release readiness require maintainer approval recorded in `validation-evidence.md`. No commits are part of this planning session. |
| II. Local-First Security and Privacy | PASS | Provider secrets remain in existing encrypted storage and are retrieved at runtime. Pi logs and evidence must be redacted. All Pi-boundary inputs are validated. |
| III. Testable, Observable, Reproducible Workflows | PASS | Plan requires automated checks, focused unit/integration tests, clean-start dev validation, packaged build validation, live credentialed regression, and existing app/daemon diagnostic logs with sanitized evidence references. |
| IV. Simplicity and Surgical Change | PASS | Implementation is package-bounded: `pi-vendor` for copied upstream, `pi-agent-core` for wrappers/adapters, `agent-core` for shared task contracts and the deprecated OpenCode path. No current-harness removal. |
| V. Explicit Assumptions and Goal-Driven Delivery | PASS | Clarified decisions are encoded in the spec. Remaining risk is captured as research decisions and validation evidence requirements. |

**Initial Gate Decision**: PASS. No constitution violations require an exception.

## Project Structure

### Documentation (this feature)

```text
specs/001-pi-vendor-harness/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── validation-evidence.md       # Created during implementation validation
├── contracts/
│   ├── task-harness.md
│   └── pi-package-boundaries.md
├── checklists/
│   └── requirements.md
└── tasks.md                     # Created by /spec-tasks, not by /spec-plan
```

### Source Code (repository root)

```text
packages/
├── agent-core/
│   └── src/
│       ├── common/types/task.ts
│       ├── factories/task-manager.ts
│       ├── internal/classes/
│       │   ├── adapter-types.ts
│       │   ├── open-code-adapter.ts
│       │   ├── task-manager-execution.ts
│       │   └── task-manager-utils.ts
│       └── tests/
├── pi-vendor/
│   ├── package.json
│   ├── tsconfig.json
│   ├── VENDORS.md
│   └── src/
│       ├── pi-agent-core/
│       └── pi-ai/
└── pi-agent-core/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── adapter/
        ├── events/
        ├── models/
        ├── tools/
        ├── validation/
        └── index.ts

apps/
├── daemon/
│   ├── src/task-service.ts
│   ├── src/task-service-execution.ts
│   ├── src/task-config-builder.ts
│   ├── src/scheduler-service.ts
│   └── src/whatsapp/
├── desktop/
│   └── src/main/
└── web/
    └── src/client/
```

**Structure Decision**: Use new `packages/pi-vendor` and `packages/pi-agent-core` packages instead of placing Pi code inside `packages/agent-core`. `packages/agent-core` remains the shared task contract owner and current-harness home. `apps/daemon` owns runtime selection because all task sources converge there.

## Phase 0 Research Decisions

See [research.md](./research.md). All planning unknowns are resolved.

## Phase 1 Design Decisions

- Data model is documented in [data-model.md](./data-model.md).
- Interface contracts are documented in [contracts/task-harness.md](./contracts/task-harness.md) and [contracts/pi-package-boundaries.md](./contracts/pi-package-boundaries.md).
- Validation and operator workflow is documented in [quickstart.md](./quickstart.md).
- `AGENTS.md` Spec Kit context points at this plan.

## Phase 2 Task Generation Guidance

`/spec-tasks` must group implementation by independently testable story and include automated tests for every documented edge case. The final task in `tasks.md` MUST be:

> Rerun `architecture.init` after MAO-66 implementation and validation to refresh the Architecture Description (AD) and capture the final Pi harness package/runtime architecture.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid. High-risk architecture, security, task lifecycle, and live parity work is [SYNC]. Mechanical package scaffolding, isolated mapping utilities, and straightforward documentation/tests can be [ASYNC] once contracts are approved.

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|------------------------|--------------------------|-----------|
| Package Boundaries | 2 | 4 | Package naming, vendoring policy, and dependency exposure require review; package scaffolds and export barrels are mechanical. |
| Runtime/Business Logic | 7 | 3 | Task manager adapter factory, Pi execution, cancellation, interruption, and event mapping affect core behavior. Pure mapper tests can be delegated. |
| Data/Storage Operations | 3 | 2 | Clean-start deletion and session removal affect user data; validation evidence schema and docs are straightforward. |
| Integrations | 8 | 2 | Provider/model mapping, tools, MCP, connectors, permissions, browser frames, and credential access are external/security-sensitive. |
| UI/IPC | 2 | 2 | User-facing behavior must not expose harness selection/warnings; typed IPC pass-through is mechanical if needed. |
| Validation/QA | 6 | 8 | Live credentialed regression and packaged validation require human-maintainer review; automated unit/integration/evidence template tasks can be delegated. |
| Architecture Follow-up | 1 | 0 | Rerunning `architecture.init` and reviewing AD impact is architecture-governance work. |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- Decide and review the shared task adapter contract in `packages/agent-core`.
- Vendor upstream Pi source and approve copied scope/provenance.
- Implement Pi runtime execution, cancellation/interruption, and failure semantics.
- Map provider credentials/models to Pi without leaking secrets.
- Expose full MyBoTeam tool/MCP/connector capability surface to Pi.
- Preserve permission policy and safe-tool behavior.
- Validate live credentialed parity and approve exclusions/gaps.
- Mark current harness deprecated without removing it or surfacing normal user warnings.
- Rerun `architecture.init` and review AD changes.

**Agent-Delegated [ASYNC] Classifications:**

- Scaffold `packages/pi-vendor` and `packages/pi-agent-core` after package boundaries are approved.
- Add package exports and TypeScript config following existing workspace patterns.
- Write deterministic event mapper tests from fixed Pi event fixtures.
- Write validation evidence template with required fields.
- Add package-boundary documentation and upstream refresh checklist.
- Add regression tests for no normal user-facing harness selector/warning.

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Define shared task adapter interface/factory | SYNC | Architectural boundary | High | Changes core task manager routing and current-harness deprecation strategy. |
| Scaffold `packages/pi-vendor` | ASYNC | Boilerplate after decision | Medium | Mechanical workspace package setup, but must follow vendoring docs. |
| Copy upstream Pi source into `pi-vendor` | SYNC | Supply chain and licensing | High | Requires pinned release/commit, copied scope review, and release-review license deferral. |
| Scaffold `packages/pi-agent-core` | ASYNC | Boilerplate after decision | Low | Package shell and exports follow workspace patterns. |
| Implement Pi adapter execution loop | SYNC | Core task lifecycle | High | Affects task completion, failure, cancellation, interruption, and all task sources. |
| Implement Pi event-to-task mapping | SYNC | User-visible event stream | High | Must preserve assistant, reasoning, tool, browser, summary/title behavior. |
| Add event mapping fixture tests | ASYNC | Deterministic pure tests | Medium | Fixtures should be derived from approved contracts. |
| Implement provider/model resolver | SYNC | Credential boundary | High | Must use encrypted storage and support configured provider/model parity. |
| Implement Pi tool/MCP/connector bridge | SYNC | External integrations | High | Tool permissions, connector tokens, browser frames, and MCP behavior are high-risk. |
| Add permission policy tests | SYNC | Security-critical | High | High-risk actions and safe-tool markings must match current policy. |
| Add clean-start session/history deletion | SYNC | Data lifecycle | High | Deletes old task/session data by accepted requirement. |
| Add current-harness deprecation annotations/docs | ASYNC | Documentation and annotations | Medium | Simple if done after parity gate is recorded. |
| Create `validation-evidence.md` template | ASYNC | Documentation artifact | Low | Schema fields are fully clarified. |
| Run clean-start dev validation | SYNC | End-to-end validation | High | Requires reviewer judgment and possible credentials. |
| Run packaged desktop validation | SYNC | Release validation | High | Ensures packaging/runtime works beyond dev. |
| Run live credentialed parity regression | SYNC | External services and secrets | High | Must avoid secret leakage and record pass/exclusion/gap status. |
| Rerun `architecture.init` to update AD | SYNC | Architecture governance | Medium | Must run after final implementation so AD reflects reality. |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Two new packages (`pi-vendor`, `pi-agent-core`) | User clarified copied upstream source and MyBoTeam wrappers/adapters must be separated for future upstream refresh. | Putting everything into `agent-core` would mix ownership, make upstream refresh harder, and contradict accepted spec. |
| Adapter abstraction around existing task manager | TaskManager currently constructs `OpenCodeAdapter` directly; Pi must route all task sources while current harness remains runnable/deprecated. | A one-off conditional inside daemon or UI would miss scheduler/connector sources and spread runtime-specific code. |
| Live credentialed parity regression | MAO-66 acceptance requires full current tool/MCP/connector/provider parity before deprecation. | Automated unit tests alone cannot prove external provider, MCP, connector, and credential behavior. |

## Post-Design Constitution Re-Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| Human oversight | PASS | Maintainer approval is required for parity, exclusions, gaps, deprecation, release-review license handling, and final evidence. |
| Local-first security/privacy | PASS | Runtime credential access, redacted logs, validation evidence secret-safety notes, and no secret persistence are explicit contracts. |
| Testable/observable/reproducible | PASS | Plan includes unit/integration/e2e/live regression, diagnostic logs, validation evidence, and clean-start + packaged validation. |
| Simplicity/surgical change | PASS | Package boundaries are explicit and current-harness removal is out of scope. |
| Explicit assumptions/goal-driven delivery | PASS | Clarified requirements, research decisions, contracts, and final AD refresh task are documented. |
