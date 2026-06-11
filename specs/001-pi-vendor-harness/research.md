# Research: Pi Vendor Harness

## Decision: Treat Linear MAO-66 as source input, but follow clarified MAO-66 spec for final scope

**Rationale**: Linear MAO-66 originally describes additive, opt-in Pi harness selection and vendoring under a generic source layout. The accepted feature spec supersedes that with Pi routing for all current task sources once implemented, no normal user-facing harness selector, `packages/pi-vendor` for copied upstream source, `packages/pi-agent-core` for MyBoTeam wrappers/adapters, and current-harness deprecation only after parity approval.

**Alternatives considered**:
- Follow Linear literally with opt-in per-agent harness: rejected because user clarification changed accepted behavior.
- Replace and remove OpenCode immediately: rejected because removal is outside MAO-66.

## Decision: Pin upstream Pi source to release tag `v0.79.1` and commit `28df940f0d07b65284849a483be7b06e2ca046ee`

**Rationale**: GitHub release metadata verified `v0.79.1` as the latest release on 2026-06-11, published 2026-06-09. The Git tag resolves to commit `28df940f0d07b65284849a483be7b06e2ca046ee`. The spec requires both release tag and commit SHA.

**Alternatives considered**:
- Pin only tag: rejected because tag-only provenance is less explicit than the clarified release tag plus SHA.
- Pin `main`: rejected because it is not stable or reviewable.

## Decision: Vendor copied upstream source into `packages/pi-vendor`

**Rationale**: User clarified copied upstream Pi source must live in a separate package used by `pi-agent-core`. Keeping upstream-copied source isolated makes future refreshes copy/adapt/reviewable and applies the team Copy+Adapt directive.

**Alternatives considered**:
- Copy under `packages/agent-core/src/vendors`: rejected because it mixes upstream source into current business-logic package and contradicts the clarified package boundary.
- Use npm dependencies only: rejected because MAO-66 requires vendored source and pinned provenance.

## Decision: Put MyBoTeam Pi wrappers/adapters in `packages/pi-agent-core`

**Rationale**: `pi-agent-core` is the package boundary requested by the user for wrappers/adapters analogous to current `agent-core` harness integration, but modified for Pi. This package should depend on `@myboteam/pi-vendor` and shared contracts from `@myboteam/agent-core`, not contain copied upstream source.

**Alternatives considered**:
- Put adapters in `packages/agent-core`: rejected because user explicitly requested a new `pi-agent-core` package.
- Put adapters inside `pi-vendor`: rejected because local wrappers would make upstream refresh noisy.

## Decision: Add a task-runtime adapter factory in `packages/agent-core`

**Rationale**: Current `TaskManager` constructs `OpenCodeAdapter` directly. All current task sources converge through daemon `TaskService`, which uses `createTaskManager`. A small shared adapter factory lets Pi become the default runtime for all sources while preserving the current harness as runnable and later deprecated.

**Alternatives considered**:
- UI-level routing: rejected because scheduler, WhatsApp, and connector-triggered tasks would bypass it.
- Large task-manager rewrite: rejected as unnecessary; queueing/callback behavior should remain intact.

## Decision: Translate Pi `AgentEvent`s into the existing task callback/event contract

**Rationale**: Current UI and daemon behavior depend on task callbacks and task message shapes, not on the underlying agent runtime. Upstream Pi emits `agent_start`, `turn_start`, `message_update`, `tool_execution_start`, `tool_execution_update`, `tool_execution_end`, `turn_end`, and `agent_end`. The wrapper should map these into current message/progress/tool/reasoning/step/browser callbacks.

**Alternatives considered**:
- Expose Pi events directly to UI: rejected because it would create a migration-specific UI contract.
- Keep OpenCode message types as the Pi package public API: rejected because it overfits Pi to the old implementation and makes future runtime maintenance harder.

## Decision: Use Pi `beforeToolCall` with `{ block: true }` for permission blocking

**Rationale**: Upstream source verifies `BeforeToolCallResult` uses `block?: boolean`, not `blocked`. Returning `{ block: true, reason }` prevents execution and emits an error tool result. This is the correct hook for current high-risk permission flow.

**Alternatives considered**:
- Use `{ blocked: true }`: rejected as stale Linear text; current upstream does not define it.
- Enforce permissions only inside each tool: rejected because centralized preflight is needed for parity and auditability.

## Decision: Treat `@earendil-works/pi-agent-core` as having more dependencies than only `pi-ai`

**Rationale**: Current upstream package source imports from `@earendil-works/pi-ai` and `typebox`; package metadata also includes dependencies such as `ignore` and `yaml`. The implementation must vendor or workspace-resolve all required upstream package dependencies instead of assuming only `pi-ai`.

**Alternatives considered**:
- Vendor only `pi-agent-core` and `pi-ai`: rejected because it can fail typecheck/build when additional runtime dependencies are required.

## Decision: Keep provider secrets in existing encrypted storage and retrieve them at runtime

**Rationale**: Pi `AgentLoopConfig` supports `getApiKey(provider)` to dynamically resolve keys per LLM call. This matches the local-first requirement and avoids writing secrets to config files, vendored source, logs, fixtures, traces, or screenshots.

**Alternatives considered**:
- Generate Pi auth/config files containing secrets: rejected due to secret-leak risk.
- Copy OpenCode auth sync behavior directly: rejected because Pi supports runtime key lookup and the spec forbids writing secrets.

## Decision: Use V0.2.0 Pi harness only as behavioral reference

**Rationale**: The V0.2.0 demo package uses process spawning and JSONL RPC around `pi --mode rpc`. MAO-66 targets vendored `pi-agent-core` and `pi-ai` in-process, so V0.2.0 is useful for lifecycle, timeouts, auth expectations, and structured logging patterns, but not as the target architecture.

**Alternatives considered**:
- Reuse V0.2.0 process transport directly: rejected because Linear and accepted spec target Pi agent core as a task harness, not a CLI subprocess harness.

## Decision: Validation evidence is markdown at `specs/001-pi-vendor-harness/validation-evidence.md`

**Rationale**: Markdown keeps evidence reviewable in Git while supporting links to command output, screenshots, log excerpts, exclusions, validation gaps, deprecation approval, and secret-safety notes.

**Alternatives considered**:
- JSON only: rejected because reviewer sign-off and residual-risk notes are easier in Markdown.
- Store evidence only in research.md: rejected because research and validation have different lifecycles.

## Decision: Defer upstream Pi license/notice completion to release review, but document provenance now

**Rationale**: The accepted spec defers license/notice handling to release review. Planning still requires `VENDORS.md` provenance, copied scope, tag, SHA, update procedure, and local adaptations.

**Alternatives considered**:
- Block planning on license review: rejected because the spec explicitly defers this to release readiness.
- Ignore license until packaging: rejected because provenance is needed immediately for vendored source.

## Decision: Final implementation tasks must rerun `architecture.init`

**Rationale**: MAO-66 changes package boundaries and core task harness architecture. The user explicitly asked to add a final task to rerun `architecture.init` so the Architecture Description is refreshed after implementation.

**Alternatives considered**:
- Rerun architecture during planning: rejected because the AD should reflect the final implemented architecture, not a draft plan.
