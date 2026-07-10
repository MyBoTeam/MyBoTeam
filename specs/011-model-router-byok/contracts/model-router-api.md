# Contract: ModelRouter Public API

## ModelRouter Interface

```typescript
interface ModelRouter {
  /**
   * Route a chat completion request through the provider fallback chain.
   * Returns ProviderClientResult with the response or a typed error.
   */
  chatCompletion(
    agentConfig: AgentConfig,
    request: ChatRequest
  ): Promise<ProviderClientResult<ChatResponse>>;

  /**
   * Route a streaming chat request through the provider fallback chain.
   * Returns ProviderClientResult with the async iterable or a typed error.
   */
  streamChat(
    agentConfig: AgentConfig,
    request: ChatRequest
  ): Promise<ProviderClientResult<AsyncIterable<StreamingChunk>>>;

  /**
   * Get health status for all registered providers.
   */
  getHealthStatus(): ProviderHealthStatusResponse[];
}
```

## ProviderHealthStatusResponse

```typescript
interface ProviderHealthStatusResponse {
  providerId: string;
  providerName: string;
  state: 'healthy' | 'degraded' | 'cooldown';
  consecutiveFailures: number;
  cooldownExpiresAt: string | null;  // ISO 8601
  lastFailureReason: string | null;
  lastSuccessAt: string | null;      // ISO 8601
}
```

## ProviderRegistry Interface

```typescript
interface ProviderRegistry {
  register(providerId: string, client: ProviderClient): void;
  unregister(providerId: string): void;
  getProvider(providerId: string): ProviderClient | undefined;
  listAll(): Array<{ id: string; client: ProviderClient; type: ProviderType }>;
  listByType(type: ProviderType): Array<{ id: string; client: ProviderClient }>;
}
```

## ProviderHealthTracker Interface

```typescript
interface ProviderHealthTracker {
  getState(providerId: string): ProviderHealthState;
  recordSuccess(providerId: string): void;
  recordFailure(providerId: string, reason: string, isTransient: boolean): void;
  isAvailable(providerId: string): boolean;
  getAllStates(): Map<string, ProviderHealthState>;
}
```

## BYOKInjector Interface

```typescript
interface BYOKInjector {
  /**
   * Inject BYOK key into provider config from vault.
   * Returns ok with updated config, or error if vault locked / key not found.
   */
  inject(providerConfig: ProviderConfig, providerId: string): Promise<ProviderClientResult<ProviderConfig>>;

  /**
   * Mask an API key for display (**** + last 4 chars).
   */
  maskKey(key: string): string;
}
```

## Error Codes

| Code | HTTP-like | Description |
|------|-----------|-------------|
| `PROVIDER_NOT_FOUND` | 404 | Agent's providerId not in registry |
| `ALL_PROVIDERS_FAILED` | 503 | Every provider in chain failed |
| `VAULT_LOCKED` | 503 | Vault locked, cannot decrypt BYOK keys |
| `NO_PROVIDERS_AVAILABLE` | 503 | No enabled providers registered |

## Usage Example

```typescript
// Initialize
const registry = new ProviderRegistry();
registry.register('openai-uuid', openaiProvider);
registry.register('anthropic-uuid', anthropicProvider);

const healthTracker = new ProviderHealthTracker();
const byokInjector = new BYOKInjector(vaultService);
const router = new ModelRouter(registry, healthTracker, byokInjector);

// Route a request
const agentConfig = {
  id: 'agent-1',
  providerId: 'openai-uuid',
  fallbackProviderIds: ['anthropic-uuid'],
  model: 'gpt-4o',
  // ... other fields
};

const result = await router.chatCompletion(agentConfig, {
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
  timeout: 120000,
});

if (result.ok) {
  console.log(result.value.message.content);
} else {
  console.error(`[${result.error.code}] ${result.error.message}`);
}
```
