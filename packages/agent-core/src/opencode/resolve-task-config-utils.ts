import { isTokenExpired, refreshAccessToken } from '../connectors/oauth-tokens.js';
import type { StorageAPI } from '../types/storage.js';
import type { ProviderConfig } from './config-generator.js';
import type { BrowserConfig } from './generator-mcp.js';

export function injectOpenAiStoreFlag(
  providerConfigs: ProviderConfig[],
  getApiKey: (provider: string) => string | null,
): void {
  const openAiApiKey = getApiKey('openai');
  if (!openAiApiKey) {
    return;
  }
  const existing = providerConfigs.find((p) => p.id === 'openai');
  if (existing) {
    existing.options.store = false;
  } else {
    providerConfigs.push({ id: 'openai', options: { store: false } });
  }
}

export async function resolveConnectors(
  storage: StorageAPI,
  log: (level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: Record<string, unknown>) => void,
): Promise<Array<{ id: string; name: string; url: string; accessToken: string }>> {
  const enabledConnectors = storage.getEnabledConnectors();
  const result: Array<{ id: string; name: string; url: string; accessToken: string }> = [];

  for (const connector of enabledConnectors) {
    if (connector.status !== 'connected') {
      continue;
    }

    let tokens = storage.getConnectorTokens(connector.id);
    if (!tokens?.accessToken) {
      log('WARN', `[resolveTaskConfig] Missing access token for ${connector.name}`);
      storage.setConnectorStatus(connector.id, 'error');
      continue;
    }

    if (isTokenExpired(tokens)) {
      if (tokens.refreshToken && connector.oauthMetadata && connector.clientRegistration) {
        try {
          tokens = await refreshAccessToken({
            tokenEndpoint: connector.oauthMetadata.tokenEndpoint,
            refreshToken: tokens.refreshToken,
            clientId: connector.clientRegistration.clientId,
            clientSecret: connector.clientRegistration.clientSecret,
          });
          storage.storeConnectorTokens(connector.id, tokens);
        } catch (err) {
          log('WARN', `[resolveTaskConfig] Token refresh failed for ${connector.name}`, {
            err: String(err),
          });
          storage.setConnectorStatus(connector.id, 'error');
          continue;
        }
      } else {
        log('WARN', `[resolveTaskConfig] Token expired for ${connector.name} and cannot refresh`);
        storage.setConnectorStatus(connector.id, 'error');
        continue;
      }
    }

    result.push({
      id: connector.id,
      name: connector.name,
      url: connector.url,
      accessToken: tokens.accessToken,
    });
  }

  return result;
}

export function resolveCloudBrowser(storage: StorageAPI): BrowserConfig | undefined {
  const cloudBrowserConfig = storage.getCloudBrowserConfig();
  if (!cloudBrowserConfig?.activeProvider) {
    return undefined;
  }
  const providerCfg = cloudBrowserConfig.providers[cloudBrowserConfig.activeProvider];
  if (!providerCfg?.endpoint) {
    return undefined;
  }
  return {
    mode: 'remote',
    cdpEndpoint: providerCfg.endpoint,
    cdpHeaders: providerCfg.apiKey ? { 'X-CDP-Secret': providerCfg.apiKey } : undefined,
  };
}
