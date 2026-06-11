# Quickstart: Pi Vendor Harness Validation

## Scope

This quickstart describes the validation flow expected after MAO-66 implementation tasks run. It does not start implementation during planning.

## 1. Verify Package Boundaries

Check that the workspace contains:

```text
packages/pi-vendor/
packages/pi-agent-core/
packages/agent-core/
```

Expected:
- `packages/pi-vendor/VENDORS.md` records upstream `earendil-works/pi`, tag `v0.79.1`, commit `28df940f0d07b65284849a483be7b06e2ca046ee`, copied scope, local adaptations, update procedure, and release-review license status.
- `packages/pi-agent-core` contains only MyBoTeam wrappers/adapters and tests.
- `packages/agent-core` still contains the current harness and shared task contracts.

## 2. Run Static Verification

```bash
pnpm check
pnpm -F @myboteam/agent-core test
pnpm -F @myboteam/pi-agent-core test
pnpm -F @myboteam/daemon test
```

Add `pnpm -F @myboteam/web test` and `pnpm -F @myboteam/desktop test` when touched implementation affects UI, IPC, packaging, or desktop behavior.

## 3. Validate Clean-Start Development Runtime

```bash
pnpm dev:clean
```

Expected:
- Old task history, messages, and current-harness session state are absent.
- Provider credentials/settings are configured from scratch only for validation items that need them.
- All task sources route to Pi after implementation: UI, daemon/background, scheduler, WhatsApp/connector-triggered.
- No normal user-facing harness selector or deprecation warning appears.

## 4. Validate Pi Task Lifecycle

Run representative tasks that cover:
- Assistant streaming output.
- Reasoning output when available.
- Tool start/update/end.
- MCP tool invocation.
- Connector-backed action.
- Browser preview/frame event.
- Summary/title generation.
- Cancellation.
- Interruption.
- Pi startup/pre-result failure.

Expected:
- Each task reaches the same user-visible terminal state semantics as current harness tasks.
- Pi startup/pre-result failure is a clear failed task with no automatic current-harness fallback.
- Browser frame events continue to reach the existing preview experience.

## 5. Validate Permission Flow

Run high-risk and low-risk tool scenarios.

Expected:
- High-risk actions use the existing permission request and approval flow.
- Denied Pi tool calls are blocked with Pi `beforeToolCall` returning `{ block: true, reason }`.
- Low-risk safe actions execute directly only when current policy permits.
- WhatsApp/background tasks without approval surface auto-deny as current behavior requires.

## 6. Validate Providers, Tools, MCP, and Connectors

Record every item in `specs/001-pi-vendor-harness/validation-evidence.md`.

For each provider/model, tool, MCP capability, connector, and task source:
- status
- scope item
- environment
- command/result
- evidence link
- reviewer
- secret-safety note

Expected:
- Passed items are backed by evidence.
- Unsupported items are maintainer-approved exclusions, not silently skipped.
- Unavailable credentials/accounts are maintainer-approved validation gaps, not passed checks.

## 7. Validate Packaged Desktop Build

Run the packaged desktop build validation required by the implementation tasks.

Expected:
- The packaged app starts with the Pi packages available.
- Bundled runtime resolution still works.
- No provider secret appears in packaged logs, screenshots, traces, fixtures, or task events.

## 8. Approve Deprecation Marker

Only after automated checks, full live credentialed regression, and maintainer approval:
- Add code-level deprecation annotations for the current harness.
- Add maintainer-facing documentation.
- Do not remove current harness code.
- Do not add normal user-facing warning.
- Record approval in `validation-evidence.md`.

## 9. Final Architecture Refresh

After MAO-66 implementation and validation are complete, rerun:

```text
architecture.init
```

Expected:
- The Architecture Description is refreshed to reflect `pi-vendor`, `pi-agent-core`, task manager routing, current-harness deprecation, and validation evidence.
