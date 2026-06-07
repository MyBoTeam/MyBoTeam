import type { ConnectorDesktopOAuthKind, OAuthProviderId } from '@myboteam/agent-core/common';
import { getConnectorDefinition } from '@myboteam/agent-core/common';
import { discoverOAuthMetadata, refreshAccessToken } from '@myboteam/agent-core/desktop-main';
import { getConnectorAuthStore } from './connector-auth-registry';
import type { ConnectorAuthStore } from './connector-auth-store';
import { performDesktopGithubFlow, performDesktopGoogleFlow } from './github-oauth-flow';
import { performMcpDcrFlow, performMcpFixedClientFlow } from './mcp-oauth-strategies';

export type ConnectorOAuthResult =
  | { ok: true; accessToken: string }
  | {
      ok: false;
      error: 'gh-not-found' | 'oauth-failed' | 'no-server-url' | 'not-configured';
      message?: string;
    };

export async function connectBuiltInConnector(
  providerId: OAuthProviderId,
): Promise<ConnectorOAuthResult> {
  const def = getConnectorDefinition(providerId);
  if (!def) {
    return {
      ok: false,
      error: 'not-configured',
      message: `No connector definition for ${providerId}`,
    };
  }

  const kind = def.desktopOAuth.kind as ConnectorDesktopOAuthKind;

  switch (kind) {
    case 'mcp-dcr':
      return performMcpDcrFlow(providerId, def);
    case 'mcp-fixed-client':
      return performMcpFixedClientFlow(providerId);
    case 'desktop-google':
      return performDesktopGoogleFlow(providerId);
    case 'desktop-github':
      return performDesktopGithubFlow(providerId);
    default:
      return assertNever(kind);
  }
}

export async function resolveMcpConnectorAccessToken(
  providerId: OAuthProviderId,
): Promise<string | undefined> {
  const store = getConnectorAuthStore(providerId);
  if (!store) {
    return undefined;
  }

  const accessToken = await store.getAccessToken();
  if (!accessToken) {
    return undefined;
  }

  const expiry = await store.getTokenExpiry();
  if (expiry && Date.now() >= expiry - 5 * 60 * 1000) {
    const refreshed = await tryRefreshToken(store);
    if (refreshed) {
      return refreshed;
    }
  }

  return accessToken;
}

async function tryRefreshToken(store: ConnectorAuthStore): Promise<string | undefined> {
  const [serverUrl, clientReg, refreshToken] = await Promise.all([
    store.getServerUrl(),
    store.getClientRegistration(),
    store.getRefreshToken(),
  ]);

  if (!serverUrl || !clientReg?.clientId || !refreshToken) {
    return undefined;
  }

  try {
    const metadata = await discoverOAuthMetadata(serverUrl);
    const refreshed = await refreshAccessToken({
      tokenEndpoint: metadata.tokenEndpoint,
      refreshToken,
      clientId: clientReg.clientId,
      clientSecret: clientReg.clientSecret,
    });
    await store.setTokens(refreshed, Date.now());
    return refreshed.accessToken;
  } catch {
    return undefined;
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled OAuth kind: ${String(value)}`);
}
