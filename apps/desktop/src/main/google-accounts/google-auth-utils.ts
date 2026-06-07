import http from 'node:http';
import type { GoogleAccountToken } from '@myboteam/agent-core/common';
import { GOOGLE_TOKEN_ENDPOINT, GOOGLE_USERINFO_EP } from './constants.js';

export interface GoogleAuthResult {
  googleAccountId: string;
  email: string;
  displayName: string;
  pictureUrl: string | null;
  token: GoogleAccountToken;
}

interface PendingFlow {
  resolve: (code: string) => void;
  reject: (err: Error) => void;
  codeVerifier: string;
  server: http.Server;
}

export const OAUTH_FLOW_TTL_MS = 10 * 60 * 1000;
export const pendingFlows = new Map<string, PendingFlow & { createdAt: number }>();

export function b64url(buf: Buffer): string {
  return buf.toString('base64url');
}

export function startCallbackServer(port: number, _state: string): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(port, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

export async function exchangeCodeForResult(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
  _label: string,
): Promise<GoogleAuthResult> {
  const params: Record<string, string> = {
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
  };
  if (clientSecret) {
    params.client_secret = clientSecret;
  }
  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Token exchange failed (${tokenRes.status}): ${body}`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };

  if (!tokenData.refresh_token || tokenData.refresh_token.trim() === '') {
    throw new Error(
      'Google did not return a refresh token. Please revoke access at ' +
        'https://myaccount.google.com/permissions and try connecting again.',
    );
  }

  const token: GoogleAccountToken = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    scopes: tokenData.scope.split(' '),
  };

  const infoRes = await fetch(GOOGLE_USERINFO_EP, {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });

  if (!infoRes.ok) {
    throw new Error(`Userinfo fetch failed (${infoRes.status})`);
  }

  const info = (await infoRes.json()) as {
    sub: string;
    email: string;
    name: string;
    picture?: string;
  };

  return {
    googleAccountId: info.sub,
    email: info.email,
    displayName: info.name,
    pictureUrl: info.picture ?? null,
    token,
  };
}
