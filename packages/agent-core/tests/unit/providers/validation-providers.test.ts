import { describe, expect, it, vi } from 'vitest';

const mockFetchWithTimeout = vi.hoisted(() => vi.fn());

vi.mock('../../../src/utils/fetch.js', () => ({
  fetchWithTimeout: mockFetchWithTimeout,
}));

import { fetchValidationResponse } from '../../../src/providers/validation-providers.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchValidationResponse', () => {
  it('returns fetch for anthropic', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    const result = await fetchValidationResponse('anthropic', 'sk-ant-test', {} as never, 5000);
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-test',
          'anthropic-version': '2023-06-01',
        }),
      }),
      5000,
    );
    expect(result).toBeDefined();
  });

  it('returns fetch for openai with custom baseUrl', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    const result = await fetchValidationResponse(
      'openai',
      'sk-openai-test',
      {
        baseUrl: 'https://custom.openai.com/v1',
      } as never,
      5000,
    );
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      'https://custom.openai.com/v1/models',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-openai-test',
        }),
      }),
      5000,
    );
    expect(result).toBeDefined();
  });

  it('returns fetch for openai with default baseUrl', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    await fetchValidationResponse('openai', 'sk-openai-test', {} as never, 5000);
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      expect.any(Object),
      5000,
    );
  });

  it('returns fetch for google', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    const result = await fetchValidationResponse('google', 'google-key', {} as never, 5000);
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models?key=google-key',
      { method: 'GET' },
      5000,
    );
    expect(result).toBeDefined();
  });

  it('returns fetch for xai', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    await fetchValidationResponse('xai', 'xai-key', {} as never, 5000);
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      'https://api.x.ai/v1/models',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer xai-key',
        }),
      }),
      5000,
    );
  });

  it('returns fetch for deepseek', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    await fetchValidationResponse('deepseek', 'deepseek-key', {} as never, 5000);
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      'https://api.deepseek.com/models',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer deepseek-key',
        }),
      }),
      5000,
    );
  });

  it('returns fetch for openrouter', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    await fetchValidationResponse('openrouter', 'or-key', {} as never, 5000);
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/auth/key',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer or-key',
        }),
      }),
      5000,
    );
  });

  it('returns fetch for moonshot', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    await fetchValidationResponse('moonshot', 'ms-key', {} as never, 5000);
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      'https://api.moonshot.ai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer ms-key',
        }),
      }),
      5000,
    );
  });

  it('returns fetch for zai with international region', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    await fetchValidationResponse('zai', 'zai-key', { zaiRegion: 'international' } as never, 5000);
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      expect.stringContaining('/models'),
      expect.any(Object),
      5000,
    );
  });

  it('returns fetch for minimax', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    await fetchValidationResponse('minimax', 'mm-key', {} as never, 5000);
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      'https://api.minimax.io/anthropic/v1/messages',
      expect.any(Object),
      5000,
    );
  });

  it('returns null for ollama', async () => {
    const result = await fetchValidationResponse('ollama', '', {} as never, 5000);
    expect(result).toBeNull();
  });

  it('returns null for bedrock', async () => {
    const result = await fetchValidationResponse('bedrock', '', {} as never, 5000);
    expect(result).toBeNull();
  });

  it('returns null for vertex', async () => {
    const result = await fetchValidationResponse('vertex', '', {} as never, 5000);
    expect(result).toBeNull();
  });

  it('returns null for azure-foundry', async () => {
    const result = await fetchValidationResponse('azure-foundry', '', {} as never, 5000);
    expect(result).toBeNull();
  });

  it('returns null for litellm', async () => {
    const result = await fetchValidationResponse('litellm', '', {} as never, 5000);
    expect(result).toBeNull();
  });

  it('returns null for lmstudio', async () => {
    const result = await fetchValidationResponse('lmstudio', '', {} as never, 5000);
    expect(result).toBeNull();
  });

  it('returns null for custom', async () => {
    const result = await fetchValidationResponse('custom', '', {} as never, 5000);
    expect(result).toBeNull();
  });

  it('handles default case with modelsEndpoint bearer auth', async () => {
    mockFetchWithTimeout.mockResolvedValueOnce({ ok: true } as Response);
    const result = await fetchValidationResponse('groq', 'groq-key', {} as never, 5000);
    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      expect.stringContaining('groq'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer groq-key',
        }),
      }),
      5000,
    );
    expect(result).toBeDefined();
  });

  it('handles default case without modelsEndpoint', async () => {
    const result = await fetchValidationResponse('unknown-provider', '', {} as never, 5000);
    expect(result).toBeNull();
  });
});
