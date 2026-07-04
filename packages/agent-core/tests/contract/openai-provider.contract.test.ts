import type { ChatRequest, ProviderClient, StreamingChunk } from '@myboteam/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreate = vi.fn();
const mockModelsList = vi.fn();

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = { completions: { create: mockCreate } };
      models = { list: mockModelsList };
    },
  };
});

const { OpenAIProvider } = await import('../../src/providers/openai-provider');

describe('OpenAI Provider Contract', () => {
  let provider: ProviderClient;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider({ apiKey: 'test-key' });
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
        choices: [{ message: { content: 'Hello!', role: 'assistant' } }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      });

      const request: ChatRequest = {
        model: 'gpt-4o',
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
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call_123',
                  function: { name: 'get_weather', arguments: '{"location":"NYC"}' },
                },
              ],
            },
          },
        ],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      });

      const request: ChatRequest = {
        model: 'gpt-4o',
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
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Hello' }, finish_reason: null }] };
          yield { choices: [{ delta: { content: '!' }, finish_reason: 'stop' }] };
        },
      };
      mockCreate.mockResolvedValue(mockStream);

      const stream = provider.streamChat({
        model: 'gpt-4o',
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
        data: [{ id: 'gpt-4o' }, { id: 'gpt-4' }],
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
