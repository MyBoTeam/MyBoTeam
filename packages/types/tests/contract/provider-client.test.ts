import { describe, expect, it } from 'vitest';
import type { ChatRequest, ChatResponse } from '../../src/chat.js';
import type { ModelInfo } from '../../src/models.js';
import type { ProviderClient, ProviderClientResult } from '../../src/provider-client.js';
import type { StreamingChunk } from '../../src/streaming.js';

describe('ProviderClient interface', () => {
  function createMockClient(): ProviderClient {
    return {
      async chatCompletion(_request: ChatRequest): Promise<ChatResponse> {
        return {
          message: {
            role: 'assistant',
            content: 'Hello!',
            timestamp: new Date().toISOString(),
          },
          usage: {
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
          },
        };
      },
      async *streamChat(_request: ChatRequest): AsyncIterable<StreamingChunk> {
        yield { content: 'Hello' };
        yield { content: ', ' };
        yield { content: 'world!' };
        yield { finishReason: 'stop' };
      },
      async listModels(): Promise<ModelInfo[]> {
        return [
          {
            id: 'claude-sonnet-4-20250514',
            name: 'Claude Sonnet 4',
            provider: 'anthropic',
            contextWindow: 200_000,
            capabilities: { tools: true, vision: true, streaming: true },
          },
        ];
      },
    };
  }

  it('implements chatCompletion method', async () => {
    const client = createMockClient();
    const request: ChatRequest = {
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'Hi' }],
    };
    const response = await client.chatCompletion(request);
    expect(response.message.role).toBe('assistant');
    expect(response.message.content).toBe('Hello!');
    expect(response.usage?.totalTokens).toBe(15);
  });

  it('implements streamChat method', async () => {
    const client = createMockClient();
    const request: ChatRequest = {
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'Hi' }],
    };
    const chunks: StreamingChunk[] = [];
    for await (const chunk of client.streamChat(request)) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(4);
    expect(chunks[0].content).toBe('Hello');
    expect(chunks[3].finishReason).toBe('stop');
  });

  it('implements listModels method', async () => {
    const client = createMockClient();
    const models = await client.listModels();
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('claude-sonnet-4-20250514');
    expect(models[0].capabilities.tools).toBe(true);
  });
});

describe('ProviderClientResult type', () => {
  it('can represent success', () => {
    const result: ProviderClientResult<string> = { ok: true, value: 'data' };
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('data');
    }
  });

  it('can represent error', () => {
    const result: ProviderClientResult<string> = {
      ok: false,
      error: {
        category: 'auth',
        code: 'INVALID_KEY',
        message: 'Invalid API key',
        retryable: false,
      },
    };
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.category).toBe('auth');
    }
  });
});
