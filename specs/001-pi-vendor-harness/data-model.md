# Data Model: Pi Vendor Harness

## Pi Vendor Package

**Purpose**: Holds copied upstream Pi source in a refreshable package boundary.

**Fields/Attributes**:
- `packageName`: `@myboteam/pi-vendor`
- `sourceRepo`: `https://github.com/earendil-works/pi`
- `releaseTag`: `v0.79.1`
- `commitSha`: `28df940f0d07b65284849a483be7b06e2ca046ee`
- `copiedScope`: upstream package directories and files copied into `src/pi-agent-core` and `src/pi-ai`
- `localAdaptations`: TypeScript/package/build changes required for MyBoTeam
- `updateProcedure`: repeatable copy/adapt/validate steps
- `licenseReviewStatus`: deferred to release review

**Relationships**:
- Used by `Pi Agent Core Package`.
- Must not depend on MyBoTeam daemon or UI code.

**Validation Rules**:
- Must include provenance in `VENDORS.md`.
- Must not contain provider secrets, connector tokens, or local credentials.
- Must keep upstream-copied source separate from MyBoTeam wrapper code.

## Pi Agent Core Package

**Purpose**: Contains MyBoTeam wrappers/adapters that integrate vendored Pi with the existing task lifecycle.

**Fields/Attributes**:
- `packageName`: `@myboteam/pi-agent-core`
- `runtimeAdapter`: Pi-backed task adapter implementation
- `eventMapper`: Pi event to MyBoTeam task event/message mapper
- `modelResolver`: provider/model to Pi model resolver
- `toolBridge`: MyBoTeam tool/MCP/connector to Pi `AgentTool` bridge
- `permissionBridge`: high-risk permission flow and low-risk safe-tool handling
- `diagnosticLogger`: app/daemon diagnostic log integration with redaction

**Relationships**:
- Depends on `@myboteam/pi-vendor`.
- Uses shared task, permission, browser, provider, and callback contracts from `@myboteam/agent-core`.
- Is instantiated by daemon/task-manager routing.

**Validation Rules**:
- Must not write provider secrets to files or logs.
- Must validate all inbound task/provider/tool/MCP/connector inputs.
- Must expose all current capability parity or require maintainer-approved exclusions.

## Harness Route

**Purpose**: Runtime decision for the task harness.

**Fields/Attributes**:
- `taskId`
- `source`: `ui`, `whatsapp`, `scheduler`, or future connector/background source
- `selectedHarness`: `pi` by default after implementation; `opencode` only for maintainer diagnostics/current-harness runnable path
- `diagnosticReason`

**State Transitions**:
- `pre-parity`: OpenCode remains available while Pi integration is being developed.
- `pi-active`: all current task sources route to Pi.
- `deprecated-current-harness`: OpenCode remains runnable but is code/documentation deprecated after parity approval.
- `removed`: out of scope for MAO-66.

**Validation Rules**:
- No normal user-facing harness selector.
- No automatic fallback from Pi to current harness after Pi startup/pre-result failure.
- Maintainer diagnostics must not leak secrets.

## Task Execution Event

**Purpose**: Existing user-visible event contract to preserve.

**Fields/Attributes**:
- `taskId`
- `message`: user, assistant, tool, or system message
- `progress`: setup, thinking, tool-use, waiting, complete, startup stages
- `toolName`
- `toolInput`
- `toolStatus`: running, completed, error
- `browserFrame`
- `reasoning`
- `stepFinish`: model, token/cost data, finish reason
- `result`: success, error, interrupted

**Relationships**:
- Produced by Pi adapter through existing callbacks.
- Stored and forwarded by daemon/web as current task messages/events.

**Validation Rules**:
- Assistant output, reasoning, tool start/update/end, browser frames, completion, failure, cancellation, and interruption must map to current visible behavior.
- Token/cost and runtime diagnostics must be redacted before evidence/log references.

## Provider Credential

**Purpose**: Local secret used for model provider calls.

**Fields/Attributes**:
- `providerId`
- `modelId`
- `apiKey` or provider-specific credential payload
- `storageLocation`: existing encrypted local storage
- `retrievalMode`: runtime callback, not config file

**Validation Rules**:
- Must never be stored in `pi-vendor`, `pi-agent-core`, generated Pi config files, logs, fixtures, screenshots, traces, or task events.
- Clean-start validation configures credentials/settings only for validation items that need them.

## Tool/MCP Capability

**Purpose**: Represents each current MyBoTeam tool, MCP capability, or connector exposed to Pi.

**Fields/Attributes**:
- `capabilityId`
- `kind`: built-in tool, MCP tool, connector, browser capability
- `inputSchema`
- `permissionRisk`: high-risk or low-risk safe action
- `executionMode`: sequential or parallel where required
- `parityStatus`: pass, exclusion, gap, failed
- `evidenceLink`

**Validation Rules**:
- Capability parity blocks MAO-66 unless pass or maintainer-approved exclusion.
- Unavailable credentials/accounts are validation gaps, not passed checks.
- Every documented edge case gets at least one automated test task during `/spec-tasks`.

## Validation Evidence Item

**Purpose**: One row/item in `validation-evidence.md`.

**Fields/Attributes**:
- `status`: pass, fail, approved-exclusion, approved-gap, blocked, not-run
- `scopeItem`
- `environment`: clean-start dev, packaged desktop, unit, integration, live credentialed
- `commandOrResult`
- `evidenceLink`
- `reviewer`
- `secretSafetyNote`
- `residualRisk`

**Validation Rules**:
- Every item must include status, scope item, environment, command/result, evidence link, reviewer, and secret-safety note.
- Deprecation approval must reference this file.

## Harness Deprecation Marker

**Purpose**: Repository-visible marker for current harness after Pi parity is approved.

**Fields/Attributes**:
- `codeAnnotations`: deprecation annotations near current harness API/classes
- `maintainerDocs`: documentation explaining current harness is deprecated and removal is follow-up work
- `approvalReference`: link/reference to `validation-evidence.md`

**Validation Rules**:
- Must not remove current harness.
- Must not add normal user-facing warning.
- Must be applied only after automated checks, live credentialed regression, and maintainer approval.
