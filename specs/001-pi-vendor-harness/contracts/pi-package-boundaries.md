# Contract: Pi Package Boundaries

## `packages/pi-vendor`

**Owns**:
- Copied upstream source from `earendil-works/pi`.
- `src/pi-agent-core/` copied from upstream package agent source.
- `src/pi-ai/` copied from upstream package AI source.
- Upstream dependency declarations required by copied source.
- `VENDORS.md` with repo URL, tag, commit SHA, copied scope, local adaptations, update procedure, and release-review license status.

**Must not own**:
- MyBoTeam task lifecycle logic.
- Daemon runtime selection.
- UI or IPC code.
- Provider secrets, generated auth files, fixtures containing credentials, or validation logs.

**Refresh Rule**:
Future upstream updates should be copy/adapt/validate operations scoped primarily to `packages/pi-vendor`, with wrapper changes in `packages/pi-agent-core` only when upstream API changes require adaptation.

## `packages/pi-agent-core`

**Owns**:
- MyBoTeam Pi runtime adapter.
- Pi event mapping.
- Provider/model resolver.
- Tool/MCP/connector bridge.
- Permission bridge using Pi `beforeToolCall`.
- Diagnostic log redaction and app/daemon logging integration.
- Tests for wrapper/adapters.

**Must not own**:
- Copied upstream source.
- Current OpenCode harness implementation.
- Normal user-facing harness selector or deprecation warning.

## `packages/agent-core`

**Owns**:
- Shared task, permission, provider, browser, and callback contracts.
- Current OpenCode harness implementation.
- Harness-neutral task manager adapter factory/contract.
- Code-level deprecation annotations for current harness after parity approval.

**Must not own**:
- Copied upstream Pi source.
- MyBoTeam Pi-specific wrapper implementation except shared interfaces required to call it.

## `apps/daemon`

**Owns**:
- Task-source convergence and runtime selection.
- Clean-start task/session/history deletion behavior.
- Runtime provider credential retrieval callbacks.
- Existing app/daemon diagnostic logging path.

**Must not own**:
- Pi event mapping internals.
- Copied upstream Pi source.

## Acceptance Invariants

- `pi-agent-core` depends on `pi-vendor`; `pi-vendor` does not depend on `pi-agent-core`.
- `agent-core` remains usable by web/desktop/daemon without circular workspace dependencies.
- No normal user can select OpenCode versus Pi during MAO-66.
- Current harness is deprecated only after evidence approval and remains runnable until a separate removal ticket.
