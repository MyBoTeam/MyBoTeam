import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLiteLLMModels, testLiteLLMConnection } from '../../../src/providers/litellm.js';

const mockFetch = vi.fn();

describe('testLiteLLMConnection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns error for invalid URL', async () => {
    const result = await testLiteLLMConnection('not-a-url');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not a valid URL');
  });

  it('returns models on successful connection', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 'openai/gpt-4', object: 'model', owned_by: 'openai' },
          { id: 'anthropic/claude-3-haiku', object: 'model', owned_by: 'anthropic' },
        ],
      }),
    } as Response);

    const result = await testLiteLLMConnection('http://localhost:4000');
    expect(result.success).toBe(true);
    expect(result.models).toHaveLength(2);
    expect(result.models![0]!.provider).toBe('openai');
    expect(result.models![1]!.provider).toBe('anthropic');
  });

  it('sends authorization header when API key provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    await testLiteLLMConnection('http://localhost:4000', 'sk-test');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/v1/models',
      expect.objectContaining({
        headers: { Authorization: 'Bearer sk-test' },
      }),
    );
  });

  it('handles API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid credentials' } }),
    } as Response);

    const result = await testLiteLLMConnection('http://localhost:4000');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid credentials');
  });

  it('handles abort/timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await testLiteLLMConnection('http://localhost:4000');
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await testLiteLLMConnection('http://localhost:4000');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot connect');
  });
});

describe('fetchLiteLLMModels', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns error when no config provided', async () => {
    const result = await fetchLiteLLMModels({ config: null });
    expect(result.success).toBe(false);
    expect(result.error).toContain('No LiteLLM proxy configured');
  });

  it('returns error when config has no baseUrl', async () => {
    const result = await fetchLiteLLMModels({ config: {} as never });
    expect(result.success).toBe(false);
    expect(result.error).toContain('No LiteLLM proxy configured');
  });

  it('fetches models successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 'openai/gpt-4', object: 'model', owned_by: 'openai' },
          { id: 'anthropic/claude-3-haiku', object: 'model', owned_by: 'anthropic' },
        ],
      }),
    } as Response);

    const result = await fetchLiteLLMModels({
      config: { baseUrl: 'http://litellm:4000' },
      apiKey: 'sk-test',
    });
    expect(result.success).toBe(true);
    expect(result.models).toHaveLength(2);
    expect(result.models![0]!.name).toContain('Openai');
    expect(result.models![1]!.name).toContain('Anthropic');
  });

  it('handles fetch error in fetchLiteLLMModels', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await fetchLiteLLMModels({
      config: { baseUrl: 'http://litellm:4000' },
      apiKey: 'sk-test',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });
});
