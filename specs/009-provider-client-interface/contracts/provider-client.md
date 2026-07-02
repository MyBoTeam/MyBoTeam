# ProviderClient Interface Contract

**Version**: 1.0.0
**Date**: 2026-07-02
**Feature**: M4-1 ProviderClient Interface

## Contract Overview

This contract defines the interface that all LLM provider implementations must satisfy. Implementations must pass all contract tests defined in `packages/types/tests/contract/provider-client.contract.test.ts`.

## Interface Methods

### chatCompletion(request: ChatRequest): Promise<ChatResponse>

**Purpose**: Send a chat completion request and receive a complete response.

**Requirements**:
- MUST accept a valid ChatRequest object
- MUST return a Promise resolving to a ChatResponse
- MUST reject with ProviderError on failure
- MUST support optional timeout parameter (default: 120000ms)
- MUST NOT throw untyped errors

### streamChat(request: ChatRequest): AsyncIterable<StreamingChunk>

**Purpose**: Send a chat completion request and receive a streaming response.

**Requirements**:
- MUST accept a valid ChatRequest object
- MUST return an AsyncIterable of StreamingChunk
- MUST yield textDelta for text content
- MUST yield toolCallDelta for tool call content
- MUST yield a final chunk with finishReason
- MUST clean up connection when caller breaks iteration
- MUST NOT throw untyped errors

### listModels(): Promise<ModelInfo[]>

**Purpose**: List available models from the provider.

**Requirements**:
- MUST return a Promise resolving to an array of ModelInfo
- MUST return empty array if no models available
- MUST NOT throw on empty model list
- SHOULD include contextWindow when available
- SHOULD include capabilities when available

## Type Contracts

### ChatRequest

```typescript
{
  messages: ChatMessage[];      // Required, non-empty
  model: string;                // Required, non-empty
  tools?: ToolDefinition[];     // Optional
  timeout?: number;             // Optional, positive integer
}
```

### ChatMessage

```typescript
{
  role: 'system' | 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];       // assistant messages only
  toolCallId?: string;          // tool messages only
}
```

### ChatResponse

```typescript
{
  text: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### StreamingChunk

```typescript
{
  textDelta?: string;
  toolCallDelta?: {
    index: number;
    name?: string;
    argumentsDelta?: string;
  };
  finishReason?: 'stop' | 'tool_calls' | 'length';
}
```

### ToolDefinition

```typescript
{
  name: string;
  description: string;
  parameters: JSONSchema;
}
```

### ToolCall

```typescript
{
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}
```

### ModelInfo

```typescript
{
  id: string;
  displayName: string;
  contextWindow?: number;
  capabilities?: {
    tools?: boolean;
    vision?: boolean;
  };
}
```

### ProviderError

```typescript
| { category: 'auth'; message: string }
| { category: 'rate_limit'; message: string; retryAfter?: number }
| { category: 'network'; message: string; cause?: Error }
| { category: 'provider'; message: string; statusCode: number; providerError?: unknown }
```

## Validation Rules

1. All Zod schemas MUST validate correctly
2. Invalid inputs MUST produce descriptive validation errors
3. Error types MUST follow the discriminated union pattern
4. Streaming MUST yield chunks in order
5. Tool call arguments MUST be valid JSON
