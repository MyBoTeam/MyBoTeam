import { createChildLogger } from '../storage/logger.js';
import type { TokenProvider } from './vault-types.js';

export type { TokenProvider };

export interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export class RefreshService {
  private providers: Map<string, TokenProvider> = new Map();
  private log: ReturnType<typeof createChildLogger>;

  constructor() {
    this.log = createChildLogger({ module: 'vault-refresh' });
  }

  registerProvider(name: string, provider: TokenProvider): void {
    if (this.providers.has(name)) {
      throw new Error(`Provider "${name}" already registered`);
    }
    this.providers.set(name, provider);
    this.log.info({ provider: name }, 'Token provider registered');
  }

  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  async refresh(
    providerName: string,
    refreshToken: string,
    scope: string[],
  ): Promise<RefreshResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`No provider registered for "${providerName}"`);
    }

    this.log.info({ provider: providerName }, 'Token refresh initiated');

    try {
      const result = await provider.refresh(refreshToken, scope);
      this.log.info({ provider: providerName }, 'Token refresh completed');
      return result;
    } catch (error) {
      this.log.error({ provider: providerName, err: error }, 'Token refresh failed');
      throw error;
    }
  }
}

export class GoogleTokenProvider implements TokenProvider {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  supports(provider: string): boolean {
    return provider === 'google';
  }

  async refresh(refreshToken: string, scope: string[]): Promise<RefreshResult> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: scope.join(' '),
      }),
    });

    if (!response.ok) {
      throw new Error(`Google token refresh failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string | undefined,
      expiresIn: data.expires_in as number,
    };
  }
}

export class GitHubTokenProvider implements TokenProvider {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  supports(provider: string): boolean {
    return provider === 'github';
  }

  async refresh(refreshToken: string, scope: string[]): Promise<RefreshResult> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: scope.join(' '),
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub token refresh failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string | undefined,
      expiresIn: data.expires_in as number,
    };
  }
}
