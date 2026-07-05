import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '../../src/providers/tools/provider-config';

const mockCreate = vi.fn();
const mockModelsList = vi.fn();
const mockStream = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate, stream: mockStream };
      models = { list: mockModelsList };
    },
  };
});

const { AnthropicProvider } = await import('../../src/providers/anthropic-provider');

function makeConfig(overrides?: Partial<ProviderConfig>): ProviderConfig {
  return { apiKey: 'test-key', ...overrides };
}

describe('Anthropic Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModelsList.mockResolvedValue({ data: [] });
  });

  describe('chatCompletion', () => {
    it('should return ChatResponse with content', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello!' }],
        model: 'claude-sonnet-4-20250514',
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.chatCompletion({
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'Hi' }],
      });

      expect(result.message.content).toBe('Hello!');
      expect(result.message.role).toBe('assistant');
      expect(result.usage?.promptTokens).toBe(10);
      expect(result.usage?.completionTokens).toBe(5);
    });

    it('should extract tool calls from response', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'tool_use', id: 'call_1', name: 'get_weather', input: { location: 'NYC' } },
        ],
        model: 'claude-sonnet-4-20250514',
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.chatCompletion({
        model: 'claude-sonnet-4-20250514',
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

    it('should extract system message separately', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        model: 'claude-sonnet-4-20250514',
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const provider = new AnthropicProvider(makeConfig());
      await provider.chatCompletion({
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'Hi' },
        ],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are helpful',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      );
    });

    it('should concatenate multiple system messages', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        model: 'claude-sonnet-4-20250514',
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const provider = new AnthropicProvider(makeConfig());
      await provider.chatCompletion({
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'system', content: 'Be concise' },
          { role: 'user', content: 'Hi' },
        ],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are helpful\n\nBe concise',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      );
    });

    it('should throw ProviderError on auth failure', async () => {
      const authError = Object.assign(new Error('Invalid key'), {
        status: 401,
        name: 'AuthenticationError',
      });
      mockCreate.mockRejectedValue(authError);

      const provider = new AnthropicProvider(makeConfig());

      await expect(
        provider.chatCompletion({
          model: 'claude-sonnet-4-20250514',
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

      const provider = new AnthropicProvider(makeConfig());

      await expect(
        provider.chatCompletion({
          model: 'claude-sonnet-4-20250514',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      ).rejects.toMatchObject({
        category: 'rate_limit',
        retryable: true,
      });
    });
  });

  describe('streamChat', () => {
    it('should yield streaming chunks', async () => {
      const mockStreamIter = {
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'Hello' },
          };
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: ' world' },
          };
          yield { type: 'message_stop' };
        },
      };
      mockStream.mockReturnValue(mockStreamIter);

      const provider = new AnthropicProvider(makeConfig());
      const chunks = [];
      for await (const chunk of provider.streamChat({
        model: 'claude-sonnet-4-20250514',
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
      const mockStreamIter = {
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'content_block_start',
            index: 0,
            content_block: { type: 'tool_use', id: 'call_1', name: 'fn' },
          };
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'input_json_delta', partial_json: '{"a":' },
          };
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'input_json_delta', partial_json: '1}' },
          };
          yield { type: 'message_stop' };
        },
      };
      mockStream.mockReturnValue(mockStreamIter);

      const provider = new AnthropicProvider(makeConfig());
      const chunks = [];
      for await (const chunk of provider.streamChat({
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'Hi' }],
      })) {
        chunks.push(chunk);
      }

      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.finishReason).toBe('tool_call');
      expect(lastChunk.toolCall).toBeDefined();
      expect(lastChunk.toolCall?.argumentsDelta).toBe('{"a":1}');
    });

    it('should emit all tool calls from parallel tool-use blocks', async () => {
      const mockStreamIter = {
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'content_block_start',
            index: 0,
            content_block: { type: 'tool_use', id: 'call_1', name: 'get_weather' },
          };
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'input_json_delta', partial_json: '{"loc":' },
          };
          yield {
            type: 'content_block_start',
            index: 1,
            content_block: { type: 'tool_use', id: 'call_2', name: 'get_time' },
          };
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'input_json_delta', partial_json: '"NYC"}' },
          };
          yield {
            type: 'content_block_delta',
            index: 1,
            delta: { type: 'input_json_delta', partial_json: '{"tz":"EST"}' },
          };
          yield { type: 'message_stop' };
        },
      };
      mockStream.mockReturnValue(mockStreamIter);

      const provider = new AnthropicProvider(makeConfig());
      const chunks = [];
      for await (const chunk of provider.streamChat({
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'Hi' }],
      })) {
        chunks.push(chunk);
      }

      const toolCallChunks = chunks.filter((c) => c.finishReason === 'tool_call');
      expect(toolCallChunks).toHaveLength(2);
      expect(toolCallChunks[0].toolCall?.id).toBe('call_1');
      expect(toolCallChunks[0].toolCall?.name).toBe('get_weather');
      expect(toolCallChunks[0].toolCall?.argumentsDelta).toBe('{"loc":"NYC"}');
      expect(toolCallChunks[1].toolCall?.id).toBe('call_2');
      expect(toolCallChunks[1].toolCall?.name).toBe('get_time');
      expect(toolCallChunks[1].toolCall?.argumentsDelta).toBe('{"tz":"EST"}');
    });

    it('should throw ProviderError on stream init failure', async () => {
      const authError = Object.assign(new Error('Invalid key'), {
        status: 401,
        name: 'AuthenticationError',
      });
      mockStream.mockImplementation(() => {
        throw authError;
      });

      const provider = new AnthropicProvider(makeConfig());

      await expect(
        (async () => {
          for await (const _ of provider.streamChat({
            model: 'claude-sonnet-4-20250514',
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
        data: [{ id: 'claude-sonnet-4-20250514', display_name: 'Claude Sonnet' }],
      });

      const provider = new AnthropicProvider(makeConfig());
      const models = await provider.listModels();

      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('claude-sonnet-4-20250514');
      expect(models[0].capabilities).toEqual({ tools: true, vision: true, streaming: true });
    });

    it('should throw ProviderError on error', async () => {
      mockModelsList.mockRejectedValue(new Error('Network error'));

      const provider = new AnthropicProvider(makeConfig());

      await expect(provider.listModels()).rejects.toMatchObject({
        category: 'provider',
      });
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      mockModelsList.mockResolvedValue({ data: [] });

      const provider = new AnthropicProvider(makeConfig());
      const health = await provider.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy on error', async () => {
      mockModelsList.mockRejectedValue(new Error('Connection refused'));

      const provider = new AnthropicProvider(makeConfig());
      const health = await provider.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Connection refused');
    });
  });

  describe('edge cases', () => {
    it('should return NOT_FOUND error for non-existent model', async () => {
      const notFoundError = Object.assign(new Error('Model not found'), {
        status: 404,
        name: 'NotFoundError',
      });
      mockCreate.mockRejectedValue(notFoundError);

      const provider = new AnthropicProvider(makeConfig());

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
      const mockStreamIter = {
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'Hello' },
          };
          throw new Error('Stream interrupted');
        },
      };
      mockStream.mockReturnValue(mockStreamIter);

      const provider = new AnthropicProvider(makeConfig());
      const chunks: any[] = [];

      await expect(
        (async () => {
          for await (const chunk of provider.streamChat({
            model: 'claude-sonnet-4-20250514',
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
