import type { ChatRequest, ProviderClient, StreamingChunk } from '@myboteam/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreate = vi.fn();
const mockModelsList = vi.fn();
const mockStreamFn = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate, stream: mockStreamFn };
      models = { list: mockModelsList };
    },
  };
});

const { AnthropicProvider } = await import('../../src/providers/anthropic-provider');

describe('Anthropic Provider Contract', () => {
  let provider: ProviderClient;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new AnthropicProvider({ apiKey: 'test-key' });
    mockModelsList.mockResolvedValue({ data: [] });
  });

  describe('ProviderClient interface compliance', () => {
    it('should implement chatCompletion method', () => {
      expect(typeof provider.chatCompletion).toBe('function');
    });

    it('should implement streamChat method', () => {
      expect(typeof provider.streamChat).toBe('function');
    });

    it('should implement listModels method', () => {
      expect(typeof provider.listModels).toBe('function');
    });
  });

  describe('chatCompletion contract', () => {
    it('should accept ChatRequest and return ChatResponse', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello!' }],
        model: 'claude-sonnet-4-20250514',
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const request: ChatRequest = {
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const result = await provider.chatCompletion(request);

      expect(result).toHaveProperty('message');
      expect(result.message.content).toBe('Hello!');
      expect(result.message.role).toBe('assistant');
      expect(result).toHaveProperty('usage');
      expect(result.usage).toHaveProperty('promptTokens');
      expect(result.usage).toHaveProperty('completionTokens');
    });

    it('should handle tool definitions in request', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'tool_use', id: 'call_123', name: 'get_weather', input: { location: 'NYC' } },
        ],
        model: 'claude-sonnet-4-20250514',
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const request: ChatRequest = {
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'What is the weather?' }],
        tools: [
          {
            name: 'get_weather',
            description: 'Get weather',
            parameters: { type: 'object', properties: { location: { type: 'string' } } },
          },
        ],
      };

      const result = await provider.chatCompletion(request);

      expect(result.toolCalls).toBeDefined();
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls?.[0].name).toBe('get_weather');
    });
  });

  describe('streamChat contract', () => {
    it('should return AsyncIterable of StreamingChunk', async () => {
      const mockStreamIter = {
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'Hello' },
          };
          yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '!' } };
          yield { type: 'message_stop' };
        },
      };
      mockStreamFn.mockReturnValue(mockStreamIter);

      const stream = provider.streamChat({
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const chunks: StreamingChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toBe('Hello');
      expect(chunks[0].finishReason).toBeUndefined();
      expect(chunks[1].content).toBe('!');
      expect(chunks[1].finishReason).toBeUndefined();
      expect(chunks[2].finishReason).toBe('stop');
    });
  });

  describe('listModels contract', () => {
    it('should return array of ModelInfo', async () => {
      mockModelsList.mockResolvedValue({
        data: [
          { id: 'claude-sonnet-4-20250514', display_name: 'Claude Sonnet' },
          { id: 'claude-opus-4-20250514', display_name: 'Claude Opus' },
        ],
      });

      const result = await provider.listModels();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('capabilities');
    });

    it('should throw on error', async () => {
      mockModelsList.mockRejectedValue(new Error('Network error'));

      await expect(provider.listModels()).rejects.toThrow();
    });
  });
});
