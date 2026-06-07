import type {
  ConnectorAuthStoreConfig,
  OAuthClientRegistration,
  OAuthTokens,
} from '@myboteam/agent-core/common';
import { deleteEntry, readEntry, resolveServerUrl, writeEntry } from './connector-auth-entry';
import type { ConnectorOAuthStatus, StoredAuthEntry } from './connector-auth-types';

export type { ConnectorOAuthStatus };

export class ConnectorAuthStore {
  constructor(readonly config: ConnectorAuthStoreConfig) {}

  get callbackUrl(): string {
    const { host, port, path } = this.config.callback;
    return `http://${host}:${port}${path}`;
  }

  async getOAuthStatus(): Promise<ConnectorOAuthStatus> {
    const entry = await readEntry(this.config);
    if (!entry) {
      return { connected: false, pendingAuthorization: false };
    }

    const connected = !!(entry.accessToken?.trim() || entry.refreshToken?.trim());

    const pendingAuthorization =
      !connected &&
      typeof entry.oauthState === 'string' &&
      entry.oauthState.trim().length > 0 &&
      typeof entry.codeVerifier === 'string' &&
      entry.codeVerifier.trim().length > 0;

    return {
      connected,
      pendingAuthorization,
      lastValidatedAt: entry.lastOAuthValidatedAt,
    };
  }

  async getAccessToken(): Promise<string | undefined> {
    const entry = await readEntry(this.config);
    return entry?.accessToken?.trim() || undefined;
  }

  async getServerUrl(): Promise<string | undefined> {
    if (this.config.serverUrl) {
      return this.config.serverUrl;
    }
    if (!this.config.storesServerUrl) {
      return undefined;
    }
    const entry = await readEntry(this.config);
    return entry?.serverUrl?.trim() || undefined;
  }

  async setServerUrl(url: string): Promise<void> {
    if (!this.config.storesServerUrl) {
      return;
    }
    const normalized = url.trim();
    const existing = (await readEntry(this.config)) ?? {};
    const previousUrl = existing.serverUrl?.trim();

    const next: StoredAuthEntry =
      previousUrl === normalized
        ? { ...existing, serverUrl: normalized }
        : { serverUrl: normalized };

    await writeEntry(this.config, next);
  }

  async getClientRegistration(): Promise<OAuthClientRegistration | undefined> {
    if (!this.config.usesDcr) {
      return undefined;
    }
    const entry = await readEntry(this.config);
    const reg = entry?.clientRegistration;
    return reg?.clientId ? reg : undefined;
  }

  async setClientRegistration(reg: OAuthClientRegistration): Promise<void> {
    if (!this.config.usesDcr) {
      return;
    }
    const existing = (await readEntry(this.config)) ?? {};
    await writeEntry(this.config, { ...existing, clientRegistration: reg });
  }

  async setPendingAuth(params: { codeVerifier: string; oauthState: string }): Promise<void> {
    const existing = (await readEntry(this.config)) ?? {};
    const next: StoredAuthEntry = {
      codeVerifier: params.codeVerifier,
      oauthState: params.oauthState,
      serverUrl: resolveServerUrl(this.config, existing),
    };
    if (this.config.usesDcr && existing.clientRegistration) {
      next.clientRegistration = existing.clientRegistration;
    }
    await writeEntry(this.config, next);
  }

  async setTokens(tokens: OAuthTokens, lastValidatedAt?: number): Promise<void> {
    const existing = (await readEntry(this.config)) ?? {};
    const next: StoredAuthEntry = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      lastOAuthValidatedAt: lastValidatedAt ?? Date.now(),
      serverUrl: resolveServerUrl(this.config, existing),
    };
    if (this.config.usesDcr && existing.clientRegistration) {
      next.clientRegistration = existing.clientRegistration;
    }
    await writeEntry(this.config, next);
  }

  async setLastValidatedAt(timestamp: number): Promise<void> {
    const existing = (await readEntry(this.config)) ?? {};
    await writeEntry(this.config, { ...existing, lastOAuthValidatedAt: timestamp });
  }

  async clearTokens(): Promise<void> {
    const existing = await readEntry(this.config);
    if (!existing) {
      return;
    }
    const preserved: StoredAuthEntry = {};
    if (this.config.usesDcr && existing.clientRegistration) {
      preserved.clientRegistration = existing.clientRegistration;
    }
    if (this.config.storesServerUrl && existing.serverUrl) {
      preserved.serverUrl = existing.serverUrl;
    }
    if (Object.keys(preserved).length === 0) {
      await deleteEntry(this.config);
    } else {
      await writeEntry(this.config, preserved);
    }
  }

  async clearAuth(): Promise<void> {
    await deleteEntry(this.config);
  }

  async getRefreshToken(): Promise<string | undefined> {
    return (await readEntry(this.config))?.refreshToken;
  }

  async getTokenExpiry(): Promise<number | undefined> {
    return (await readEntry(this.config))?.expiresAt;
  }
}
