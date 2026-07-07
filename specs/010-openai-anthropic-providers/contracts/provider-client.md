# Interface Contract: ProviderClient

**Feature**: MAO-153 | **Date**: 2026-07-02

## Overview

Both OpenAI and Anthropic providers MUST satisfy the ProviderClient interface defined in MAO-152. This contract specifies the behavioral requirements beyond type compliance.

## ProviderClient Interface Contract

### Method: chatCompletion

**Signature**: `(request: ChatRequest) => Promise<ChatResponse>`

**Behavioral Requirements**:

1. **Request Validation**: MUST validate ChatRequest before sending to API
   - Reject empty messages array
   - Reject empty model string
   - Apply default timeout (120s) if not specified

2. **Response Mapping**: MUST map provider response to ChatResponse format
   - Extract assistant message content
   - Extract tool calls if present
   - Map usage statistics

3. **Error Handling**: MUST return ProviderError for all failures
   - Map HTTP status to error category
   - Include provider-specific error message
   - Set retryable flag appropriately

4. **Timeout**: MUST respect timeout parameter
   - Use AbortSignal for cancellation
   - Return network error on timeout

**Contract Tests**:

```typescript
// Given a valid ChatRequest
// When chatCompletion is called
// Then it returns a ChatResponse with:
//   - message.role === 'assistant'
//   - message.content is a string
//   - message.timestamp is ISO-8601

// Given a ChatRequest with empty messages
// When chatCompletion is called
// Then it throws a validation error

// Given an invalid API key
// When chatCompletion is called
// Then it returns ProviderError with category 'auth'
```

---

### Method: streamChat

**Signature**: `(request: ChatRequest) => AsyncIterable<StreamingChunk>`

**Behavioral Requirements**:

1. **Streaming**: MUST return an AsyncIterable of StreamingChunks
   - Yield content chunks as they arrive
   - Yield tool call deltas incrementally
   - Yield finish reason when complete

2. **Cancellation**: MUST support early termination
   - Caller can break out of iteration
   - Underlying connection must be cleaned up

3. **Error Handling**: MUST yield error chunks or throw ProviderError
   - Network errors: throw ProviderError
   - Provider errors: yield error chunk with finishReason='error'

4. **Time-to-First-Chunk**: MUST yield first chunk within 100ms under normal conditions

**Contract Tests**:

```typescript
// Given a valid ChatRequest
// When streamChat is called
// Then it returns an AsyncIterable that:
//   - Yields StreamingChunk objects
//   - Each chunk has optional content string
//   - Final chunk has finishReason

// Given a valid ChatRequest with tools
// When streamChat is called
// Then it yields tool call deltas that:
//   - Have matching tool call IDs
//   - Contain incremental argument JSON

// Given a streaming request
// When the caller breaks out of iteration
// Then the underlying connection is cleaned up
```

---

### Method: listModels

**Signature**: `() => Promise<ModelInfo[]>`

**Behavioral Requirements**:

1. **Response Mapping**: MUST return ModelInfo array
   - Include id, name, provider fields
   - Include contextWindow if available
   - Include capabilities if available

2. **Error Handling**: MUST return empty array on failure
   - Do not throw on provider errors
   - Log error for debugging

3. **Caching**: MAY cache results for reasonable duration
   - Cache should respect provider cache headers

**Contract Tests**:

```typescript
// Given a configured provider
// When listModels is called
// Then it returns an array of ModelInfo objects
//   - Each has id, name, provider fields
//   - provider matches the configured provider

// Given a provider with no accessible models
// When listModels is called
// Then it returns an empty array
```

---

### Method: healthCheck

**Signature**: `() => Promise<ProviderHealth>`

**Behavioral Requirements**:

1. **Connectivity Check**: MUST verify provider connectivity
   - Use lightweight API call (listModels or similar)
   - Measure response latency

2. **Response**: MUST return ProviderHealth object
   - healthy: true if API responds successfully
   - latency: response time in ms
   - timestamp: ISO-8601 timestamp

3. **Timeout**: MUST complete within 5 seconds
   - Return unhealthy if timeout exceeded

**Contract Tests**:

```typescript
// Given a configured provider with valid API key
// When healthCheck is called
// Then it returns ProviderHealth with:
//   - healthy === true
//   - latency > 0
//   - timestamp is ISO-8601

// Given a configured provider with invalid API key
// When healthCheck is called
// Then it returns ProviderHealth with:
//   - healthy === false
//   - error contains error message
```

---

## Provider-Specific Contracts

### OpenAI Provider

**Additional Requirements**:

1. **Organization ID**: MUST pass organizationId in headers if configured
2. **Model Detection**: MUST detect OpenAI models by absence of "claude" in model ID
3. **Tool Call Format**: MUST handle OpenAI's `delta.tool_calls` format
4. **Streaming Format**: MUST handle OpenAI's SSE format with `data: ` prefix

### Anthropic Provider

**Additional Requirements**:

1. **API Version**: MUST set `anthropic-version: 2023-06-01` header
2. **Model Detection**: MUST detect Anthropic models by presence of "claude" in model ID
3. **Tool Call Format**: MUST handle Anthropic's `content_block_start` / `content_block_delta` format
4. **Max Tokens**: MUST include `max_tokens` parameter (default: 4096)

## Compliance Verification

Both providers MUST pass all contract tests defined in:
- `packages/agent-core/tests/contract/openai-provider.contract.test.ts`
- `packages/agent-core/tests/contract/anthropic-provider.contract.test.ts`

Contract tests verify interface compliance without requiring actual API calls (mocked responses).
