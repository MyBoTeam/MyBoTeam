# Feature Specification: Model Router + BYOK Key Injection

**Feature Branch**: `011-model-router-byok`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-156/m4-5-model-router-byok-key-injection pay attention to latest 4 PRs and the way things were implemented. Maintain high quality code no shortcuts or skipping of any kind"

## Mission Brief

**Goal**: Implement a model router that selects the appropriate LLM provider based on agent configuration, with a fallback chain that includes dead-host cooldown, and secure BYOK (Bring Your Own Key) injection at runtime so API keys are never logged or exposed.

**Success Criteria**:
- Router correctly selects the provider specified by the agent configuration
- When a provider is unavailable, the fallback chain activates with appropriate cooldown
- BYOK keys are decrypted at materialization time and never appear in logs or error messages
- Per-agent provider overrides work without affecting other agents

**Constraints**:
- Must integrate with the existing `ProviderClient` interface from MAO-152
- Must use the existing vault infrastructure for BYOK key storage
- Must follow established patterns from the latest 4 PRs (OpenAI/Anthropic clients, local providers, custom providers)
- Must maintain the Result type pattern (`ProviderClientResult<T>`) for all router operations

## Clarifications

### Session 2026-07-09
- Q: How should the fallback chain be constructed when a provider fails? → A: Per-agent with global default — each agent optionally defines an ordered list of provider IDs to try; if omitted, the system uses the global default fallback order.
- Q: Which error types should be classified as transient versus permanent? → A: Timeout-based — timeouts and 5xx are transient (server-side, may resolve); DNS/SSL/connection refused are permanent (likely misconfiguration); 429 is transient; auth errors (401/403) and invalid config (400) are permanent.
- Q: When the vault is locked and a BYOK provider cannot decrypt its key, should the system skip that provider and continue the fallback chain, or fail immediately? → A: Skip with warning — skip the BYOK provider, log a warning, continue fallback; if ALL providers require BYOK and vault is locked, fail with vault-access error.
- Q: Should the dead-host cooldown duration be fixed or use exponential backoff? → A: Exponential backoff — starts at 60s, doubles on each subsequent cooldown cycle (60s → 120s → 240s), capped at 600 seconds (10 minutes). Resets on successful request.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Provider Selection by Agent Config (Priority: P1)

As a developer, I want the system to route LLM requests to the correct provider based on the agent's configuration so that each agent uses its designated LLM backend without manual intervention.

**Why this priority**: This is the core routing functionality. Without it, agents cannot use the correct provider, and the entire M4 LLM layer is non-functional.

**Independent Test**: Can be fully tested by configuring two agents with different providers (e.g., one with OpenAI, one with Anthropic) and verifying each agent's requests go to the correct provider.

**Acceptance Scenarios**:

1. **Given** an agent is configured to use the OpenAI provider, **When** the agent sends a chat completion request, **Then** the system routes the request to the OpenAI provider client.
2. **Given** an agent is configured to use a custom provider named "my-local-llm", **When** the agent sends a chat completion request, **Then** the system routes the request to the matching custom provider client.
3. **Given** an agent has no explicit provider override, **When** the agent sends a request, **Then** the system uses the default provider from the global configuration.
4. **Given** an agent is configured with a provider that does not exist, **When** the agent sends a request, **Then** the system returns a clear error indicating the provider is not found.

---

### User Story 2 - Fallback Chain with Dead-Host Cooldown (Priority: P1)

As a developer, I want the system to automatically fall back to an alternative provider when the primary provider is unavailable, with a cooldown period to avoid hammering dead hosts, so that agent functionality is resilient to provider outages.

**Why this priority**: Fallback is essential for reliability. Without it, a single provider outage blocks all agent operations. Dead-host cooldown prevents cascade failures.

**Independent Test**: Can be tested by simulating a primary provider failure (e.g., invalid endpoint) and verifying the system falls back to an alternative provider, then verifying the failed host enters a cooldown state.

**Acceptance Scenarios**:

1. **Given** the primary provider is configured as OpenAI and OpenAI is returning 5xx errors, **When** an agent sends a request, **Then** the system attempts the fallback provider (e.g., Anthropic) and returns the response.
2. **Given** a provider has failed 3 consecutive times, **When** a new request arrives, **Then** the system skips that provider for the duration of the cooldown period (minimum 60 seconds) rather than immediately retrying.
3. **Given** a provider is in cooldown, **When** the cooldown period expires and a new request arrives, **Then** the system re-attempts the provider as a potential recovery.
4. **Given** all providers in the fallback chain are unavailable, **When** an agent sends a request, **Then** the system returns a clear error indicating all providers are exhausted with details about each failure.
5. **Given** a provider recovers after a cooldown, **When** a subsequent request succeeds, **Then** the system resets the failure counter for that provider.

---

### User Story 3 - BYOK Key Injection at Runtime (Priority: P1)

As a developer, I want BYOK API keys to be decrypted from the vault and injected into provider requests at runtime so that keys are never logged, stored in plaintext, or exposed in error messages.

**Why this priority**: Security is non-negotiable for credential handling. BYOK keys must never leak into logs, stack traces, or error responses.

**Independent Test**: Can be tested by configuring a custom provider with a BYOK key, sending a request, and verifying the key does not appear in any log output, error message, or system state dump.

**Acceptance Scenarios**:

1. **Given** a custom provider has an API key stored in the vault, **When** the system materializes the provider for a request, **Then** the key is decrypted from the vault and used only for the duration of that request.
2. **Given** a BYOK key has been injected into a request, **When** the request fails and an error is logged, **Then** the API key value does not appear in the error message or log entry.
3. **Given** a BYOK key has been injected into a request, **When** the system serializes the request for debugging, **Then** the API key field is masked (displayed as `****` + last 4 characters).
4. **Given** a BYOK key is stored in the vault, **When** the system retrieves the key, **Then** the decrypted key exists only in memory for the duration of the provider materialization and is not persisted to disk or cached beyond the request lifecycle.

---

### User Story 4 - Per-Agent Provider Override (Priority: P2)

As a developer, I want to override the provider for a specific agent so that individual agents can use different providers without affecting the global configuration or other agents.

**Why this priority**: Per-agent overrides enable flexible multi-provider setups where different agents have different requirements (e.g., a coding agent uses Claude, a general agent uses GPT).

**Independent Test**: Can be tested by configuring a global default provider and overriding one agent to use a different provider, then verifying both agents use their respective providers.

**Acceptance Scenarios**:

1. **Given** the global default provider is OpenAI, **When** Agent A is configured with a per-agent override to use Anthropic, **Then** Agent A routes to Anthropic while Agent B (no override) routes to OpenAI.
2. **Given** an agent has a per-agent provider override, **When** the override provider is unavailable and fallback activates, **Then** the system falls back within the agent's configured provider list, not the global list.
3. **Given** an agent has a per-agent provider override, **When** the override is removed, **Then** the agent reverts to the global default provider.

---

### User Story 5 - Provider Health Visibility (Priority: P3)

As a developer, I want visibility into provider health status so that I can understand which providers are available, which are in cooldown, and which have permanently failed.

**Why this priority**: Operational visibility helps debug routing issues and monitor provider reliability.

**Independent Test**: Can be tested by querying provider health status after sending requests through the router and verifying the reported states match expectations.

**Acceptance Scenarios**:

1. **Given** the system has routed requests through multiple providers, **When** I query provider health status, **Then** I see the current state (healthy, degraded, cooldown) for each provider with timestamps.
2. **Given** a provider is in cooldown, **When** I query health status, **Then** I see the cooldown expiration time and the reason for the failure.
3. **Given** a provider has recovered from failure, **When** I query health status, **Then** the state reflects healthy status and the last successful request timestamp.

---

### Edge Cases

- What happens when a provider returns a rate limit (HTTP 429) during fallback? The system should treat it as a transient failure, not a dead host, and not increment the dead-host counter or cooldown level.
- What happens when the vault is locked and BYOK keys cannot be decrypted? The system should skip the affected provider, log a warning, and continue the fallback chain. If all providers require BYOK and the vault is locked, the system should fail with a vault-access error.
- What happens when a custom provider is deleted while it is the active provider for an agent? The system should detect the missing provider and fall back gracefully.
- What happens when the fallback chain contains a single provider? The system should retry the same provider with backoff (via existing RetryHandler) rather than entering an immediate dead-host state.
- What happens when two agents simultaneously request the same provider that is in cooldown? Both requests should observe the cooldown and either fall back or fail consistently.
- What happens when a provider's model list changes after the router was initialized? The system should re-fetch the model list on the next request that needs it, not serve stale data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST route LLM requests to the provider specified by the agent's configuration, falling back to the global default when no override is set.
- **FR-002**: System MUST implement a fallback chain that attempts alternative providers when the primary provider fails. Each agent MAY define an ordered list of provider IDs to try in sequence; if the agent does not define a list, the system uses the global default fallback order. The chain is built per-request from agent config + global defaults + provider health state.
- **FR-003**: System MUST track consecutive failures per provider and enter a dead-host cooldown state after a configurable threshold (default: 3 consecutive failures). The initial cooldown duration is 60 seconds. On each subsequent cooldown cycle for the same provider, the duration doubles (60s → 120s → 240s), capped at a maximum of 600 seconds (10 minutes). The cooldown duration resets when the provider successfully handles a request, and the failure counter is reset to prevent stale failure counts from causing premature cooldown.
- **FR-005**: System MUST decrypt BYOK keys from the vault at provider materialization time and inject them into requests at runtime without persisting decrypted keys beyond the request lifecycle. If the vault is locked and a BYOK key cannot be decrypted, the system MUST skip that provider, log a warning, and continue the fallback chain. If ALL providers in the fallback chain require BYOK and the vault is locked, the system MUST fail with a vault-access error.
- **FR-006**: System MUST mask BYOK keys in all log output, error messages, and serialized request dumps (display as `****` + last 4 characters).
- **FR-007**: System MUST support per-agent provider overrides that take precedence over the global default provider configuration.
- **FR-008**: System MUST return typed errors using the `ProviderClientResult<T>` pattern for all router operations, never throwing exceptions.
- **FR-009**: System MUST distinguish between transient failures and persistent failures for fallback decisions. **Transient** (no dead-host cooldown, retry within-provider): HTTP 429 (rate limit), HTTP 5xx (server errors), and request timeouts. **Permanent** (trigger fallback, may enter dead-host cooldown): HTTP 401/403 (authentication/authorization), HTTP 400 (invalid request), DNS resolution failures, SSL/TLS errors, and connection refused. Rate limits (HTTP 429) must not increment the dead-host counter.
- **FR-010**: System MUST provide a provider health status API that reports the current state (healthy, degraded, cooldown), last failure reason, and cooldown expiration for each configured provider.
- **FR-011**: System MUST use the existing `RetryHandler` for retry-within-provider logic and only escalate to the fallback chain when retries are exhausted.
- **FR-012**: System MUST log routing decisions (which provider was selected, why fallback was triggered) at debug level without exposing sensitive data.

### Key Entities

- **ModelRouter**: Orchestrates provider selection, fallback chain execution, and health tracking. Holds the registry of available providers and agent-to-provider mappings. **Lifecycle**: Initialized with provider registry, receives routing requests, delegates to providers.
- **ProviderRegistry**: Maintains the set of available provider instances and their health states. Provides lookup by provider ID and enumeration of healthy providers. **Relationship**: ModelRouter owns a ProviderRegistry; ProviderRegistry holds references to ProviderClient instances.
- **FallbackChain**: Represents the ordered list of providers to attempt for a given request, built from agent config (optional ordered provider list) + global default fallback order + provider health state. If the agent defines a list, it is used as-is; otherwise the global order applies. **Lifecycle**: Constructed per-request as an internal implementation detail, never persisted. Defined as `FallbackChainResult` type in `packages/types/src/router.ts`.
- **ProviderHealth**: Tracks per-provider health state including failure count, cooldown status, cooldown level (for exponential backoff), last failure timestamp, and recovery status. **State machine**: Healthy → Degraded (after N failures) → Cooldown (after threshold, with doubling duration capped at 600s) → Healthy (after successful request, cooldown level resets).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Router correctly routes 100% of requests to the configured provider when all providers are healthy.
- **SC-002**: When a primary provider fails, fallback activates within 2 attempts (primary failure + one retry before fallback escalation).
- **SC-003**: Dead-host cooldown prevents retry attempts to a failed provider for at least 60 seconds after the first failure threshold, with duration doubling on subsequent cooldown cycles (capped at 600 seconds).
- **SC-004**: BYOK keys never appear in logs, error messages, or system state dumps across all test scenarios (verified by log inspection).
- **SC-005**: Per-agent provider overrides do not affect routing for other agents (verified by concurrent multi-agent testing).
- **SC-006**: Provider health status accurately reflects the current state with less than 5 seconds of staleness.

## Assumptions

- The existing `ProviderClient` interface from MAO-152 is stable and will be implemented by all providers (cloud, local, and custom).
- The vault infrastructure from the encrypted secrets vault feature is available and functional for BYOK key storage.
- Agent configurations already include provider selection fields (provider ID, model ID) from the M4 milestone.
- The existing `RetryHandler` (3 attempts, exponential backoff) is sufficient for within-provider retry; the fallback chain handles cross-provider resilience.
- Dead-host cooldown is per-provider, not per-model. A provider in cooldown affects all models served by that provider.
- The fallback chain order is configurable but defaults to: custom providers → cloud providers → local providers.
- Rate limit responses (HTTP 429) are treated as transient and do not contribute to dead-host failure counts, consistent with the rate limit handling pattern in the custom provider service.

## Source Reference Analysis

**Source**: v0.2.0 (packages/daemon/src/conversation-provider.ts callProviderApi), v0.3.0 (providers/models.ts model catalog)

**Verification Status** (verified 2026-07-09):
- v0.2.0 `conversation-provider.ts` — Reference: 3-step model fallback chain (requested model → date-stripped model → hardcoded fallback). Dead-host cooldown not present in v0.2.0.
- v0.3.0 `providers/models.ts` — Reference: Model catalog with `ProviderType` union, `ModelConfig` with static catalog, `modelsEndpoint` for dynamic discovery.
- `packages/types/src/provider-client.ts` — EXISTS: `ProviderClient` interface, `ProviderClientResult<T>` type.
- `packages/agent-core/src/providers/cloud-provider-base.ts` — EXISTS: Abstract base with model fallback, retry, concurrency.
- `packages/agent-core/src/providers/local-provider-base.ts` — EXISTS: Abstract base for HTTP-based providers.
- `packages/agent-core/src/providers/custom-config.ts` — EXISTS: `CustomProviderService` with vault-backed storage, rate limit tracking, state machine.
- `packages/agent-core/src/providers/tools/model-fallback.ts` — EXISTS: `ModelFallback` class with date-suffix stripping and default model fallback.
- `packages/agent-core/src/providers/tools/retry-handler.ts` — EXISTS: `RetryHandler` with configurable backoff.
- `packages/agent-core/src/providers/tools/provider-helpers.ts` — EXISTS: `executeWithFallback()`, `isProviderError()`.
- `packages/agent-core/src/providers/tools/health-check.ts` — EXISTS: `checkHealth()`, `ProviderHealth` interface.
- `packages/agent-core/src/providers/tools/custom-metadata.ts` — EXISTS: `RateLimitState`, `ProviderVaultMetadata`, rate limit counter logic.
- `packages/agent-core/src/providers/tools/custom-utils.ts` — EXISTS: `maskApiKey()`, `classifyNetworkError()`.
- `packages/agent-core/src/providers/tools/error-mapper.ts` — EXISTS: `mapHttpError()`, `mapNetworkError()`.
- `packages/agent-core/src/providers/tools/logger.ts` — EXISTS: `logProviderRequest()`, `logProviderError()`.
- `packages/agent-core/src/vault/vault-service.ts` — EXISTS: Vault service with `retrieve()`, `decrypt()`, `store_entry()`.

**Key Patterns to Adopt from Latest PRs**:
- `CloudProviderBase` pattern: model fallback + retry + concurrency + metrics (from MAO-153)
- `LocalProviderBase` pattern: HTTP + manual SSE + capability detection (from MAO-154)
- `CustomProviderService` pattern: vault-backed, rate limit state machine, masked keys (from MAO-155)
- `ProviderClientResult<T>` pattern: Rust-style ok/error for all operations (from MAO-152)
- Bracket-prefix error codes: `[DEAD_HOST_COOLDOWN]`, `[PROVIDER_NOT_FOUND]` (from MAO-155)

**New Components Required**:
- `ModelRouter` class: provider selection, fallback chain orchestration
- `ProviderRegistry` class: provider instance management, health tracking
- `FallbackChain` builder: constructs ordered provider list per request
- `ProviderHealthTracker`: cooldown state machine, failure counting, recovery detection

**Patterns to Avoid**:
- Never log decrypted API keys, even at debug level
- Never cache decrypted BYOK keys beyond the request lifecycle
- Never throw exceptions from router operations (use Result type)
- Never treat rate limits as dead-host failures
- Never allow a single provider's cooldown to block all agents (each agent has its own fallback chain)
