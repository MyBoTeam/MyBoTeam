import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testCustomConnection } from '../../../src/providers/custom.js';

const mockFetch = vi.fn();

describe('testCustomConnection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns error for invalid URL', async () => {
    const result = await testCustomConnection('not-a-url');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not a valid URL');
  });

  it('returns success when /models endpoint responds OK', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    const result = await testCustomConnection('https://custom-api.example.com/v1');
    expect(result.success).toBe(true);
  });

  it('append v1/models when URL ends with /v1', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    await testCustomConnection('https://custom-api.example.com/v1');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://custom-api.example.com/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('append /v1/models when URL has root path', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    await testCustomConnection('https://custom-api.example.com/');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://custom-api.example.com/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('uses the URL as-is when path is not / or /v1', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    await testCustomConnection('https://custom-api.example.com/chat/completions');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://custom-api.example.com/chat/completions',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('includes Authorization header when API key is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    await testCustomConnection('https://custom-api.example.com/v1', 'sk-test');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );
  });

  it('returns auth error when 401 and no API key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    const result = await testCustomConnection('https://custom-api.example.com/v1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Authentication required');
  });

  it('returns success when 401/403 but API key was provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    const result = await testCustomConnection('https://custom-api.example.com/v1', 'sk-test');
    expect(result.success).toBe(true);
  });

  it('returns success when /models returns 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const result = await testCustomConnection('https://custom-api.example.com/v1');
    expect(result.success).toBe(true);
  });

  it('returns success for other HTTP errors (server reachable)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const result = await testCustomConnection('https://custom-api.example.com/v1');
    expect(result.success).toBe(true);
  });

  it('handles abort/timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await testCustomConnection('https://custom-api.example.com/v1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await testCustomConnection('https://custom-api.example.com/v1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot connect');
  });
});
