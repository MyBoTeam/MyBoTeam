import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '../../src/providers/provider-config';

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

function makeConfig(overrides?: Partial<ProviderConfig>): ProviderConfig {
  return { apiKey: 'test-key', ...overrides };
}

describe('OpenAI Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModelsList.mockResolvedValue({ data: [] });
  });

  describe('chatCompletion', () => {
    it('should return ChatResponse with content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello!', role: 'assistant' } }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.chatCompletion({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
      });

      expect(result.message.content).toBe('Hello!');
      expect(result.message.role).toBe('assistant');
      expect(result.usage?.promptTokens).toBe(10);
      expect(result.usage?.completionTokens).toBe(5);
    });

    it('should extract tool calls from response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  function: { name: 'get_weather', arguments: '{"location":"NYC"}' },
                },
              ],
            },
          },
        ],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.chatCompletion({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Weather?' }],
        tools: [
          {
            name: 'get_weather',
            description: 'Get weather',
            parameters: { type: 'object', properties: {} },
          },
        ],
      });

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls?.[0].name).toBe('get_weather');
      expect(result.toolCalls?.[0].arguments).toEqual({ location: 'NYC' });
    });

    it('should throw ProviderError on auth failure', async () => {
      const authError = Object.assign(new Error('Invalid API key'), {
        status: 401,
        name: 'AuthenticationError',
      });
      mockCreate.mockRejectedValue(authError);

      const provider = new OpenAIProvider(makeConfig());

      await expect(
        provider.chatCompletion({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      ).rejects.toMatchObject({
        category: 'auth',
        retryable: false,
      });
    });

    it('should throw ProviderError on rate limit', async () => {
      const rateLimitError = Object.assign(new Error('Rate limited'), {
        status: 429,
        name: 'RateLimitError',
      });
      mockCreate.mockRejectedValue(rateLimitError);

      const provider = new OpenAIProvider(makeConfig());

      await expect(
        provider.chatCompletion({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      ).rejects.toMatchObject({
        category: 'rate_limit',
        retryable: true,
      });
    });

    it('should throw ProviderError on server error', async () => {
      const serverError = Object.assign(new Error('Server error'), {
        status: 500,
        name: 'InternalServerError',
      });
      mockCreate.mockRejectedValue(serverError);

      const provider = new OpenAIProvider(makeConfig());

      await expect(
        provider.chatCompletion({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      ).rejects.toMatchObject({
        category: 'provider',
        retryable: true,
      });
    });
  });

  describe('streamChat', () => {
    it('should yield streaming chunks', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Hello' }, finish_reason: null }] };
          yield { choices: [{ delta: { content: ' world' }, finish_reason: null }] };
          yield { choices: [{ delta: {}, finish_reason: 'stop' }] };
        },
      };
      mockCreate.mockResolvedValue(mockStream);

      const provider = new OpenAIProvider(makeConfig());
      const chunks = [];
      for await (const chunk of provider.streamChat({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toBe('Hello');
      expect(chunks[1].content).toBe(' world');
      expect(chunks[2].finishReason).toBe('stop');
    });

    it('should aggregate tool calls from streaming chunks', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            choices: [
              {
                delta: {
                  tool_calls: [{ index: 0, id: 'call_1', function: { name: 'fn', arguments: '' } }],
                },
                finish_reason: null,
              },
            ],
          };
          yield {
            choices: [
              {
                delta: { tool_calls: [{ index: 0, function: { arguments: '{"a":' } }] },
                finish_reason: null,
              },
            ],
          };
          yield {
            choices: [
              {
                delta: { tool_calls: [{ index: 0, function: { arguments: '1}' } }] },
                finish_reason: null,
              },
            ],
          };
          yield { choices: [{ delta: {}, finish_reason: 'tool_calls' }] };
        },
      };
      mockCreate.mockResolvedValue(mockStream);

      const provider = new OpenAIProvider(makeConfig());
      const chunks = [];
      for await (const chunk of provider.streamChat({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
      })) {
        chunks.push(chunk);
      }

      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.finishReason).toBe('tool_call');
      expect(lastChunk.toolCall).toBeDefined();
      expect(lastChunk.toolCall?.argumentsDelta).toBe('{"a":1}');
    });

    it('should throw ProviderError on stream init failure', async () => {
      const authError = Object.assign(new Error('Invalid key'), {
        status: 401,
        name: 'AuthenticationError',
      });
      mockCreate.mockRejectedValue(authError);

      const provider = new OpenAIProvider(makeConfig());

      await expect(
        (async () => {
          for await (const _ of provider.streamChat({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: 'Hi' }],
          })) {
            // consume
          }
        })(),
      ).rejects.toMatchObject({
        category: 'auth',
        retryable: false,
      });
    });
  });

  describe('listModels', () => {
    it('should return ModelInfo array', async () => {
      mockModelsList.mockResolvedValue({
        data: [{ id: 'gpt-4o' }, { id: 'gpt-4' }],
      });

      const provider = new OpenAIProvider(makeConfig());
      const models = await provider.listModels();

      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('gpt-4o');
      expect(models[0].capabilities).toEqual({ tools: true, vision: true, streaming: true });
    });

    it('should throw ProviderError on error', async () => {
      mockModelsList.mockRejectedValue(new Error('Network error'));

      const provider = new OpenAIProvider(makeConfig());

      await expect(provider.listModels()).rejects.toMatchObject({
        category: 'provider',
      });
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      mockModelsList.mockResolvedValue({ data: [] });

      const provider = new OpenAIProvider(makeConfig());
      const health = await provider.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy on error', async () => {
      mockModelsList.mockRejectedValue(new Error('Connection refused'));

      const provider = new OpenAIProvider(makeConfig());
      const health = await provider.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Connection refused');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSON in tool call arguments gracefully', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  function: { name: 'fn', arguments: 'not-valid-json' },
                },
              ],
            },
          },
        ],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.chatCompletion({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
      });

      expect(result.toolCalls?.[0].arguments).toEqual({});
    });

    it('should handle empty content in response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null, role: 'assistant' } }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
      });

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.chatCompletion({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
      });

      expect(result.message.content).toBe('');
    });

    it('should handle connection errors as retryable', async () => {
      const connError = Object.assign(new Error('Connection failed'), {
        name: 'APIConnectionError',
      });
      mockCreate.mockRejectedValue(connError);

      const provider = new OpenAIProvider(makeConfig());

      await expect(
        provider.chatCompletion({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      ).rejects.toMatchObject({
        category: 'network',
        retryable: true,
      });
    });

    it('should handle timeout errors as retryable', async () => {
      const timeoutError = Object.assign(new Error('Request timed out'), {
        name: 'APIConnectionTimeoutError',
      });
      mockCreate.mockRejectedValue(timeoutError);

      const provider = new OpenAIProvider(makeConfig());

      await expect(
        provider.chatCompletion({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      ).rejects.toMatchObject({
        category: 'network',
        retryable: true,
      });
    });

    it('should return NOT_FOUND error for non-existent model', async () => {
      const notFoundError = Object.assign(new Error('Model not found'), {
        status: 404,
        name: 'NotFoundError',
      });
      mockCreate.mockRejectedValue(notFoundError);

      const provider = new OpenAIProvider(makeConfig());

      await expect(
        provider.chatCompletion({
          model: 'nonexistent-model',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      ).rejects.toMatchObject({
        category: 'provider',
        code: 'NOT_FOUND',
        retryable: false,
      });
    });

    it('should handle mid-stream errors gracefully', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Hello' }, finish_reason: null }] };
          throw new Error('Stream interrupted');
        },
      };
      mockCreate.mockResolvedValue(mockStream);

      const provider = new OpenAIProvider(makeConfig());
      const chunks: any[] = [];

      await expect(
        (async () => {
          for await (const chunk of provider.streamChat({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: 'Hi' }],
          })) {
            chunks.push(chunk);
          }
        })(),
      ).rejects.toThrow('Stream interrupted');

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Hello');
    });
  });
});
