import crypto from 'node:crypto';
import type http from 'node:http';
import { shell } from 'electron';
import { getLogCollector } from '../logging/index.js';
import {
  GOOGLE_AUTH_ENDPOINT,
  GOOGLE_OAUTH_SCOPES,
  OAUTH_CALLBACK_PORT_FALLBACK,
  OAUTH_CALLBACK_PORT_PRIMARY,
} from './constants.js';
import type { GoogleAuthResult } from './google-auth-utils';
import {
  b64url,
  exchangeCodeForResult,
  OAUTH_FLOW_TTL_MS,
  pendingFlows,
  startCallbackServer,
} from './google-auth-utils';

export type { GoogleAuthResult } from './google-auth-utils';

export async function startGoogleOAuth(label: string): Promise<{
  state: string;
  authUrl: string;
  waitForCallback: () => Promise<GoogleAuthResult>;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
  if (!clientId) {
    getLogCollector().log('WARN', 'main', 'GOOGLE_CLIENT_ID is not set — OAuth will fail');
  }

  const codeVerifier = b64url(crypto.randomBytes(32));
  const codeChallenge = b64url(crypto.createHash('sha256').update(codeVerifier).digest());
  const state = crypto.randomUUID();

  let port = OAUTH_CALLBACK_PORT_PRIMARY;
  let server: http.Server;
  try {
    server = await startCallbackServer(OAUTH_CALLBACK_PORT_PRIMARY, state);
  } catch {
    server = await startCallbackServer(OAUTH_CALLBACK_PORT_FALLBACK, state);
    port = OAUTH_CALLBACK_PORT_FALLBACK;
  }

  const redirectUri = `http://127.0.0.1:${port}/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_SCOPES.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;

  const waitForCallback = (): Promise<GoogleAuthResult> =>
    new Promise<GoogleAuthResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingFlows.delete(state);
        server.close();
        reject(new Error('Google OAuth timed out'));
      }, OAUTH_FLOW_TTL_MS);

      server.on('request', async (req, res) => {
        try {
          const url = new URL(req.url ?? '', `http://127.0.0.1:${port}`);
          if (url.pathname !== '/callback') {
            res.writeHead(404).end();
            return;
          }

          const errorParam = url.searchParams.get('error');
          if (errorParam) {
            res
              .writeHead(400, { 'Content-Type': 'text/html' })
              .end(
                '<html><body><h2>Authentication cancelled. You can close this tab.</h2></body></html>',
              );
            clearTimeout(timeout);
            server.close();
            pendingFlows.delete(state);
            reject(new Error(`OAuth error: ${errorParam}`));
            return;
          }

          const code = url.searchParams.get('code');
          const returnedState = url.searchParams.get('state');

          if (!code || returnedState !== state) {
            res.writeHead(400).end('Bad request');
            return;
          }

          res
            .writeHead(200, { 'Content-Type': 'text/html' })
            .end('<html><body><h2>Connected! You can close this tab.</h2></body></html>');
          clearTimeout(timeout);
          server.close();
          pendingFlows.delete(state);

          const result = await exchangeCodeForResult(
            code,
            codeVerifier,
            redirectUri,
            clientId,
            clientSecret,
            label,
          );
          getLogCollector().log('INFO', 'main', 'Google account connected', {
            googleAccountId: result.googleAccountId,
          });
          resolve(result);
        } catch (err) {
          clearTimeout(timeout);
          server.close();
          pendingFlows.delete(state);
          getLogCollector().log('ERROR', 'main', 'Google OAuth callback error', {
            error: String(err),
          });
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

      pendingFlows.set(state, {
        resolve: () => {},
        reject,
        codeVerifier,
        server,
        createdAt: Date.now(),
      });
    });

  try {
    await shell.openExternal(authUrl);
  } catch (err) {
    server.close();
    throw err;
  }

  return { state, authUrl, waitForCallback };
}

export function cancelGoogleOAuth(state: string): void {
  const flow = pendingFlows.get(state);
  if (!flow) {
    return;
  }
  pendingFlows.delete(state);
  flow.server.close();
  flow.reject(new Error('OAuth cancelled by user'));
}
