import type { OAuthMetadata } from '../common/types/connector.js';

const OAUTH_FETCH_TIMEOUT_MS = 30_000;

export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorizationServers?: string[];
  bearerMethodsSupported?: string[];
  scopesSupported?: string[];
  resourceName?: string;
  resourceDocumentation?: string;
}

export function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OAUTH_FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Request to ${url} timed out after ${OAUTH_FETCH_TIMEOUT_MS}ms`);
      }
      throw err;
    })
    .finally(() => clearTimeout(timeoutId));
}

export async function discoverOAuthMetadata(serverUrl: string): Promise<OAuthMetadata> {
  const url = new URL('/.well-known/oauth-authorization-server', serverUrl);
  const response = await fetchWithTimeout(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to discover OAuth metadata from ${url.toString()}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  const authorizationEndpoint = data.authorization_endpoint as string | undefined;
  const tokenEndpoint = data.token_endpoint as string | undefined;

  if (!authorizationEndpoint || !tokenEndpoint) {
    throw new Error('Invalid OAuth metadata: missing authorization_endpoint or token_endpoint');
  }

  return {
    issuer: data.issuer as string | undefined,
    authorizationEndpoint,
    tokenEndpoint,
    registrationEndpoint: data.registration_endpoint as string | undefined,
    scopesSupported: data.scopes_supported as string[] | undefined,
  };
}

export async function discoverOAuthProtectedResourceMetadata(
  serverUrl: string,
): Promise<OAuthProtectedResourceMetadata> {
  const response = await fetchWithTimeout(serverUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (response.status !== 401) {
    throw new Error(
      `Expected ${serverUrl} to return 401 with OAuth metadata, got ${response.status} ${response.statusText}`,
    );
  }

  const authenticateHeader = response.headers.get('www-authenticate');

  const metadataUrlMatch = authenticateHeader?.match(/\bresource_metadata\s*=\s*"([^"]+)"/i);
  const metadataUrl = metadataUrlMatch?.[1];

  let lastError: Error | undefined;
  let parsedData: Record<string, unknown> | undefined;

  const tryFetchMetadata = async (url: string, label: string) => {
    try {
      const res = await fetchWithTimeout(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} ${res.statusText} from ${label}`);
        return undefined;
      }
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.toLowerCase().includes('application/json')) {
        lastError = new Error(`Non-JSON response from ${label} (Content-Type: ${ct || 'none'})`);
        return undefined;
      }
      const body = (await res.json()) as Record<string, unknown>;
      if (!body.resource) {
        lastError = new Error(`Missing required 'resource' field in response from ${label}`);
        return undefined;
      }
      return body;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      return undefined;
    }
  };

  if (metadataUrl) {
    parsedData = await tryFetchMetadata(metadataUrl, 'header url');
  }

  if (!parsedData) {
    const resourceUrl = new URL(serverUrl);
    const resourcePath = resourceUrl.pathname === '/' ? '' : resourceUrl.pathname;
    const wellKnownUrl = new URL(
      `/.well-known/oauth-protected-resource${resourcePath}`,
      resourceUrl.origin,
    ).toString();
    parsedData = await tryFetchMetadata(wellKnownUrl, 'well-known url');
  }

  if (!parsedData) {
    throw new Error(
      `Failed to discover protected resource metadata for ${serverUrl}: ${lastError?.message || 'Unknown error'}`,
    );
  }

  const data = parsedData;
  const resource = data.resource as string;

  return {
    resource,
    authorizationServers: data.authorization_servers as string[] | undefined,
    bearerMethodsSupported: data.bearer_methods_supported as string[] | undefined,
    scopesSupported: data.scopes_supported as string[] | undefined,
    resourceName: data.resource_name as string | undefined,
    resourceDocumentation: data.resource_documentation as string | undefined,
  };
}
