import type { ZaiRegion } from '@myboteam/agent-core/desktop-main';
import {
  DEFAULT_PROVIDERS,
  fetchOpenRouterModels,
  fetchProviderModels,
  ZAI_ENDPOINTS,
} from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import { ensureDaemonRunning } from '../../../daemon/daemon-connector';
import { getApiKey } from '../../../store/secureStorage';
import { API_KEY_VALIDATION_TIMEOUT_MS, handle } from '../utils';

export function registerModelDiscoveryHandlers(): void {
  handle('openrouter:fetch-models', async (_event: IpcMainInvokeEvent) => {
    const apiKey = await getApiKey('openrouter');
    return fetchOpenRouterModels(apiKey || '', API_KEY_VALIDATION_TIMEOUT_MS);
  });

  handle(
    'provider:fetch-models',
    async (
      _event: IpcMainInvokeEvent,
      providerId: string,
      options?: { baseUrl?: string; zaiRegion?: string },
    ) => {
      const providerConfig = DEFAULT_PROVIDERS.find((p) => p.id === providerId);
      if (!providerConfig?.modelsEndpoint) {
        return { success: false, error: 'No models endpoint configured for this provider' };
      }

      const storedApiKey = await getApiKey(providerId);
      let apiKey: string | null = storedApiKey || null;
      if (!apiKey && providerId === 'openai') {
        const client = await ensureDaemonRunning();
        apiKey = await client.call('auth.openai.getAccessToken');
      }
      if (!apiKey) {
        return { success: false, error: 'No API key found for this provider' };
      }

      let urlOverride: string | undefined;
      let endpointConfig = providerConfig.modelsEndpoint;
      if (providerId === 'openai' && typeof options?.baseUrl === 'string' && options.baseUrl) {
        urlOverride = `${options.baseUrl.replace(/\/+$/, '')}/models`;
        endpointConfig = { ...endpointConfig, modelFilter: undefined };
      }
      if (providerId === 'zai' && options?.zaiRegion) {
        const region = options.zaiRegion as ZaiRegion;
        urlOverride = `${ZAI_ENDPOINTS[region]}/models`;
      }

      return fetchProviderModels({
        endpointConfig,
        apiKey,
        urlOverride,
        timeout: API_KEY_VALIDATION_TIMEOUT_MS,
      });
    },
  );
}
