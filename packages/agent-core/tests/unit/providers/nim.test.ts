import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchNimModels, testNimConnection } from '../../../src/providers/nim.js';

const mockFetch = vi.fn();

describe('testNimConnection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns error for invalid URL', async () => {
    const result = await testNimConnection('not-a-url', 'sk-test');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not a valid URL');
  });

  it('returns models on successful connection', async () => {
    const apiModels = {
      data: [
        { id: 'nvidia/llama-3.1-8b', object: 'model', owned_by: 'meta' },
        { id: 'mistral-7b', object: 'model', owned_by: 'mistral' },
      ],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => apiModels,
    } as Response);

    const result = await testNimConnection('https://integrate.api.nvidia.com/v1', 'nvapi-sk-test');
    expect(result.success).toBe(true);
    expect(result.models).toHaveLength(2);
    expect(result.models![0]!.name).toContain('Nvidia');
    expect(result.models![1]!.name).toBe('Mistral 7b');
  });

  it('returns empty array when API returns no models', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const result = await testNimConnection('https://integrate.api.nvidia.com/v1', 'nvapi-sk-test');
    expect(result.success).toBe(true);
    expect(result.models).toEqual([]);
  });

  it('handles API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    } as Response);

    const result = await testNimConnection('https://integrate.api.nvidia.com/v1', 'bad-key');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid API key');
  });

  it('handles abort/timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await testNimConnection('https://integrate.api.nvidia.com/v1', 'sk-test');
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await testNimConnection('https://integrate.api.nvidia.com/v1', 'sk-test');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot connect to NVIDIA NIM');
  });
});

describe('fetchNimModels', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns error when no config is provided', async () => {
    const result = await fetchNimModels({ config: null });
    expect(result.success).toBe(false);
    expect(result.error).toContain('No NVIDIA NIM endpoint configured');
  });

  it('returns error when config has no baseUrl', async () => {
    const result = await fetchNimModels({ config: {} as never });
    expect(result.success).toBe(false);
    expect(result.error).toContain('No NVIDIA NIM endpoint configured');
  });

  it('returns error for invalid URL in config', async () => {
    const result = await fetchNimModels({
      config: { baseUrl: 'not-a-url' },
      apiKey: 'sk-test',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });

  it('fetches models successfully from configured endpoint', async () => {
    const apiModels = {
      data: [
        { id: 'nvidia/llama-3.1-8b', object: 'model' },
        { id: 'nvidia/mistral-7b', object: 'model' },
      ],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => apiModels,
    } as Response);

    const result = await fetchNimModels({
      config: { baseUrl: 'https://private-nim.example.com/v1' },
      apiKey: 'nvapi-sk-test',
    });
    expect(result.success).toBe(true);
    expect(result.models).toHaveLength(2);
  });

  it('handles fetch error in fetchNimModels', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const result = await fetchNimModels({
      config: { baseUrl: 'https://private-nim.example.com/v1' },
      apiKey: 'nvapi-sk-test',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to fetch models');
  });
});
