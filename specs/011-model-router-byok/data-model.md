# Data Model: Model Router + BYOK Key Injection

**Date**: 2026-07-09

## Entities

### ProviderHealthState (NEW — internal, not persisted)

Tracks per-provider health for the cooldown state machine.

| Field | Type | Description |
|-------|------|-------------|
| providerId | string (UUID) | References Provider.id |
| state | `'healthy' \| 'degraded' \| 'cooldown'` | Current health state |
| consecutiveFailures | number | Count of consecutive permanent failures |
| cooldownLevel | number | Exponential backoff level (0 = no cooldown, 1 = 60s, 2 = 120s, ...) |
| cooldownExpiresAt | Date \| null | When cooldown ends (null if not in cooldown) |
| lastFailureAt | Date \| null | Timestamp of last failure |
| lastFailureReason | string \| null | Human-readable failure reason |
| lastSuccessAt | Date \| null | Timestamp of last successful request |

**State Machine**:
```
healthy --[permanent failure, count < threshold]--> degraded
degraded --[permanent failure, count >= threshold]--> cooldown (cooldownLevel++)
degraded --[success]--> healthy (consecutiveFailures = 0)
cooldown --[cooldown expires, request arrives]--> degraded (tentative re-attempt)
cooldown --[success during re-attempt]--> healthy (cooldownLevel = 0, consecutiveFailures = 0)
cooldown --[failure during re-attempt]--> cooldown (cooldownLevel++, expiry recalculated)
```

**Cooldown duration formula**: `min(60 * 2^(cooldownLevel - 1), 600)` seconds. Initial cooldown (level 1) = 60s, level 2 = 120s, level 3 = 240s, level 4+ = 600s (cap).

### FallbackChainResult (NEW — ephemeral, per-request)

The ordered list of providers to attempt for a single request.

| Field | Type | Description |
|-------|------|-------------|
| providers | Array<{ providerId: string, provider: ProviderClient }> | Ordered list of providers to try |
| reason | string | Why this chain was built (for logging) |

### RouterError (NEW — extends ProviderError)

Error type for router-level failures.

| Field | Type | Description |
|-------|------|-------------|
| category | `'router'` | Always 'router' for router errors |
| code | RouterErrorCode | Specific error code |
| message | string | Human-readable message |
| provider | string \| undefined | Which provider failed (if applicable) |
| retryable | boolean | false for router errors |
| details | `{ chain: Array<{ providerId, error }> } \| undefined` | All failures when chain exhausted |

**RouterErrorCode**: `'PROVIDER_NOT_FOUND' \| 'ALL_PROVIDERS_FAILED' \| 'VAULT_LOCKED' \| 'NO_PROVIDERS_AVAILABLE'`

### AgentConfig (MODIFIED — add optional field)

| Field | Type | Change |
|-------|------|--------|
| fallbackProviderIds | string[] (UUID) \| undefined | NEW — optional ordered list of fallback provider IDs |

### Provider (UNCHANGED)

Existing entity. No modifications required.

### ProviderClient (UNCHANGED)

Existing interface. No modifications required.

## Relationships

```
AgentConfig
  ├── providerId ──────> Provider (by UUID) [PRIMARY]
  ├── fallbackProviderIds ─> Provider[] (by UUID) [OPTIONAL, ordered]
  └── model: string

ModelRouter
  ├── owns ProviderRegistry
  ├── owns ProviderHealthTracker
  └── uses BYOKInjector

ProviderRegistry
  ├── holds Map<providerId, ProviderClient>
  └── provides getProvider(id), listByType(type), listAll()

ProviderHealthTracker
  └── holds Map<providerId, ProviderHealthState>

BYOKInjector
  └── uses VaultService (existing)
```

## Validation Rules

- `AgentConfig.fallbackProviderIds`: Must be array of valid UUIDs, no duplicates, must not contain the agent's primary `providerId`
- `ProviderHealthState.cooldownLevel`: Integer, 0 ≤ level ≤ 10 (max cooldown = 600s at level 4+)
- `ProviderHealthState.consecutiveFailures`: Non-negative integer, resets to 0 on success
- `FallbackChainResult.providers`: Non-empty array (error if empty — all providers unavailable)
