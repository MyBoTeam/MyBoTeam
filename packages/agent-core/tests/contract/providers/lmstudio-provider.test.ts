import type { ChatRequest, ProviderClient, StreamingChunk } from '@myboteam/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();

globalThis.fetch = mockFetch as unknown as typeof fetch;

const { LMStudioProvider } = await import('../../../src/services/providers/lmstudio-provider');

describe('LMStudio Provider Contract', () => {
  let provider: ProviderClient;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new LMStudioProvider({
      name: 'test-lmstudio',
      type: 'lmstudio',
      endpoint: 'http://localhost:1234',
      timeout: 30000,
    });
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Hello!', role: 'assistant' } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          }),
      });

      const request: ChatRequest = {
        model: 'mistral-7b',
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: null,
                  role: 'assistant',
                },
                tool_calls: [
                  {
                    id: 'call_123',
                    function: { name: 'get_weather', arguments: '{"location":"NYC"}' },
                  },
                ],
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          }),
      });

      const request: ChatRequest = {
        model: 'mistral-7b',
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
    it('should yield StreamingChunk objects', async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockImplementation(() => {
              const value = chunks.shift();
              if (value === undefined) {
                return Promise.resolve({ done: true, value: undefined });
              }
              return Promise.resolve({ done: false, value: new TextEncoder().encode(value) });
            }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const request: ChatRequest = {
        model: 'mistral-7b',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const result: StreamingChunk[] = [];
      for await (const chunk of provider.streamChat(request)) {
        result.push(chunk);
      }

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('content');
    });
  });

  describe('listModels contract', () => {
    it('should return array of ModelInfo', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { id: 'mistral-7b', object: 'model' },
              { id: 'llama-2-7b', object: 'model' },
            ],
          }),
      });

      const models = await provider.listModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(2);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('name');
      expect(models[0]).toHaveProperty('provider');
    });

    it('should return empty array when no models', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const models = await provider.listModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(0);
    });
  });

  describe('Error handling contract', () => {
    it('should return ProviderError for network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const request: ChatRequest = {
        model: 'mistral-7b',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      try {
        await provider.chatCompletion(request);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toHaveProperty('category', 'network');
        expect(error).toHaveProperty('code', 'CONNECTION_ERROR');
      }
    });

    it('should return ProviderError for auth errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const request: ChatRequest = {
        model: 'mistral-7b',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      try {
        await provider.chatCompletion(request);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toHaveProperty('category', 'auth');
        expect(error).toHaveProperty('code', 'AUTHENTICATION_ERROR');
      }
    });

    it('should return ProviderError for rate limit errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1234567890' }),
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      });

      const request: ChatRequest = {
        model: 'mistral-7b',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      try {
        await provider.chatCompletion(request);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toHaveProperty('category', 'rate_limit');
        expect(error).toHaveProperty('code', 'RATE_LIMIT_ERROR');
      }
    });
  });
});
