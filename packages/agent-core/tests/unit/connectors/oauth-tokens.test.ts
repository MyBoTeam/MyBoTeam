import { afterEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('../../../src/connectors/oauth-metadata.js', () => ({
  fetchWithTimeout: vi.fn(async (url: string, options: RequestInit) => {
    return mockFetch(url, options);
  }),
}));

import {
  exchangeCodeForTokens,
  isTokenExpired,
  refreshAccessToken,
} from '../../../src/connectors/oauth-tokens.js';

describe('exchangeCodeForTokens', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exchanges code successfully', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: 'abc123',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'read',
        }),
        { status: 200 },
      ),
    );

    const result = await exchangeCodeForTokens({
      tokenEndpoint: 'https://example.com/token',
      code: 'code123',
      codeVerifier: 'verifier123',
      clientId: 'client123',
      redirectUri: 'https://example.com/callback',
    });

    expect(result.accessToken).toBe('abc123');
    expect(result.tokenType).toBe('Bearer');
    expect(result.scope).toBe('read');
    expect(result.expiresAt).toBeGreaterThan(Date.now());
    expect(result.refreshToken).toBeUndefined();
  });

  it('includes client_secret when provided', async () => {
    let capturedBody: string | undefined;
    mockFetch.mockImplementationOnce(async (_url: string, options: RequestInit) => {
      capturedBody = options.body as string;
      return new Response(JSON.stringify({ access_token: 'abc123' }), { status: 200 });
    });

    await exchangeCodeForTokens({
      tokenEndpoint: 'https://example.com/token',
      code: 'code123',
      codeVerifier: 'verifier123',
      clientId: 'client123',
      clientSecret: 'secret456',
      redirectUri: 'https://example.com/callback',
    });

    expect(capturedBody).toContain('client_secret=secret456');
  });

  it('includes resource when provided', async () => {
    let capturedBody: string | undefined;
    mockFetch.mockImplementationOnce(async (_url: string, options: RequestInit) => {
      capturedBody = options.body as string;
      return new Response(JSON.stringify({ access_token: 'abc123' }), { status: 200 });
    });

    await exchangeCodeForTokens({
      tokenEndpoint: 'https://example.com/token',
      code: 'code123',
      codeVerifier: 'verifier123',
      clientId: 'client123',
      redirectUri: 'https://example.com/callback',
      resource: 'https://api.example.com',
    });

    expect(capturedBody).toContain('resource=https%3A%2F%2Fapi.example.com');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('error body', { status: 400, statusText: 'Bad Request' }),
    );

    await expect(
      exchangeCodeForTokens({
        tokenEndpoint: 'https://example.com/token',
        code: 'code123',
        codeVerifier: 'verifier123',
        clientId: 'client123',
        redirectUri: 'https://example.com/callback',
      }),
    ).rejects.toThrow('Token exchange failed: 400 Bad Request - error body');
  });

  it('throws when access_token is missing', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    await expect(
      exchangeCodeForTokens({
        tokenEndpoint: 'https://example.com/token',
        code: 'code123',
        codeVerifier: 'verifier123',
        clientId: 'client123',
        redirectUri: 'https://example.com/callback',
      }),
    ).rejects.toThrow('Token response missing access_token');
  });
});

describe('refreshAccessToken', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes token successfully', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'new-token', expires_in: 3600 }), {
        status: 200,
      }),
    );

    const result = await refreshAccessToken({
      tokenEndpoint: 'https://example.com/token',
      refreshToken: 'old-refresh',
      clientId: 'client123',
    });

    expect(result.accessToken).toBe('new-token');
    expect(result.refreshToken).toBe('old-refresh');
  });

  it('uses provided refresh_token from response when given', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'new-token', refresh_token: 'new-refresh' }), {
        status: 200,
      }),
    );

    const result = await refreshAccessToken({
      tokenEndpoint: 'https://example.com/token',
      refreshToken: 'old-refresh',
      clientId: 'client123',
    });

    expect(result.refreshToken).toBe('new-refresh');
  });

  it('includes client_secret when provided', async () => {
    let capturedBody: string | undefined;
    mockFetch.mockImplementationOnce(async (_url: string, options: RequestInit) => {
      capturedBody = options.body as string;
      return new Response(JSON.stringify({ access_token: 'new-token' }), { status: 200 });
    });

    await refreshAccessToken({
      tokenEndpoint: 'https://example.com/token',
      refreshToken: 'old-refresh',
      clientId: 'client123',
      clientSecret: 'secret456',
    });

    expect(capturedBody).toContain('client_secret=secret456');
  });

  it('includes resource when provided', async () => {
    let capturedBody: string | undefined;
    mockFetch.mockImplementationOnce(async (_url: string, options: RequestInit) => {
      capturedBody = options.body as string;
      return new Response(JSON.stringify({ access_token: 'new-token' }), { status: 200 });
    });

    await refreshAccessToken({
      tokenEndpoint: 'https://example.com/token',
      refreshToken: 'old-refresh',
      clientId: 'client123',
      resource: 'https://api.example.com',
    });

    expect(capturedBody).toContain('resource=https%3A%2F%2Fapi.example.com');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('error', { status: 401, statusText: 'Unauthorized' }),
    );

    await expect(
      refreshAccessToken({
        tokenEndpoint: 'https://example.com/token',
        refreshToken: 'old-refresh',
        clientId: 'client123',
      }),
    ).rejects.toThrow('Token refresh failed: 401 Unauthorized - error');
  });

  it('throws when access_token is missing', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    await expect(
      refreshAccessToken({
        tokenEndpoint: 'https://example.com/token',
        refreshToken: 'old-refresh',
        clientId: 'client123',
      }),
    ).rejects.toThrow('Token refresh response missing access_token');
  });
});

describe('isTokenExpired', () => {
  it('returns false when no expiresAt', () => {
    expect(isTokenExpired({ accessToken: 'abc', tokenType: 'Bearer' })).toBe(false);
  });

  it('returns true when token is past expiry minus buffer', () => {
    const expired = Date.now() - 100000;
    expect(isTokenExpired({ accessToken: 'abc', tokenType: 'Bearer', expiresAt: expired })).toBe(
      true,
    );
  });

  it('returns false when token is within buffer window', () => {
    const future = Date.now() + 600000; // 10 minutes from now (buffer is 5 min)
    expect(isTokenExpired({ accessToken: 'abc', tokenType: 'Bearer', expiresAt: future })).toBe(
      false,
    );
  });
});
