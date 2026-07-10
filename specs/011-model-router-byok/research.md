# Research: Model Router + BYOK Key Injection

**Date**: 2026-07-09
**Spec**: specs/011-model-router-byok/spec.md

## R1: Agent Config Model for Provider Fallback

**Decision**: Add optional `fallbackProviderIds` field to `AgentConfig` schema.

**Rationale**: The existing `AgentConfig` binds each agent to exactly one `providerId`. The clarified spec says "per-agent with global default" — each agent optionally defines an ordered list of provider IDs. Adding `fallbackProviderIds: z.array(z.string().uuid()).optional()` to `AgentConfigSchema` is the minimal change. The global default fallback order is derived at runtime from the `ProviderRegistry` (all enabled providers, ordered by type priority: custom → cloud → local).

**Alternatives considered**:
- *Separate FallbackConfig entity*: Overengineered for an optional array field.
- *Agent-level config file*: Would require new storage layer, not warranted.

## R2: ProviderHealth State Machine

**Decision**: Extend `ProviderHealth` interface with cooldown state fields; create `ProviderHealthTracker` class.

**Rationale**: The existing `ProviderHealth` interface (`{ healthy, latency, timestamp, error? }`) is a point-in-time health check result, not a persistent state tracker. The spec requires tracking consecutive failures, cooldown state with exponential backoff, and recovery. A new `ProviderHealthTracker` class manages a `Map<providerId, ProviderHealthState>` with state transitions: `healthy → degraded → cooldown → healthy`. The existing `ProviderHealth` interface is reused for the health check API response.

**Alternatives considered**:
- *Extend existing ProviderHealth*: Would break existing API consumers and conflate two concepts (check result vs persistent state).
- *Database-backed state*: In-memory is sufficient for a single daemon instance; no persistence needed per spec assumptions.

## R3: BYOK Key Injection Architecture

**Decision**: Create `BYOKInjector` class that wraps vault decryption + masking; called by `ModelRouter` before each provider invocation.

**Rationale**: The router intercepts the request before it reaches the provider client. For custom providers with stored API keys, the injector decrypts from vault, injects into the provider config, and ensures the key is not in any error/log path. The injection is per-request (no caching beyond request lifecycle per FR-005). If vault is locked, the injector returns a `vault_locked` error and the router skips to the next provider.

**Alternatives considered**:
- *Modify ProviderClient to accept vault reference*: Would change the existing interface, violating constraints.
- *Decrypt once at provider registration*: Would cache decrypted keys, violating the "no persistence beyond request lifecycle" requirement.

## R4: Transient vs Permanent Failure Classification

**Decision**: Create `classifyTransient(error: ProviderError): boolean` utility function.

**Rationale**: The spec defines timeout-based classification. The existing `ProviderError` already has `category` and `retryable` fields, but these don't perfectly map to the spec's transient/permanent distinction (e.g., `rate_limit` is `retryable: true` but should not increment dead-host counter). A dedicated classifier maps:
- **Transient** (no dead-host): `rate_limit` category, `TIMEOUT_ERROR` code, `SERVER_ERROR` code (5xx)
- **Permanent** (dead-host): `auth` category, `VALIDATION_ERROR` code, network errors (`CONNECTION_ERROR` for DNS/SSL/connection refused)

**Alternatives considered**:
- *Use existing `retryable` field*: Doesn't distinguish rate limits from 5xx (both retryable but different dead-host behavior).
- *HTTP status code only*: Doesn't cover DNS/SSL errors that don't have status codes.

## R5: Fallback Chain Construction

**Decision**: `FallbackChain.build(agentConfig, providerRegistry, healthTracker)` — pure function, per-request.

**Rationale**: The chain is constructed fresh for each request. Order: (1) agent's `fallbackProviderIds` if defined, else (2) global default order from registry, filtered by (3) health state (skip providers in cooldown). This is stateless — the chain is never persisted.

**Alternatives considered**:
- *Cached chain per agent*: Would need invalidation on health state changes; adds complexity for minimal perf gain.
- *Static chain at startup*: Can't account for dynamic health state changes.

## R6: Global Default Provider Order

**Decision**: Derive from `ProviderRegistry` — all enabled providers ordered by type: custom → cloud (openai, anthropic) → local (ollama, lmstudio).

**Rationale**: No global config file exists for provider ordering. The registry holds all registered providers; the default order is a convention based on provider type. Custom providers are tried first (user-configured), then cloud (reliable but external), then local (available but limited).

**Alternatives considered**:
- *New global config field*: Would require schema changes to a config entity that doesn't exist yet.
- *Random/alphabetical*: Non-deterministic, poor UX.
