# Data Model: OpenAI + Anthropic Providers

**Feature**: MAO-153 | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)

## Entity Relationship Diagram

```
ProviderConfig ──┬── OpenAIProvider ──── ProviderClient (interface)
                 │
                 └── AnthropicProvider ── ProviderClient (interface)

ProviderConfig ──── ModelFallback ──── ModelInfo

ProviderClient ──── ChatRequest ──── ChatMessage
                 │
                 └── ChatResponse ──── ToolCall

ProviderClient ──── StreamingChunk

ProviderClient ──── ProviderError
```

## Entities

### ProviderConfig

Configuration for provider initialization.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| apiKey | string | Yes | - | API key for authentication |
| baseUrl | string | No | Provider default | Custom API endpoint URL |
| defaultModel | string | No | Provider default | Default model ID for requests |
| organizationId | string | No | - | Organization ID (OpenAI only) |
| customHeaders | Record<string, string> | No | {} | Additional HTTP headers |
| proxy | ProxyConfig | No | - | Proxy configuration |
| retry | RetryConfig | No | { maxAttempts: 3, delay: 1000, backoff: 'exponential' } | Retry configuration |
| maxConcurrent | number | No | 10 | Max concurrent requests |

### RetryConfig

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| maxAttempts | number | No | 3 | Maximum retry attempts |
| delay | number | No | 1000 | Initial delay in ms |
| backoff | 'linear' | 'exponential' | No | 'exponential' | Backoff strategy |

### ProxyConfig

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| host | string | Yes | - | Proxy host |
| port | number | Yes | - | Proxy port |
| auth | { username: string; password: string } | No | - | Proxy authentication |

### ModelInfo

Metadata about an available model.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Model identifier (e.g., "gpt-4o") |
| name | string | Yes | Display name |
| provider | string | Yes | Provider name ("openai" or "anthropic") |
| contextWindow | number | No | Maximum context length |
| capabilities | ModelCapabilities | No | Supported features |

### ModelCapabilities

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| tools | boolean | No | false | Supports tool/function calling |
| vision | boolean | No | false | Supports image inputs |
| streaming | boolean | No | true | Supports streaming responses |

### ModelFallback

Strategy for trying alternative models on failure.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| enabled | boolean | No | true | Enable model fallback |
| defaultModels | Record<string, string> | No | { openai: 'gpt-4o', anthropic: 'claude-sonnet-4-20250514' } | Fallback models per provider |

### ProviderHealth

Health check result.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| healthy | boolean | Yes | Provider connectivity status |
| latency | number | Yes | Response time in ms |
| timestamp | string | Yes | ISO-8601 timestamp |
| error | string | No | Error message if unhealthy |

### ProviderMetrics

Basic metrics for provider usage.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| requestDuration | number | Yes | Request duration in ms |
| promptTokens | number | Yes | Tokens in prompt |
| completionTokens | number | Yes | Tokens in completion |
| totalTokens | number | Yes | Total tokens used |
| errorCategory | string | No | Error category if failed |
| timeToFirstChunk | number | No | Time to first streaming chunk in ms |

## State Transitions

### Provider Lifecycle

```
[Uninitialized] → initialize() → [Ready]
[Ready] → chatCompletion() → [Processing] → [Ready]
[Ready] → streamChat() → [Streaming] → [Ready]
[Ready] → healthCheck() → [Checking] → [Ready]
[Ready] → listModels() → [Querying] → [Ready]
[Processing/Streaming] → error() → [Ready] (with ProviderError)
```

### Request Lifecycle

```
[Pending] → acquire() → [Acquired] → execute() → [Complete/Failed]
[Pending] → acquire() → [Timeout] (if queue wait exceeds limit)
```

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| ProviderConfig | apiKey | Must not be empty |
| ProviderConfig | maxConcurrent | Must be > 0 |
| ChatRequest | model | Must not be empty |
| ChatRequest | messages | Must have at least 1 message |
| ChatRequest | timeout | Must be > 0 |
| ToolDefinition | name | 1-64 characters |
| ToolDefinition | description | 1-1024 characters |
| ProviderError | code | Must not be empty |
| ProviderError | message | Must not be empty |
