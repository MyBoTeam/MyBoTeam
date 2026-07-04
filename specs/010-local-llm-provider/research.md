# Research: Local LLM Provider (Ollama/LMStudio)

**Feature**: 010-local-llm-provider  
**Date**: 2026-07-02  
**Status**: Complete

## Research Questions

### RQ-001: Ollama API Compatibility

**Question**: What API endpoints does Ollama expose for chat completion and model listing?

**Decision**: Ollama exposes OpenAI-compatible API at `/v1/chat/completions` and `/v1/models`

**Rationale**: 
- Ollama v0.1.20+ includes OpenAI-compatible API endpoints
- Endpoint format matches OpenAI API structure
- Model listing at `/v1/models` returns standard format

**Alternatives Considered**:
- Native Ollama API (`/api/chat`, `/api/tags`) - Rejected: Not OpenAI-compatible, requires separate implementation
- Custom adapter layer - Rejected: Unnecessary complexity when OpenAI-compatible endpoints exist

**Sources**:
- Ollama documentation: https://ollama.com/library
- OpenAI API specification

### RQ-002: LMStudio API Compatibility

**Question**: What API endpoints does LMStudio expose for chat completion and model listing?

**Decision**: LMStudio exposes OpenAI-compatible API at `/v1/chat/completions` and `/v1/models`

**Rationale**:
- LMStudio server mode exposes OpenAI-compatible API
- Default port is 1234 (configurable in LMStudio settings)
- Model listing at `/v1/models` returns standard format

**Alternatives Considered**:
- LMStudio native API - Rejected: Not documented, OpenAI-compatible is standard
- WebSocket streaming - Rejected: SSE is sufficient for chat streaming

**Sources**:
- LMStudio documentation
- OpenAI API specification

### RQ-003: Streaming Implementation Pattern

**Question**: How should streaming responses be implemented for local providers?

**Decision**: Use Server-Sent Events (SSE) with `fetch` API and async generators

**Rationale**:
- Both Ollama and LMStudio use SSE for streaming
- TypeScript async generators provide clean iteration API
- Matches existing ProviderClient.streamChat signature

**Alternatives Considered**:
- WebSocket streaming - Rejected: Overkill for unidirectional streaming
- Polling - Rejected: High latency, inefficient

**Implementation Pattern**:
```typescript
async function* streamChat(request: ChatRequest): AsyncIterable<StreamingChunk> {
  const response = await fetch(endpoint, { method: 'POST', body: ... });
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    // Parse SSE lines
    yield parseStreamingChunk(chunk);
  }
}
```

### RQ-004: Auto-Discovery Mechanism

**Question**: How should local providers be automatically discovered?

**Decision**: Scan common localhost ports (11434 for Ollama, 1234 for LMStudio) with HTTP health checks

**Rationale**:
- Both providers run on localhost by default
- Port scanning with timeout is reliable for local detection
- Health check endpoint confirms provider availability

**Alternatives Considered**:
- mDNS/Bonjour discovery - Rejected: Requires additional dependencies, not all providers support
- Configuration file scanning - Rejected: Manual configuration is sufficient for MVP
- System service discovery - Rejected: Platform-specific, complex

**Implementation Pattern**:
```typescript
async function discoverProviders(): Promise<DiscoveredProvider[]> {
  const candidates = [
    { type: 'ollama', port: 11434 },
    { type: 'lmstudio', port: 1234 },
  ];
  
  return Promise.all(candidates.map(async (candidate) => {
    try {
      const response = await fetch(`http://localhost:${candidate.port}/v1/models`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        return { ...candidate, available: true };
      }
    } catch {
      return { ...candidate, available: false };
    }
  }));
}
```

### RQ-005: Error Handling Pattern

**Question**: How should local provider errors be mapped to ProviderError types?

**Decision**: Map HTTP status codes and response bodies to ProviderError categories

**Rationale**:
- HTTP status codes provide standard error classification
- Response bodies may contain provider-specific error details
- ProviderError category field enables caller-specific handling

**Mapping**:
| HTTP Status | ProviderError Category | Notes |
|-------------|----------------------|-------|
| 401 | auth | Invalid API key |
| 429 | rate_limit | Include retry-after header |
| 408, 504 | network | Timeout |
| 500, 502, 503 | provider | Server error |
| Other | provider | Default category |

### RQ-006: Configuration Schema

**Question**: What configuration fields are needed for local providers?

**Decision**: Extend existing Provider schema with provider-specific config

**Rationale**:
- Existing Provider schema has generic `config` field
- Local providers need endpoint, optional API key, custom headers
- Keep configuration simple and aligned with existing patterns

**Schema Extension**:
```typescript
interface LocalProviderConfig {
  endpoint: string;           // e.g., "http://localhost:11434"
  apiKey?: string;            // Optional for secured instances
  headers?: Record<string, string>;  // Custom headers
  timeout?: number;           // Request timeout in ms (default: 120000)
}
```

### RQ-007: Observability Integration

**Question**: How should logging and metrics be integrated with existing infrastructure?

**Decision**: Use structured logging with request metadata and emit metrics via existing patterns

**Rationale**:
- Constitution requires observability (Principle V)
- Structured logs enable debugging and performance analysis
- Metrics enable monitoring and alerting

**Logging Pattern**:
```typescript
logger.debug('provider.request', {
  provider: 'ollama',
  model: request.model,
  duration: Date.now() - startTime,
  tokens: response.usage?.totalTokens,
});
```

**Metrics Pattern**:
```typescript
metrics.histogram('provider.request.duration', duration, { provider, model });
metrics.counter('provider.tokens.total', tokens, { provider, model });
```

## Research Summary

| Question | Decision | Confidence |
|----------|----------|------------|
| Ollama API | OpenAI-compatible at /v1/chat/completions | High |
| LMStudio API | OpenAI-compatible at /v1/chat/completions | High |
| Streaming | SSE with async generators | High |
| Auto-discovery | Port scanning with health checks | High |
| Error handling | HTTP status to ProviderError mapping | High |
| Configuration | Extended Provider config schema | High |
| Observability | Structured logs + metrics | High |

## Dependencies Resolved

- ✅ ProviderClient interface exists in `types/src/provider-client.ts`
- ✅ ChatRequest/ChatResponse types exist in `types/src/chat.ts`
- ✅ StreamingChunk type exists in `types/src/streaming.ts`
- ✅ ProviderError type exists in `types/src/errors.ts`
- ✅ ModelInfo type exists in `types/src/models.ts`
- ✅ Provider schema includes 'ollama' type in `types/src/provider.ts`

## Open Questions

None. All research questions resolved.
