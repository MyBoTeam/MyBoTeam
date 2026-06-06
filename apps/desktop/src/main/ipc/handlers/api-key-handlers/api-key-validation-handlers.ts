import {
  ALLOWED_API_KEY_PROVIDERS,
  STANDARD_VALIDATION_PROVIDERS,
  sanitizeString,
  validateApiKey,
  validateAzureFoundry,
} from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import { ensureDaemonRunning } from '../../../daemon/daemon-connector';
import { getDaemonClient } from '../../../daemon-bootstrap';
import { getLogCollector } from '../../../logging';
import { deleteApiKey, getApiKey, hasAnyApiKey, storeApiKey } from '../../../store/secureStorage';
import { API_KEY_VALIDATION_TIMEOUT_MS, handle } from '../utils';
import { normalizeProviderOptions } from './api-key-validation-types';

export function registerApiKeyValidationHandlers(): void {
  handle('api-key:exists', async (_event: IpcMainInvokeEvent) => {
    const apiKey = await getApiKey('anthropic');
    return Boolean(apiKey);
  });

  handle('api-key:set', async (_event: IpcMainInvokeEvent, key: string) => {
    const sanitizedKey = sanitizeString(key, 'apiKey', 256);
    await storeApiKey('anthropic', sanitizedKey);
  });

  handle('api-key:get', async (_event: IpcMainInvokeEvent) => {
    return await getApiKey('anthropic');
  });

  handle('api-key:validate', async (_event: IpcMainInvokeEvent, key: string) => {
    const sanitizedKey = sanitizeString(key, 'apiKey', 256);
    const logger = getLogCollector();
    logger.logEnv('INFO', '[API Key] Validation requested for provider: anthropic');

    const result = await validateApiKey('anthropic', sanitizedKey, {
      timeout: API_KEY_VALIDATION_TIMEOUT_MS,
    });

    if (result.valid) {
      logger.logEnv('INFO', '[API Key] Validation succeeded');
    } else {
      logger.logEnv('WARN', '[API Key] Validation failed', { error: result.error });
    }

    return result;
  });

  handle(
    'api-key:validate-provider',
    async (
      _event: IpcMainInvokeEvent,
      provider: string,
      key: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawOptions?: Record<string, any>,
    ) => {
      if (!ALLOWED_API_KEY_PROVIDERS.has(provider)) {
        return { valid: false, error: 'Unsupported provider' };
      }

      const options = normalizeProviderOptions(rawOptions);
      const logger = getLogCollector();
      logger.logEnv('INFO', `[API Key] Validation requested for provider: ${provider}`);

      if (STANDARD_VALIDATION_PROVIDERS.has(provider)) {
        let sanitizedKey: string;
        try {
          sanitizedKey = sanitizeString(key, 'apiKey', 256);
        } catch (e) {
          return { valid: false, error: e instanceof Error ? e.message : 'Invalid API key' };
        }

        let openAiBaseUrlFallback: string | undefined;
        if (provider === 'openai') {
          const rawBaseUrl = options?.baseUrl;
          if (typeof rawBaseUrl === 'string' && rawBaseUrl.trim()) {
            openAiBaseUrlFallback = rawBaseUrl.trim();
          } else {
            try {
              const stored = await getDaemonClient().call('settings.getOpenAiBaseUrl');
              openAiBaseUrlFallback = stored.trim() || undefined;
            } catch {
              openAiBaseUrlFallback = undefined;
            }
          }
        }

        const result = await validateApiKey(
          provider as import('@myboteam/agent-core').ProviderType,
          sanitizedKey,
          {
            timeout: API_KEY_VALIDATION_TIMEOUT_MS,
            baseUrl: openAiBaseUrlFallback,
            zaiRegion: provider === 'zai' ? options?.zaiRegion || 'international' : undefined,
          },
        );

        if (result.valid) {
          logger.logEnv('INFO', `[API Key] Validation succeeded for ${provider}`);
        } else {
          logger.logEnv('WARN', `[API Key] Validation failed for ${provider}`, {
            error: result.error,
          });
        }

        return result;
      }

      if (provider === 'azure-foundry') {
        const config = await getDaemonClient().call('settings.getAzureFoundryConfig');
        const result = await validateAzureFoundry(config, {
          apiKey: key,
          baseUrl: typeof options?.baseUrl === 'string' ? options.baseUrl : undefined,
          deploymentName: options?.deploymentName,
          authType: options?.authType as 'api-key' | 'entra-id' | undefined,
          timeout: API_KEY_VALIDATION_TIMEOUT_MS,
        });

        if (result.valid) {
          logger.logEnv('INFO', `[API Key] Validation succeeded for ${provider}`);
        } else {
          logger.logEnv('WARN', `[API Key] Validation failed for ${provider}`, {
            error: result.error,
          });
        }

        return result;
      }

      logger.logEnv(
        'INFO',
        `[API Key] Skipping validation for ${provider} (local/custom provider)`,
      );
      return { valid: true };
    },
  );

  handle('api-key:clear', async (_event: IpcMainInvokeEvent) => {
    await deleteApiKey('anthropic');
  });

  handle('api-keys:all', async (_event: IpcMainInvokeEvent) => {
    const keys = await getAllApiKeys();
    const masked: Record<string, { exists: boolean; prefix?: string }> = {};
    for (const [provider, key] of Object.entries(keys)) {
      masked[provider] = {
        exists: Boolean(key),
        prefix: key ? `${key.substring(0, 8)}...` : undefined,
      };
    }
    return masked;
  });

  handle('api-keys:has-any', async (_event: IpcMainInvokeEvent) => {
    const { isMockTaskEventsEnabled } = await import('../../../test-utils/mock-task-flow');
    if (isMockTaskEventsEnabled()) {
      return true;
    }
    const hasKey = await hasAnyApiKey();
    if (hasKey) return true;
    const client = await ensureDaemonRunning();
    const status = await client.call('auth.openai.status');
    return status.connected;
  });
}

// Re-export getAllApiKeys for use by other sub-modules
import { getAllApiKeys } from '../../../store/secureStorage';

export { getAllApiKeys };
