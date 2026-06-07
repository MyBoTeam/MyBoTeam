import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  discoverOAuthMetadata,
  discoverOAuthProtectedResourceMetadata,
  fetchWithTimeout,
} from '../../../src/connectors/oauth-metadata.js';

describe('fetchWithTimeout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('rejects on timeout', async () => {
    vi.useFakeTimers();
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    let abortSignal: AbortSignal | null = null;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, opts: RequestInit) => {
        abortSignal = opts.signal as AbortSignal;
        abortSignal?.addEventListener('abort', () => {});
        return new Promise((_resolve, reject) => {
          const onAbort = () => {
            reject(abortError);
          };
          abortSignal?.addEventListener('abort', onAbort);
        });
      }),
    );

    const promise = fetchWithTimeout('https://example.com');
    vi.advanceTimersByTime(31000);

    await expect(promise).rejects.toThrow('timed out after 30000ms');
    vi.useRealTimers();
  });

  it('re-throws non-abort errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    await expect(fetchWithTimeout('https://example.com')).rejects.toThrow('Network error');
  });

  it('returns response on success', async () => {
    const response = new Response('ok', { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const result = await fetchWithTimeout('https://example.com');
    expect(result.status).toBe(200);
  });
});

describe('discoverOAuthMetadata', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('discovers metadata from well-known endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            authorization_endpoint: 'https://example.com/auth',
            token_endpoint: 'https://example.com/token',
            issuer: 'https://example.com',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const result = await discoverOAuthMetadata('https://mcp.example.com');
    expect(result.authorizationEndpoint).toBe('https://example.com/auth');
    expect(result.tokenEndpoint).toBe('https://example.com/token');
    expect(result.issuer).toBe('https://example.com');
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' })),
    );
    await expect(discoverOAuthMetadata('https://mcp.example.com')).rejects.toThrow(
      'Failed to discover OAuth metadata',
    );
  });

  it('throws when authorization or token endpoint is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    await expect(discoverOAuthMetadata('https://mcp.example.com')).rejects.toThrow(
      'Invalid OAuth metadata: missing authorization_endpoint or token_endpoint',
    );
  });
});

describe('discoverOAuthProtectedResourceMetadata', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('discovers from resource_metadata header URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response('', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Bearer resource_metadata="https://example.com/protected"',
            },
          }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              resource: 'https://api.example.com',
              scopes_supported: ['read', 'write'],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
    );

    const result = await discoverOAuthProtectedResourceMetadata('https://mcp.example.com/mcp');
    expect(result.resource).toBe('https://api.example.com');
    expect(result.scopesSupported).toEqual(['read', 'write']);
  });

  it('falls back to well-known URL when no header', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response('', { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="test"' } }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ resource: 'https://api.example.com' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
    );

    const result = await discoverOAuthProtectedResourceMetadata('https://mcp.example.com/mcp');
    expect(result.resource).toBe('https://api.example.com');
  });

  it('throws when server does not return 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('OK', { status: 200 })));
    await expect(discoverOAuthProtectedResourceMetadata('https://mcp.example.com')).rejects.toThrow(
      'Expected https://mcp.example.com to return 401',
    );
  });

  it('throws when metadata discovery fails entirely', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response('', { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="test"' } }),
        )
        .mockResolvedValueOnce(new Response('Not Found', { status: 404 })),
    );

    await expect(discoverOAuthProtectedResourceMetadata('https://mcp.example.com')).rejects.toThrow(
      'Failed to discover protected resource metadata',
    );
  });

  it('falls back to well-known when header URL returns non-JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response('', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Bearer resource_metadata="https://example.com/protected"',
            },
          }),
        )
        .mockResolvedValueOnce(
          new Response('plain text', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ resource: 'https://api.example.com' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
    );

    const result = await discoverOAuthProtectedResourceMetadata('https://mcp.example.com');
    expect(result.resource).toBe('https://api.example.com');
  });

  it('falls back to well-known when header URL response is missing resource field', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response('', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Bearer resource_metadata="https://example.com/protected"',
            },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ resource: 'https://api.example.com' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
    );

    const result = await discoverOAuthProtectedResourceMetadata('https://mcp.example.com');
    expect(result.resource).toBe('https://api.example.com');
  });
});
