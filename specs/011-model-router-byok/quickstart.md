# Quickstart: Model Router + BYOK Key Injection

## Overview

The Model Router provides cross-provider routing with fallback, dead-host cooldown, and BYOK key injection. It sits between the agent layer and provider clients.

## Architecture

```
Agent Request
    │
    ▼
ModelRouter.chatCompletion(agentConfig, chatRequest)
    │
    ├── 1. Build FallbackChain (agent config → global default → health filter)
    ├── 2. For each provider in chain:
    │       a. BYOKInjector: decrypt vault key if needed
    │       b. RetryHandler: retry within provider (existing, 3 attempts)
    │       c. ProviderClient.chatCompletion(request)
    │       d. If success → return result, reset health counter
    │       e. If permanent failure → increment health counter, try next
    │       f. If transient failure → retry within provider, don't affect health
    ├── 3. If all providers exhausted → return ALL_PROVIDERS_FAILED error
    └── 4. Log routing decision at debug level
```

## Key Classes

| Class | Location | Responsibility |
|-------|----------|----------------|
| `ModelRouter` | `packages/agent-core/src/providers/model-router.ts` | Orchestrates routing, fallback, health |
| `ProviderRegistry` | `packages/agent-core/src/providers/provider-registry.ts` | Provider lookup, registration |
| `ProviderHealthTracker` | `packages/agent-core/src/providers/provider-health.ts` | Cooldown state machine, failure counting |
| `BYOKInjector` | `packages/agent-core/src/providers/byok-injector.ts` | Vault decryption, key masking |

## Error Handling

All router operations return `ProviderClientResult<T>` — never throw. Error codes:

| Code | Meaning | Retryable |
|------|---------|-----------|
| `PROVIDER_NOT_FOUND` | Agent's providerId doesn't match any registered provider | No |
| `ALL_PROVIDERS_FAILED` | Every provider in fallback chain failed | No |
| `VAULT_LOCKED` | All BYOK providers need vault, vault is locked | No |
| `NO_PROVIDERS_AVAILABLE` | No enabled providers in registry | No |

## Health State Transitions

```
healthy ──[permanent failure]──> degraded (count++)
degraded ──[count >= 3]──> cooldown (level++, expires = now + 60*2^(level-1) s, cap 600s)
cooldown ──[expires + request]──> degraded (re-attempt)
cooldown ──[success]──> healthy (reset all counters)
cooldown ──[failure]──> cooldown (level++, extend expiry)
```

## BYOK Key Lifecycle

1. Router receives request for a custom provider
2. `BYOKInjector.resolveProviderClient(client, byokKey)` called
3. Vault decrypted (AES-GCM) → key in memory only
4. Key available for provider use during this request
5. Provider executes request
6. Key reference discarded (no cache, no persistence)
7. If vault locked → skip provider, log warning, continue chain

## Testing

```bash
# Unit tests
pnpm --filter @myboteam/agent-core test -- --reporter=verbose model-router
pnpm --filter @myboteam/agent-core test -- --reporter=verbose provider-health
pnpm --filter @myboteam/agent-core test -- --reporter=verbose byok-injector

# All router tests
pnpm --filter @myboteam/agent-core test -- --reporter=verbose router
```
