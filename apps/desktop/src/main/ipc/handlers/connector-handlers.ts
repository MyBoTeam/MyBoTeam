import crypto from 'node:crypto';
import type { McpConnector } from '@myboteam/agent-core/desktop-main';
import {
  buildAuthorizationUrl,
  discoverOAuthMetadata,
  exchangeCodeForTokens,
  generatePkceChallenge,
  registerOAuthClient,
  sanitizeString,
} from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import { shell } from 'electron';
import { getDaemonClient } from '../../daemon-bootstrap';
import { cleanupExpiredOAuthFlows, pendingOAuthFlows } from './connector-oauth';
import { handle } from './utils';

export function registerConnectorHandlers(): void {
  handle('connectors:list', async () => {
    return getDaemonClient().call('connectors.list');
  });

  handle('connectors:add', async (_event: IpcMainInvokeEvent, name: string, url: string) => {
    const sanitizedName = sanitizeString(name, 'connectorName', 128);
    const sanitizedUrl = sanitizeString(url, 'connectorUrl', 512);

    try {
      const parsed = new URL(sanitizedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Connector URL must use http:// or https://');
      }
    } catch (err) {
      throw new Error(
        err instanceof Error && err.message.includes('http')
          ? err.message
          : `Invalid connector URL: ${sanitizedUrl}`,
      );
    }

    const id = `mcp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const connector: McpConnector = {
      id,
      name: sanitizedName,
      url: sanitizedUrl,
      status: 'disconnected',
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    };

    await getDaemonClient().call('connectors.upsert', { connector });
    return connector;
  });

  handle('connectors:delete', async (_event: IpcMainInvokeEvent, id: string) => {
    const client = getDaemonClient();
    await client.call('connectors.deleteTokens', { connectorId: id });
    await client.call('connectors.delete', { id });
  });

  handle(
    'connectors:set-enabled',
    async (_event: IpcMainInvokeEvent, id: string, enabled: boolean) => {
      await getDaemonClient().call('connectors.setEnabled', { id, enabled });
    },
  );

  handle('connectors:start-oauth', async (_event: IpcMainInvokeEvent, connectorId: string) => {
    const client = getDaemonClient();
    const connector = await client.call('connectors.getById', { id: connectorId });
    if (!connector) {
      throw new Error('Connector not found');
    }

    const metadata = await discoverOAuthMetadata(connector.url);

    let clientReg = connector.clientRegistration;
    if (!clientReg) {
      clientReg = await registerOAuthClient(
        metadata,
        'myboteam://callback/mcp',
        'MyBoTeam Desktop',
      );
    }

    await client.call('connectors.upsert', {
      connector: {
        ...connector,
        oauthMetadata: metadata,
        clientRegistration: clientReg,
        status: 'connecting',
        updatedAt: new Date().toISOString(),
      },
    });

    const pkce = generatePkceChallenge();

    const state = crypto.randomUUID();
    cleanupExpiredOAuthFlows();
    pendingOAuthFlows.set(state, {
      connectorId,
      codeVerifier: pkce.codeVerifier,
      metadata,
      clientRegistration: clientReg,
      createdAt: Date.now(),
    });

    const authUrl = buildAuthorizationUrl({
      authorizationEndpoint: metadata.authorizationEndpoint,
      clientId: clientReg.clientId,
      redirectUri: 'myboteam://callback/mcp',
      codeChallenge: pkce.codeChallenge,
      state,
      scope: metadata.scopesSupported?.join(' '),
    });

    await shell.openExternal(authUrl);

    return { state, authUrl };
  });

  handle(
    'connectors:complete-oauth',
    async (_event: IpcMainInvokeEvent, state: string, code: string) => {
      cleanupExpiredOAuthFlows();
      const flow = pendingOAuthFlows.get(state);
      if (!flow) {
        throw new Error('No pending OAuth flow for this state');
      }
      pendingOAuthFlows.delete(state);

      const tokens = await exchangeCodeForTokens({
        tokenEndpoint: flow.metadata.tokenEndpoint,
        code,
        codeVerifier: flow.codeVerifier,
        clientId: flow.clientRegistration.clientId,
        clientSecret: flow.clientRegistration.clientSecret,
        redirectUri: 'myboteam://callback/mcp',
      });

      const client = getDaemonClient();
      await client.call('connectors.storeTokens', {
        connectorId: flow.connectorId,
        tokens,
      });

      const connector = await client.call('connectors.getById', { id: flow.connectorId });
      if (connector) {
        await client.call('connectors.upsert', {
          connector: {
            ...connector,
            status: 'connected',
            lastConnectedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }

      return client.call('connectors.getById', { id: flow.connectorId });
    },
  );

  handle('connectors:disconnect', async (_event: IpcMainInvokeEvent, connectorId: string) => {
    const client = getDaemonClient();
    await client.call('connectors.deleteTokens', { connectorId });
    await client.call('connectors.setStatus', { id: connectorId, status: 'disconnected' });
  });
}
