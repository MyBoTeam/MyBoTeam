import crypto from 'node:crypto';
import type { OAuthProviderId } from '@myboteam/agent-core/common';
import { getConnectorDefinition } from '@myboteam/agent-core/common';
import {
  buildAuthorizationUrl,
  discoverOAuthMetadata,
  exchangeCodeForTokens,
  generatePkceChallenge,
} from '@myboteam/agent-core/desktop-main';
import { shell } from 'electron';
import { getDaemonClient } from '../daemon-bootstrap';
import { createOAuthCallbackServer } from '../oauth-callback-server';
import { getConnectorAuthStore } from './connector-auth-registry';
import type { ConnectorOAuthResult } from './connector-token-resolver';

export async function performMcpFixedClientFlow(
  providerId: OAuthProviderId,
): Promise<ConnectorOAuthResult> {
  const def = getConnectorDefinition(providerId)!;
  const oauth = def.desktopOAuth;
  if (oauth.kind !== 'mcp-fixed-client') {
    return { ok: false, error: 'not-configured' };
  }

  const store = getConnectorAuthStore(providerId);
  if (!store) {
    return { ok: false, error: 'not-configured' };
  }

  const serverUrl = await store.getServerUrl();
  if (!serverUrl) {
    return { ok: false, error: 'no-server-url' };
  }

  try {
    const metadata = await discoverOAuthMetadata(serverUrl).catch(() => {
      throw new Error(oauth.discoveryError);
    });

    const pkce = generatePkceChallenge();
    const state = crypto.randomUUID();
    const clientId = oauth.clientId;

    const authUrl = buildAuthorizationUrl({
      authorizationEndpoint: metadata.authorizationEndpoint,
      clientId,
      redirectUri: store.callbackUrl,
      codeChallenge: pkce.codeChallenge,
      state,
      scope: metadata.scopesSupported?.join(' '),
    });

    const callbackServer = await createOAuthCallbackServer({
      host: oauth.store.callback.host,
      port: oauth.store.callback.port,
      callbackPath: oauth.store.callback.path,
      settingsProvider: async () => {
        const snap = await getDaemonClient().call('settings.getAll');
        return {
          theme: snap.app.theme === 'dark' ? 'dark' : 'light',
          themeColor: snap.app.themeColor ?? 'neutral',
          language: snap.app.language ?? 'en',
        };
      },
    });

    let authSucceeded = false;
    try {
      await store.setPendingAuth({ codeVerifier: pkce.codeVerifier, oauthState: state });
      await shell.openExternal(authUrl);

      const { code, state: returnedState } = await callbackServer.waitForCallback().catch(() => {
        throw new Error(oauth.tokenExchangeError);
      });

      if (returnedState !== state) {
        throw new Error(oauth.tokenExchangeError);
      }

      const tokens = await exchangeCodeForTokens({
        tokenEndpoint: metadata.tokenEndpoint,
        code,
        codeVerifier: pkce.codeVerifier,
        clientId,
        redirectUri: store.callbackUrl,
      }).catch(() => {
        throw new Error(oauth.tokenExchangeError);
      });

      await store.setTokens(tokens, Date.now());
      authSucceeded = true;
      return { ok: true, accessToken: tokens.accessToken };
    } finally {
      if (!authSucceeded) {
        await store.clearTokens();
      }
      callbackServer.shutdown();
    }
  } catch (err) {
    return {
      ok: false,
      error: 'oauth-failed',
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
