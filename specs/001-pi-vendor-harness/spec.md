# Feature Specification: Pi Vendor Harness

**Feature Branch**: `001-pi-vendor-harness`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Address and implement Linear MAO-66: vendor and integrate Pi agent core as a MyBoTeam model/task harness, researching and validating technical details first, using the V0.2.0 demo as reference, while working through the spec-driven development cycle."

**Goal**: Specify MAO-66 through the spec-driven development cycle: plan the implementation of a Pi integration where MyBoTeam Pi harness wrappers/adapters live in a new `pi-agent-core` package, copied upstream Pi source lives in a separate vendored package used by it, and Pi becomes the future task harness path while preserving the existing OpenCode harness during this ticket.

**Success Criteria**:
- The spec and downstream plan define a clear implementation path, but no implementation starts outside the approved SDD phases.
- MyBoTeam Pi wrappers/adapters live in `pi-agent-core`, while copied upstream Pi source lives in a separate vendored package, making future copy/update from upstream Pi straightforward and reviewable.
- Existing task execution, streaming events, permissions, provider credentials, UI behavior, and tests remain protected during migration.
- Pi can be planned to execute MyBoTeam tasks through the existing task lifecycle with full current repo tool/MCP/connector parity and no provider secret exposure.
- The current harness is marked deprecated as part of MAO-66 after Pi parity is proven; physical removal is explicitly out of scope.

**Constraints**:
- Planning is allowed now; implementation only starts later through the SDD cycle.
- Do not commit unless explicitly instructed.
- Research must account for Linear MAO-66, upstream Pi current technical facts, the 15cc draft spec, and the V0.2.0 demo.
- MyBoTeam Pi wrappers/adapters must live in the new `pi-agent-core` package, and copied upstream Pi source must live in a separate vendored package used by it.
- Preserve local-first privacy and validate all new task/provider/tool boundaries.
- Keep the current harness available during MAO-66; remove it only in follow-up work outside this ticket.

## Clarifications

### Session 2026-06-11

- Q: What should be the required gate before the current harness is marked deprecated? → A: Automated tests, full live credentialed tool/MCP/connector regression, and maintainer approval.
- Q: How should MAO-66 handle any current MyBoTeam tool, MCP capability, connector, or provider that cannot reach Pi parity within this ticket? → A: Block by default, but allow explicit documented exclusions approved by maintainer.
- Q: How should Pi routing be exposed during MAO-66 validation? → A: Pi routes all tasks immediately once implemented, with maintainer controls only for diagnostics.
- Q: What should the separate Pi package contain? → A: New `pi-agent-core` package contains Pi harness wrappers/adapters, while copied upstream Pi source lives in a separate vendored package used by it.
- Q: How should MAO-66 handle live regression items when required credentials or external accounts are unavailable during validation? → A: Mark unavailable items as maintainer-approved validation gaps, distinct from passed items.
- Q: Once Pi routing is implemented, what should happen if Pi cannot start or fails before producing a usable task result? → A: Fail the task clearly; no automatic fallback to current harness.
- Q: How should Pi handle permission-sensitive tools and actions during MAO-66? → A: Reuse existing permission flow for high-risk actions; tool-safe markings allow low-risk actions directly.
- Q: What should be the source pinning policy for copied upstream Pi source? → A: Pin by upstream release tag and commit SHA.
- Q: Which provider/model scope must Pi support for MAO-66 acceptance? → A: All configured current repo providers/models, except approved exclusions.
- Q: What validation evidence format should MAO-66 require for maintainer approval? → A: Structured validation evidence file in the feature/spec artifacts.
- Q: How should MAO-66 handle existing task sessions or resumable conversations created by the current harness once Pi routing is implemented? → A: Existing sessions will be deleted; no old sessions need to resume after Pi routing is implemented.
- Q: What should happen to stored task history and task messages when existing current-harness sessions are deleted? → A: Delete all old task history, messages, and session state; acceptance runs fresh with `pnpm dev:clean`.
- Q: Should MAO-66 preserve existing provider credentials/settings during clean-start acceptance, or should those also be reconfigured from scratch? → A: Reconfigure provider credentials/settings from scratch only when needed for a validation item, not by default.
- Q: How should MAO-66 treat cancellation and interruption behavior for Pi-backed tasks? → A: Pi-backed tasks must support existing cancel and interrupt controls with the same user-visible terminal states.
- Q: How should MAO-66 handle task summaries and generated titles for Pi-backed tasks? → A: Pi-backed tasks must preserve existing summary/title generation behavior.
- Q: How should MAO-66 handle browser preview/frame events for Pi-backed tasks? → A: Pi-backed tasks must preserve existing browser preview/frame event behavior.
- Q: Should MAO-66 acceptance require packaged desktop build validation, or is development clean-start validation enough? → A: Require both clean-start dev validation and packaged desktop build validation.
- Q: What should the structured validation evidence file record for each validation item? → A: Status, scope item, environment, command/result, evidence link, reviewer, and secret-safety note.
- Q: How should MAO-66 handle upstream Pi license and notices in the vendored package? → A: Defer license/notice handling to release review.
- Q: How should MAO-66 handle observability for Pi internals such as model selection, tool calls, token/cost data, and runtime errors? → A: Full verbose Pi internal logs for maintainers.
- Q: What performance baseline should Pi-backed tasks meet for MAO-66 acceptance? → A: No material regression versus current harness, with no fixed numeric threshold.
- Q: What should the separate vendored upstream Pi source package be named? → A: `pi-vendor`.
- Q: Which task entry points must route through Pi once Pi routing is implemented? → A: All current task sources, including UI-created tasks, daemon/background tasks, scheduled tasks, and connector-triggered tasks.
- Q: Where should verbose Pi internal diagnostic logs be surfaced for maintainers? → A: Existing app/daemon diagnostic logs, with sanitized evidence references.
- Q: What should the structured MAO-66 validation evidence artifact be named? → A: `specs/001-pi-vendor-harness/validation-evidence.md`.
- Q: How should the current harness be marked deprecated after Pi parity is approved? → A: Code-level deprecation annotations plus maintainer-facing documentation; no normal user-facing warning.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preserve Existing Task Execution (Priority: P1)

As a MyBoTeam user, I want existing task creation, execution, progress streaming, permissions, provider selection, connector behavior, and task results to continue working while Pi is introduced so that the migration does not disrupt current work.

**Why this priority**: MAO-66 changes the core task execution path. Existing behavior must remain reliable before any new harness path can be accepted.

**Independent Test**: Run the existing task flow and relevant automated checks with the current harness still available; the same user-visible lifecycle states and task results must be produced without new setup steps.

**Acceptance Scenarios**:

1. **Given** an existing configured MyBoTeam workspace, **When** the user starts a task before Pi parity is proven, **Then** the current harness remains available and the task reaches the expected terminal state.
2. **Given** an existing provider credential, connector, workspace, or task setting, **When** the app runs after MAO-66 changes are introduced, **Then** the setting remains usable without migration prompts or manual repair.
3. **Given** a task requires progress, tool activity, permission handling, or final output, **When** it runs through the current harness, **Then** the user-visible task experience remains unchanged.

---

### User Story 2 - Introduce Pi as a Full-Parity Harness Path (Priority: P2)

As a MyBoTeam user, I want Pi-backed task execution to produce the same visible lifecycle, output, and tool behavior as the current harness so that Pi can become the future harness without exposing internal migration details.

**Why this priority**: This is the primary feature value. Pi is not acceptable as a partial model-only path; it must satisfy MyBoTeam's task and tool expectations.

**Independent Test**: Run a representative credentialed task through Pi after parity work is complete; it must stream assistant output, invoke required tools/connectors, surface tool outcomes, and complete through the existing task lifecycle.

**Acceptance Scenarios**:

1. **Given** Pi routing has been implemented, **When** a task starts from any current task source, including UI-created tasks, daemon/background tasks, scheduled tasks, or connector-triggered tasks, **Then** Pi routes it immediately and the task reaches a success, failure, interruption, or cancellation state using the existing task lifecycle.
2. **Given** a Pi-backed task emits assistant output, reasoning, tool activity, or tool completion, **When** the task runs, **Then** those updates are visible through the existing MyBoTeam task event experience.
3. **Given** a Pi-backed task needs any current MyBoTeam tool, MCP capability, or connector, **When** the task invokes that capability, **Then** it behaves with the same user-facing outcome and security boundary as the current harness.
4. **Given** automated checks pass, full live credentialed tool/MCP/connector regression passes, and a maintainer approves the parity evidence, **When** MAO-66 is completed, **Then** the current harness is marked deprecated through code-level deprecation annotations and maintainer-facing documentation, remains available until a separate removal ticket, and does not show a normal user-facing warning.
5. **Given** a current tool, MCP capability, connector, or provider cannot reach Pi parity, **When** MAO-66 acceptance is evaluated, **Then** completion is blocked unless a maintainer approves an explicit documented exclusion.
6. **Given** maintainers need to diagnose Pi routing behavior, **When** they inspect validation diagnostics, **Then** they can observe routing decisions without exposing a normal user-facing harness selector.
7. **Given** a live regression check needs credentials or an external account that is unavailable, **When** validation evidence is recorded, **Then** the item is marked as a maintainer-approved validation gap rather than a passed check.
8. **Given** Pi routing is implemented and Pi cannot start or fails before producing a usable result, **When** the user starts a task, **Then** the task fails clearly and is not automatically rerun through the current harness.
9. **Given** a Pi-backed task requests a high-risk action, **When** approval is required by current policy, **Then** the existing permission request and approval flow is used before the action runs.
10. **Given** a Pi-backed task requests a low-risk tool action that is marked safe, **When** current policy permits direct execution, **Then** the action may run without an extra permission prompt.
11. **Given** a current repo provider/model is configured, **When** Pi parity is validated, **Then** that provider/model is included unless a maintainer approves an explicit documented exclusion.
12. **Given** MAO-66 is ready for maintainer approval, **When** validation evidence is reviewed, **Then** `specs/001-pi-vendor-harness/validation-evidence.md` lists passed checks, approved exclusions, validation gaps, and deprecation approval status.
13. **Given** Pi routing is implemented, **When** the system starts accepting Pi-backed work, **Then** old current-harness sessions have been deleted and no current-harness session resume path is required.
14. **Given** MAO-66 validation starts from a clean app state, **When** the app is run for acceptance, **Then** old task history, task messages, and session state are absent.
15. **Given** a validation item requires provider credentials or settings, **When** clean-start acceptance reaches that item, **Then** credentials/settings are configured from scratch for that item rather than assumed to already exist.
16. **Given** a Pi-backed task is running, **When** the user cancels or interrupts it, **Then** the task uses the existing controls and reaches the same user-visible terminal state semantics as current tasks.
17. **Given** a Pi-backed task completes or updates in a way that currently produces a summary or generated title, **When** the task is stored and displayed, **Then** summary/title behavior matches the existing task experience.
18. **Given** a Pi-backed task uses browser automation or browser-visible output, **When** browser preview/frame events are produced, **Then** the existing browser preview experience remains available.
19. **Given** MAO-66 acceptance is evaluated, **When** validation evidence is reviewed, **Then** it includes both clean-start development validation and packaged desktop build validation.
20. **Given** a validation item is recorded, **When** the evidence file is reviewed, **Then** the item includes status, scope item, environment, command/result, evidence link, reviewer, and secret-safety note.
21. **Given** copied upstream Pi source is included, **When** release readiness is reviewed, **Then** upstream license and notice handling is reviewed before release.
22. **Given** maintainers diagnose Pi-backed execution, **When** they inspect the existing app/daemon diagnostic logs and validation evidence references, **Then** model selection, tool calls, token/cost data, and runtime errors are available in sanitized form without exposing secrets.
23. **Given** comparable validation tasks are run through Pi and the current harness, **When** performance is reviewed, **Then** Pi-backed execution shows no material regression without requiring a fixed numeric threshold.

---

### User Story 3 - Maintain Pi Package Boundaries Deliberately (Priority: P3)

As a maintainer, I want MyBoTeam's Pi harness wrapper/adapters and the copied upstream Pi source to live in separate packages with clear ownership so that future upstream refreshes are deliberate, reviewable, and easy to repeat.

**Why this priority**: Vendoring is part of the issue scope and directly affects long-term maintainability and supply-chain review.

**Independent Test**: Inspect the Pi package boundaries and documentation; a maintainer can identify which package contains MyBoTeam wrapper/adapters, which package contains copied upstream source, what was copied, from where, at which upstream release tag and commit SHA, and how to refresh it safely.

**Acceptance Scenarios**:

1. **Given** a maintainer reviews the repo, **When** they inspect the Pi packages, **Then** they can distinguish MyBoTeam Pi wrapper/adapters from copied upstream Pi source and from the existing agent-core logic.
2. **Given** upstream Pi needs to be refreshed, **When** the maintainer follows the documented process, **Then** they can copy/update the vendored package and know which validation checks must pass.
3. **Given** vendored source is copied from upstream, **When** it is accepted into the repo, **Then** it has been adapted and validated against MyBoTeam conventions without losing upstream attribution.

### Edge Cases

- Pi provider credentials are missing, expired, invalid, or mapped differently than current MyBoTeam provider settings.
- A configured current repo provider/model is unsupported by Pi and requires an approved exclusion before MAO-66 can be accepted.
- Pi cannot start or fails before producing a usable result after Pi routing has been implemented.
- Pi emits events in an order or shape that differs from the current task event stream.
- A Pi-backed task invokes a long-running, failing, permission-sensitive, or connector-backed tool.
- A Pi-backed task is cancelled or interrupted while model output or tool execution is in progress.
- A Pi-backed task completes but summary/title generation fails or differs from the existing task experience.
- A Pi-backed task uses browser automation but browser preview/frame events are missing or incompatible.
- A Pi-backed task invokes a tool whose safe/low-risk marking conflicts with current permission policy.
- Pi cannot support a current MyBoTeam provider, tool, MCP capability, connector, or local-only workflow without an adapter decision.
- A current capability is excluded from Pi parity by maintainer approval and must remain visibly documented as outside the accepted parity surface.
- Vendored source introduces dependency, build, packaging, import, licensing, or convention conflicts.
- Upstream Pi license or notice obligations are unresolved at release review.
- Parity validation fails after the current harness has been marked for deprecation; the system must keep the current harness available.
- Validation evidence must demonstrate behavior without storing or exposing provider secrets.
- Verbose Pi internal logs include provider secrets, connector tokens, credential material, or sensitive user data that should be redacted.
- Required live validation credentials or external accounts are unavailable and must be recorded as validation gaps rather than silently skipped or treated as passing.
- Validation evidence is incomplete, stale, or missing the status of passed checks, exclusions, gaps, or deprecation approval.
- A validation evidence item is missing status, scope item, environment, command/result, evidence link, reviewer, or secret-safety note.
- Old current-harness sessions are still present when Pi routing is implemented and must be deleted rather than resumed.
- Old task history or task messages remain during clean-start acceptance and must be removed.
- A validation item requires provider credentials or settings that were not configured during clean-start acceptance.
- Pi-backed comparable validation tasks show material performance regression versus current harness.
- Packaged desktop build validation fails or is missing even though clean-start development validation passed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST preserve the current harness and existing task behavior until Pi parity is proven.
- **FR-002**: System MUST route all current task sources through Pi immediately once Pi routing is implemented, including UI-created tasks, daemon/background tasks, scheduled tasks, and connector-triggered tasks, while retaining maintainer-only diagnostics for routing behavior.
- **FR-003**: System MUST keep MyBoTeam Pi harness wrapper/adapters in a new package named `pi-agent-core`.
- **FR-003a**: System MUST keep copied upstream Pi source in a separate vendored package named `pi-vendor` used by `pi-agent-core`.
- **FR-004**: System MUST document the vendored Pi source origin, pinned snapshot, license basis, copied scope, local adaptations, and update procedure.
- **FR-004a**: System MUST pin copied upstream Pi source by both upstream release tag and commit SHA.
- **FR-004b**: System MUST defer upstream Pi license and notice handling to release review before release readiness is accepted.
- **FR-005**: System MUST make future upstream Pi refreshes repeatable by keeping the copied source package boundary clear and reviewable.
- **FR-006**: System MUST validate all task, provider, credential, tool, MCP, connector, and event inputs crossing the Pi harness boundary before use.
- **FR-007**: System MUST use existing local credential handling for provider secrets and MUST NOT write provider secrets to vendored source, configuration files, logs, fixtures, screenshots, traces, or task events.
- **FR-008**: System MUST bridge Pi-backed assistant output, reasoning, tool activity, tool results, completion, failure, interruption, and cancellation into the existing user-visible task event experience.
- **FR-008a**: System MUST reuse the existing permission request and approval flow for high-risk Pi-backed actions and MUST allow low-risk tool-safe actions directly only when current policy permits direct execution.
- **FR-008b**: System MUST support existing cancel and interrupt controls for Pi-backed tasks with the same user-visible terminal state semantics as current tasks.
- **FR-008c**: System MUST preserve existing task summary and generated title behavior for Pi-backed tasks.
- **FR-008d**: System MUST preserve existing browser preview/frame event behavior for Pi-backed tasks.
- **FR-009**: System MUST expose the full current-repo MyBoTeam tool, MCP, and connector capability surface to Pi-backed tasks before MAO-66 is considered complete.
- **FR-009a**: System MUST support all configured current repo providers/models through Pi before MAO-66 is considered complete, except maintainer-approved documented exclusions.
- **FR-010**: System MUST treat a model-only or representative-tool-only Pi path as insufficient for final MAO-66 acceptance.
- **FR-010a**: System MUST block MAO-66 completion for any current tool, MCP capability, connector, or provider that cannot reach Pi parity unless a maintainer approves an explicit documented exclusion.
- **FR-011**: System MUST preserve existing workspace, provider, connector, MCP, permission, and UI behavior while Pi is introduced.
- **FR-011a**: System MUST NOT expose a normal user-facing harness selector for current-harness versus Pi routing during MAO-66.
- **FR-011b**: System MUST NOT automatically fallback to the current harness when Pi cannot start or fails before producing a usable task result after Pi routing is implemented.
- **FR-012**: System MUST provide non-secret diagnostics for Pi startup, routing, event bridging, tool execution outcomes, parity validation, and terminal task states.
- **FR-012a**: System MUST surface full verbose Pi internal logs through the existing app/daemon diagnostic logging path for maintainers, covering model selection, tool calls, token/cost data, and runtime errors, with secrets redacted and sanitized references available from validation evidence.
- **FR-012b**: System MUST show no material performance regression versus the current harness on comparable validation tasks, without requiring a fixed numeric threshold.
- **FR-013**: System MUST provide automated coverage for current-harness regression protection, Pi routing, credential boundaries, task event bridging, and tool/MCP parity boundaries.
- **FR-013a**: System MUST record unavailable live credentialed regression checks as maintainer-approved validation gaps that are distinct from passed checks.
- **FR-013b**: System MUST produce `specs/001-pi-vendor-harness/validation-evidence.md` as the structured validation evidence file before maintainer approval.
- **FR-013b1**: System MUST record status, scope item, environment, command/result, evidence link, reviewer, and secret-safety note for each validation evidence item.
- **FR-013c**: System MUST delete existing current-harness sessions before or as part of Pi routing activation and MUST NOT require Pi to resume old current-harness sessions.
- **FR-013d**: System MUST support MAO-66 acceptance from a clean app state where old task history, task messages, and session state are deleted.
- **FR-013e**: System MUST configure provider credentials/settings from scratch only when required by a validation item during clean-start acceptance.
- **FR-013f**: System MUST include both clean-start development validation and packaged desktop build validation in MAO-66 acceptance evidence.
- **FR-014**: System MUST use the V0.2.0 Pi demo as a behavioral reference for lifecycle, error, timeout, and credential expectations without copying its process-transport architecture as the target design.
- **FR-015**: System MUST mark the current harness deprecated as part of MAO-66 only after automated checks pass, full live credentialed tool/MCP/connector regression passes, and a maintainer approves the parity evidence; the marker MUST use code-level deprecation annotations plus maintainer-facing documentation and MUST NOT add a normal user-facing warning.
- **FR-016**: System MUST keep physical removal of the current harness outside MAO-66 scope.

### Key Entities *(include if feature involves data)*

- **Pi Agent Core Package**: A new MyBoTeam package named `pi-agent-core` containing the Pi harness wrapper/adapters that integrate Pi-backed execution with MyBoTeam task behavior.
- **Vendored Pi Source Package**: A separate repository package named `pi-vendor` containing copied upstream Pi source used by `pi-agent-core`, plus provenance, release tag, commit SHA, and update documentation.
- **Harness Route**: The system decision that determines whether a task runs through the current harness or the Pi harness while keeping users insulated from internal routing details.
- **Task Execution Event**: User-visible progress, assistant output, reasoning, tool activity, browser preview/frame data, completion, failure, interruption, and cancellation information emitted during a task.
- **Pi Internal Diagnostic Log**: Maintainer-facing verbose diagnostic data for Pi-backed execution surfaced through existing app/daemon diagnostic logs, including model selection, tool calls, token/cost data, and runtime errors, with secrets redacted and sanitized validation evidence references.
- **Tool/MCP Capability Surface**: The current set of MyBoTeam tools, MCP tools, and connectors that must be available to Pi-backed tasks for parity.
- **Provider Credential**: A local secret used to call a model provider, managed through existing encrypted credential handling and never persisted by the Pi integration.
- **Harness Deprecation Marker**: The repository-visible indication that the current harness is deprecated after Pi parity is proven, while its runtime availability remains intact until separate removal work.
- **Validation Evidence File**: A structured feature artifact recording passed checks, approved exclusions, validation gaps, secret-safety review, and deprecation approval status for MAO-66; each item records status, scope item, environment, command/result, evidence link, reviewer, and secret-safety note.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of required validation checks for touched workspaces pass after MAO-66 implementation, or any environment-blocked check is documented with residual risk.
- **SC-002**: Existing current-harness task flows continue to complete in validation without user configuration changes.
- **SC-003**: At least one representative credentialed task completes through Pi using the existing task lifecycle and event display flow after parity work is complete.
- **SC-004**: Full live credentialed regression across all current repo tools, MCP capabilities, and connectors passes through Pi before MAO-66 is accepted.
- **SC-004a**: All configured current repo providers/models are validated through Pi or documented as maintainer-approved exclusions.
- **SC-005**: No provider secret appears in repository files, logs, test fixtures, screenshots, traces, or task event payloads produced during validation.
- **SC-006**: A maintainer can identify the `pi-agent-core` wrapper/adapters package, the vendored upstream source package, source origin, release tag, commit SHA, copied scope, local adaptations, and update procedure in under 2 minutes.
- **SC-007**: The current harness remains runnable after being marked deprecated through code-level deprecation annotations and maintainer-facing documentation, no normal user-facing warning is added, and no physical removal occurs in MAO-66.
- **SC-008**: Deprecation is blocked until automated checks, full live credentialed tool/MCP/connector regression, and maintainer approval are all recorded as passed.
- **SC-009**: Any accepted Pi parity exclusion is documented with maintainer approval and does not silently reduce the claimed parity surface.
- **SC-010**: Any unavailable live credentialed regression item is documented as a maintainer-approved validation gap and is not counted as a passed item.
- **SC-011**: Pi startup or pre-result failures after Pi routing is implemented produce a clear task failure and no automatic current-harness rerun.
- **SC-012**: High-risk Pi-backed tool actions require the existing approval flow, while low-risk tool-safe actions execute directly only when current policy allows it.
- **SC-013**: Maintainer approval for MAO-66 references `specs/001-pi-vendor-harness/validation-evidence.md`, which lists passed checks, approved exclusions, validation gaps, and deprecation approval status.
- **SC-014**: Existing current-harness sessions are deleted before or during Pi routing activation, and no old current-harness session resume path is required.
- **SC-015**: MAO-66 acceptance can run from a clean app state with no old task history, task messages, or session state.
- **SC-016**: Provider credentials/settings used during clean-start acceptance are configured explicitly for the validation items that need them.
- **SC-017**: Pi-backed task cancellation and interruption reach the same user-visible terminal states as current tasks.
- **SC-018**: Pi-backed tasks produce the same summary/title behavior as current task flows.
- **SC-019**: Pi-backed browser automation tasks preserve the existing browser preview/frame event experience.
- **SC-020**: MAO-66 validation evidence includes passing clean-start development validation and passing packaged desktop build validation, or documented environment-blocked residual risk.
- **SC-021**: Every validation evidence item records status, scope item, environment, command/result, evidence link, reviewer, and secret-safety note.
- **SC-022**: Release readiness is blocked until upstream Pi license and notice handling has been reviewed.
- **SC-023**: Maintainers can inspect verbose Pi internal logs for model selection, tool calls, token/cost data, and runtime errors without provider secrets or credential material appearing.
- **SC-024**: Comparable Pi-backed validation tasks show no material performance regression versus the current harness, with reviewer judgment recorded in validation evidence.

## Assumptions

- Pi is the intended future harness, but the current harness remains available throughout MAO-66.
- Once Pi routing is implemented, normal task starts route through Pi immediately; maintainer diagnostics may expose routing behavior, but normal users do not choose the harness.
- After Pi routing is implemented, Pi startup or pre-result failures are surfaced as clear task failures rather than hidden by current-harness fallback.
- Existing permission policy remains authoritative for Pi-backed actions; tool-safe markings only permit direct execution for low-risk actions allowed by that policy.
- The current harness is marked deprecated only after Pi meets full task, provider, tool, MCP, connector, streaming, and UI parity, with automated checks, live credentialed regression, and maintainer approval recorded.
- The physical removal of the current harness will be handled by a later ticket after MAO-66.
- The new `pi-agent-core` package contains MyBoTeam Pi harness wrapper/adapters; copied upstream Pi source lives in a separate vendored package named `pi-vendor` used by it.
- Copied upstream Pi source is pinned by both release tag and commit SHA.
- Upstream Pi license and notice handling is deferred to release review.
- Maintainer diagnostics include verbose Pi internal logs with secret redaction.
- Performance acceptance is based on no material regression versus current harness on comparable validation tasks, without a fixed numeric threshold.
- Provider/model parity covers all configured current repo providers/models except maintainer-approved exclusions.
- Capability parity gaps block MAO-66 by default unless explicitly documented and approved by a maintainer.
- Unavailable live credentials or external accounts create validation gaps unless a maintainer later supplies them and the checks pass.
- Validation evidence is recorded in a structured file under the feature/spec artifacts before maintainer approval.
- Each validation evidence item records status, scope item, environment, command/result, evidence link, reviewer, and secret-safety note.
- Existing current-harness sessions are deleted before or during Pi routing activation; historical resume compatibility is out of scope.
- Acceptance validation runs from a clean app state; old task history, task messages, and session state do not need to be preserved.
- Acceptance validation includes both clean-start development validation and packaged desktop build validation.
- Clean-start acceptance does not assume preexisting provider credentials/settings; they are configured only for validation items that need them.
- Existing MyBoTeam task lifecycle states and event surfaces are the compatibility target for Pi-backed execution.
- Existing cancel and interrupt controls remain part of the Pi-backed task lifecycle compatibility target.
- Existing summary/title behavior remains part of the Pi-backed task lifecycle compatibility target.
- Existing browser preview/frame event behavior remains part of the Pi-backed task lifecycle compatibility target.
- Existing encrypted local credential handling remains the source of provider secrets.
- The V0.2.0 demo is a reference for behavior and failure handling, not a requirement to keep an RPC child-process transport.
- Upstream Pi source and APIs must be re-verified during implementation planning and before vendoring.
