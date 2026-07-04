# Research: OpenAI + Anthropic Providers

**Feature**: MAO-153 | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)

## Summary

Research findings for implementing OpenAI and Anthropic provider clients. All NEEDS CLARIFICATION items from Technical Context have been resolved.

## Research Items

### 1. Official SDK Packages

**Decision**: Use `openai` and `@anthropic-ai/sdk` npm packages as specified in FR-003.

**Rationale**: Official SDKs provide:
- Type-safe API access
- Built-in SSE streaming support
- Automatic retry handling
- Proper error classification
- Model listing endpoints

**Alternatives Considered**:
- Direct HTTP fetch (v0.2.0 approach): Rejected due to manual SSE parsing, no type safety
- Third-party wrappers: Rejected due to maintenance risk

**References**:
- OpenAI SDK: https://github.com/openai/openai-node
- Anthropic SDK: https://github.com/anthropics/anthropic-sdk-typescript

---

### 2. SSE Streaming Implementation

**Decision**: Use SDK-provided streaming methods with AsyncIterable wrapper.

**Rationale**: Both SDKs provide native streaming:
- OpenAI: `client.chat.completions.create({ stream: true })`
- Anthropic: `client.messages.stream({})`

**Pattern from v0.2.0** (to adopt):
- Buffer handling for partial chunks
- Text decoder for byte streams
- Graceful iteration break

**Pattern from v0.2.0** (NOT to adopt):
- Manual SSE line parsing (SDK handles this)
- Raw fetch with reader (SDK provides typed streams)

---

### 3. Tool Call Extraction

**Decision**: Extract tool calls from streaming chunks and aggregate into complete ToolCall objects.

**Rationale**: Both providers stream tool calls incrementally:
- OpenAI: `delta.tool_calls` array with name and arguments fragments
- Anthropic: `content_block_start` with tool use, `content_block_delta` with input

**Aggregation Strategy**:
- Accumulate argument fragments until complete
- Parse JSON arguments when tool call is complete
- Handle malformed JSON gracefully (return empty args)

---

### 4. Model Fallback Pattern

**Decision**: Implement three-stage fallback from v0.2.0:
1. Try requested model
2. Try without date suffix (e.g., `claude-sonnet-4-20250514` → `claude-sonnet-4`)
3. Try default fallback model (OpenAI: `gpt-4o`, Anthropic: `claude-sonnet-4-20250514`)

**Rationale**: Preserves backward compatibility with v0.2.0 behavior while using typed errors.

---

### 5. Concurrency Control

**Decision**: Implement semaphore-based concurrency limiter with configurable max (default: 10).

**Rationale**: Prevents overwhelming provider APIs and helps respect rate limits.

**Implementation**:
- Simple semaphore class with acquire/release
- Queue requests when at limit
- Timeout for queue wait (configurable)

---

### 6. Health Check Implementation

**Decision**: Lightweight connectivity check using model listing endpoint.

**Rationale**: 
- Low overhead (single API call)
- Validates API key, network, and provider availability
- Returns boolean for simplicity

**Alternative**: Dedicated health endpoint (not available for all providers)

---

### 7. Metrics Emission

**Decision**: Emit structured metrics via callback or event emitter.

**Rationale**: Allows integration with existing observability infrastructure.

**Metrics**:
- Request duration (histogram)
- Token usage (counter: prompt, completion)
- Error rate (counter by category)
- Streaming time-to-first-chunk (histogram)

---

### 8. Error Mapping

**Decision**: Map HTTP status codes to ProviderError categories:

| HTTP Status | ProviderError Category | Retryable |
|-------------|----------------------|-----------|
| 401 | auth | false |
| 429 | rate_limit | true |
| 500-599 | provider | true |
| Network timeout | network | true |
| 400, 403, 404 | provider | false |

---

## Resolved Unknowns

| Unknown | Resolution |
|---------|------------|
| Language/Version | TypeScript 6.0+ (project standard) |
| Primary Dependencies | `openai`, `@anthropic-ai/sdk`, Zod, Vitest |
| Storage | N/A (stateless providers) |
| Testing | Vitest with contract and unit tests |
| Target Platform | Node.js daemon |
| Project Type | Library (packages/) |
| Performance Goals | < 100ms TTFC, max 10 concurrent |
| Constraints | Biome lint rules, ProviderClient interface |
| Scale/Scope | 2 providers, 14 FRs, 5 user stories |

## Open Questions

None — all technical context items resolved.
