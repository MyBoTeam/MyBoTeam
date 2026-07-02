import { describe, expect, it } from 'vitest';
import type { ChatRequest } from '../../src/chat.js';
import type { ProviderClient } from '../../src/provider-client.js';
import type { StreamingChunk } from '../../src/streaming.js';

describe('Streaming contract', () => {
  function createStreamingClient(): ProviderClient {
    return {
      async chatCompletion() {
        throw new Error('Not implemented');
      },
      async *streamChat(_request: ChatRequest): AsyncIterable<StreamingChunk> {
        yield { content: 'Hello' };
        yield { content: ', ' };
        yield { content: 'world!' };
        yield { finishReason: 'stop' };
      },
      async listModels() {
        return [];
      },
    };
  }

  it('streamChat returns AsyncIterable', async () => {
    const client = createStreamingClient();
    const stream = client.streamChat({
      model: 'test',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(typeof stream[Symbol.asyncIterator]).toBe('function');
  });

  it('yields chunks sequentially', async () => {
    const client = createStreamingClient();
    const chunks: StreamingChunk[] = [];

    for await (const chunk of client.streamChat({
      model: 'test',
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(4);
    expect(chunks[0].content).toBe('Hello');
    expect(chunks[1].content).toBe(', ');
    expect(chunks[2].content).toBe('world!');
    expect(chunks[3].finishReason).toBe('stop');
  });

  it('handles empty stream', async () => {
    const client: ProviderClient = {
      async chatCompletion() {
        throw new Error('Not implemented');
      },
      async *streamChat(): AsyncIterable<StreamingChunk> {
        yield { finishReason: 'stop' };
      },
      async listModels() {
        return [];
      },
    };

    const chunks: StreamingChunk[] = [];
    for await (const chunk of client.streamChat({
      model: 'test',
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(1);
    expect(chunks[0].finishReason).toBe('stop');
  });

  it('supports tool call deltas', async () => {
    const client: ProviderClient = {
      async chatCompletion() {
        throw new Error('Not implemented');
      },
      async *streamChat(): AsyncIterable<StreamingChunk> {
        yield {
          toolCall: {
            id: 'tc_1',
            name: 'search',
            argumentsDelta: '{"query":',
          },
        };
        yield {
          toolCall: {
            id: 'tc_1',
            name: 'search',
            argumentsDelta: '"test"}',
          },
        };
        yield { finishReason: 'tool_call' };
      },
      async listModels() {
        return [];
      },
    };

    const chunks: StreamingChunk[] = [];
    for await (const chunk of client.streamChat({
      model: 'test',
      messages: [{ role: 'user', content: 'Search for test' }],
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3);
    expect(chunks[0].toolCall?.name).toBe('search');
    expect(chunks[0].toolCall?.argumentsDelta).toBe('{"query":');
    expect(chunks[1].toolCall?.argumentsDelta).toBe('"test"}');
    expect(chunks[2].finishReason).toBe('tool_call');
  });
});
