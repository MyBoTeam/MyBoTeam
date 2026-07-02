# Quickstart: ProviderClient Interface

**Date**: 2026-07-02
**Feature**: M4-1 ProviderClient Interface

## Overview

The ProviderClient interface defines the contract for LLM provider communication. All provider implementations (OpenAI, Anthropic, Ollama) must implement this interface.

## Installation

The types are exported from `@myboteam/types`:

```typescript
import type {
  ProviderClient,
  ChatRequest,
  ChatResponse,
  StreamingChunk,
  ModelInfo,
  ProviderError,
} from '@myboteam/types';
```

## Basic Usage

### Chat Completion

```typescript
const response = await client.chatCompletion({
  messages: [
    { role: 'user', content: 'What is the capital of France?' }
  ],
  model: 'gpt-4o',
});

console.log(response.text); // "The capital of France is Paris."
```

### Streaming

```typescript
const stream = client.streamChat({
  messages: [
    { role: 'user', content: 'Tell me a story' }
  ],
  model: 'claude-sonnet-4-20250514',
});

for await (const chunk of stream) {
  if (chunk.textDelta) {
    process.stdout.write(chunk.textDelta);
  }
}
```

### Tool Calling

```typescript
const response = await client.chatCompletion({
  messages: [
    { role: 'user', content: 'What is the weather in Tokyo?' }
  ],
  model: 'gpt-4o',
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' }
        },
        required: ['location']
      }
    }
  ],
});

if (response.toolCalls) {
  for (const toolCall of response.toolCalls) {
    // Execute tool and return result
    const result = await executeTool(toolCall.name, toolCall.arguments);
    // Continue conversation with tool result
  }
}
```

### Model Listing

```typescript
const models = await client.listModels();

models.forEach(model => {
  console.log(`${model.id}: ${model.displayName}`);
  if (model.capabilities?.tools) {
    console.log('  Supports tool calling');
  }
});
```

### Error Handling

```typescript
import { ProviderError } from '@myboteam/types';

try {
  await client.chatCompletion(request);
} catch (error) {
  if (error instanceof Error && 'category' in error) {
    const providerError = error as ProviderError;
    switch (providerError.category) {
      case 'auth':
        // Invalid API key
        break;
      case 'rate_limit':
        // Wait and retry
        if (providerError.retryAfter) {
          await sleep(providerError.retryAfter);
        }
        break;
      case 'network':
        // Network issue
        break;
      case 'provider':
        // Provider-specific error
        break;
    }
  }
}
```

## Implementation Guide

To implement a new provider:

1. Import the interface: `import type { ProviderClient } from '@myboteam/types';`
2. Implement all three methods: `chatCompletion`, `streamChat`, `listModels`
3. Use Zod schemas for runtime validation of API responses
4. Map provider-specific errors to the `ProviderError` discriminated union
5. Run contract tests: `pnpm test --filter @myboteam/types`

## Contract Tests

Contract tests verify that any ProviderClient implementation satisfies the interface contract:

```bash
pnpm test --filter @myboteam/types -- --testPathPattern=contract
```

The contract tests verify:
- All required methods exist with correct signatures
- Return types match the defined schemas
- Error types follow the discriminated union pattern
- AsyncIterable streaming works correctly
