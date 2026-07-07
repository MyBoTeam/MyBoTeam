# Quickstart: OpenAI + Anthropic Providers

**Feature**: MAO-153 | **Date**: 2026-07-02

## Overview

This feature implements OpenAI and Anthropic provider clients for LLM integration in the MyBoteam daemon. Both providers satisfy the ProviderClient interface from MAO-152.

## Prerequisites

- Node.js 18+ (project standard)
- pnpm package manager
- API keys for OpenAI and/or Anthropic

## Installation

```bash
# Install dependencies
pnpm install

# Add SDK packages (if not already present)
pnpm add openai @anthropic-ai/sdk
```

## Quick Start

### 1. Initialize Provider

```typescript
import { OpenAIProvider } from '@myboteam/agent-core/providers';
import { AnthropicProvider } from '@myboteam/agent-core/providers';

// OpenAI
const openai = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4o',
});

// Anthropic
const anthropic = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultModel: 'claude-sonnet-4-20250514',
});
```

### 2. Chat Completion

```typescript
const response = await openai.chatCompletion({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'Hello, world!' }
  ],
});

console.log(response.message.content);
// => "Hello! How can I help you today?"
```

### 3. Streaming

```typescript
const stream = openai.streamChat({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'Tell me a story' }
  ],
});

for await (const chunk of stream) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
}
```

### 4. Tool Calling

```typescript
const response = await openai.chatCompletion({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'What is the weather in NYC?' }
  ],
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather',
      parameters: {
        location: { type: 'string', description: 'City name', required: true }
      }
    }
  ],
});

if (response.toolCalls) {
  for (const toolCall of response.toolCalls) {
    console.log(`Tool: ${toolCall.name}`);
    console.log(`Args:`, toolCall.arguments);
  }
}
```

### 5. Health Check

```typescript
const health = await openai.healthCheck();
console.log(`Provider healthy: ${health.healthy}`);
console.log(`Latency: ${health.latency}ms`);
```

### 6. List Models

```typescript
const models = await openai.listModels();
for (const model of models) {
  console.log(`${model.id}: ${model.name}`);
}
```

## Configuration Options

```typescript
const provider = new OpenAIProvider({
  apiKey: 'sk-...',                    // Required
  baseUrl: 'https://api.openai.com',  // Optional (default: OpenAI endpoint)
  defaultModel: 'gpt-4o',             // Optional (default: provider default)
  organizationId: 'org-...',          // Optional (OpenAI only)
  customHeaders: { 'X-Custom': 'value' }, // Optional
  proxy: { host: 'proxy.example.com', port: 8080 }, // Optional
  retry: { maxAttempts: 3, delay: 1000, backoff: 'exponential' }, // Optional
  maxConcurrent: 10,                  // Optional (default: 10)
});
```

## Error Handling

```typescript
import { ProviderError } from '@myboteam/types';

try {
  const response = await provider.chatCompletion(request);
} catch (error) {
  if (isProviderError(error)) {
    switch (error.category) {
      case 'auth':
        console.error('Invalid API key');
        break;
      case 'rate_limit':
        console.error('Rate limited, retry after:', error.retryable);
        break;
      case 'network':
        console.error('Network error:', error.message);
        break;
      case 'provider':
        console.error('Provider error:', error.providerMessage);
        break;
    }
  }
}
```

## Testing

```bash
# Run unit tests
pnpm test --filter @myboteam/agent-core -- --testPathPattern=unit

# Run contract tests
pnpm test --filter @myboteam/agent-core -- --testPathPattern=contract

# Run all provider tests
pnpm test --filter @myboteam/agent-core -- --testPathPattern=providers
```

## Next Steps

- [ ] Review `data-model.md` for detailed entity definitions
- [ ] Review `contracts/provider-client.md` for interface contracts
- [ ] Run `/spec.tasks` to generate implementation tasks
