# Interface Contract: LocalProviderClient

**Feature**: 010-local-llm-provider  
**Date**: 2026-07-02  
**Status**: Complete

## Overview

This contract defines the interface for local LLM provider implementations (Ollama, LMStudio) that implement the ProviderClient interface.

## ProviderClient Interface

```typescript
interface ProviderClient {
  chatCompletion(request: ChatRequest): Promise<ChatResponse>;
  streamChat(request: ChatRequest): AsyncIterable<StreamingChunk>;
  listModels(): Promise<ModelInfo[]>;
}
```

## Contract Requirements

### chatCompletion

**Request**:
```typescript
{
  model: string;           // Model identifier (e.g., "llama3", "mistral")
  messages: ChatMessage[]; // Array of messages with role and content
  tools?: ToolDefinition[];// Optional tool definitions
  timeout?: number;        // Optional timeout in ms (default: 120000)
  options?: Record<string, unknown>; // Provider-specific options
}
```

**Response**:
```typescript
{
  message: {
    role: 'assistant';
    content: string;       // Generated response text
    timestamp: string;     // ISO 8601 timestamp
  };
  toolCalls?: ToolCall[];  // Optional tool invocations
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

**Error Cases**:
- `401 Unauthorized` → ProviderError category: 'auth'
- `429 Too Many Requests` → ProviderError category: 'rate_limit'
- `408 Request Timeout` → ProviderError category: 'network'
- `500+ Server Error` → ProviderError category: 'provider'

### streamChat

**Request**: Same as chatCompletion

**Response**: AsyncIterable of StreamingChunk
```typescript
{
  content?: string;        // Text content chunk
  toolCall?: {             // Optional tool call delta
    id: string;
    name: string;
    argumentsDelta: string;
  };
  finishReason?: 'stop' | 'tool_call' | 'length' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}
```

**Behavior**:
- Yields chunks as they arrive from the provider
- Final chunk includes `finishReason`
- Caller can break iteration early for cancellation
- Underlying connection is cleaned up on break

### listModels

**Request**: None

**Response**: Array of ModelInfo
```typescript
{
  id: string;              // Model identifier
  name: string;            // Display name
  provider: string;        // Provider name (e.g., "ollama")
  contextWindow?: number;  // Maximum context window
  capabilities?: {
    tools: boolean;        // Supports tool calling
    vision: boolean;       // Supports image inputs
    streaming: boolean;    // Supports streaming
  };
}
```

**Error Cases**:
- Network errors → ProviderError category: 'network'
- Provider unavailable → ProviderError category: 'provider'

## Provider-Specific Contracts

### Ollama Provider

**Endpoint**: `http://{host}:11434/v1/`

**Authentication**: Optional API key via `Authorization: Bearer {apiKey}` header

**Model Format**:
- Model ID: Ollama model name (e.g., "llama3", "mistral")
- Context window: Derived from model metadata
- Capabilities: Auto-detected from model info

**Streaming Format**: Server-Sent Events (SSE)
```
data: {"id":"...","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}

data: [DONE]
```

### LMStudio Provider

**Endpoint**: `http://{host}:1234/v1/`

**Authentication**: Optional API key via `Authorization: Bearer {apiKey}` header

**Model Format**:
- Model ID: LMStudio model identifier
- Context window: Derived from model metadata
- Capabilities: Auto-detected from model info

**Streaming Format**: Server-Sent Events (SSE)
```
data: {"id":"...","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}

data: [DONE]
```

## Validation Requirements

### Request Validation

1. Validate `model` is non-empty string
2. Validate `messages` array is non-empty
3. Validate each message has valid `role` and non-empty `content`
4. Validate `timeout` is positive if provided

### Response Validation

1. Validate response matches ChatResponse schema
2. Validate `message.role` is 'assistant'
3. Validate `message.content` is string
4. Validate `usage` fields are non-negative if present

### Error Validation

1. Validate error matches ProviderError schema
2. Validate `category` is valid ErrorCategory
3. Validate `code` is non-empty string
4. Validate `message` is non-empty string

## Testing Requirements

### Contract Tests

Each provider implementation must pass these contract tests:

1. **chatCompletion**: Valid request returns valid response
2. **chatCompletion**: Invalid model returns provider error
3. **streamChat**: Valid request yields streaming chunks
4. **streamChat**: Early break cleans up connection
5. **listModels**: Returns array of ModelInfo
6. **listModels**: Empty result returns empty array
7. **Error Handling**: Network error returns ProviderError
8. **Error Handling**: Auth error returns ProviderError with category 'auth'
9. **Error Handling**: Rate limit error returns ProviderError with category 'rate_limit'

### Mock Provider

A mock provider implementation is required for contract testing:

```typescript
class MockProvider implements ProviderClient {
  chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    // Return deterministic response based on request
  }
  
  streamChat(request: ChatRequest): AsyncIterable<StreamingChunk> {
    // Yield deterministic chunks based on request
  }
  
  listModels(): Promise<ModelInfo[]> {
    // Return fixed model list
  }
}
```
