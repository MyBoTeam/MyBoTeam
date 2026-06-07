import type { LMStudioConfig } from '@myboteam/agent-core/desktop-main';
import {
  fetchLMStudioModels,
  sanitizeString,
  testCustomConnection,
  testLMStudioConnection,
  validateLMStudioConfig,
} from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import { getDaemonClient } from '../../../daemon-bootstrap';
import type { IpcHandler } from '../../types';

export function registerLMStudioHandlers(handle: IpcHandler): void {
  handle('lmstudio:test-connection', async (_event: IpcMainInvokeEvent, url: string) => {
    return testLMStudioConnection({ url });
  });

  handle('lmstudio:fetch-models', async (_event: IpcMainInvokeEvent) => {
    const config = await getDaemonClient().call('settings.getLMStudioConfig');
    if (!config?.baseUrl) {
      return { success: false, error: 'No LM Studio configured' };
    }
    return fetchLMStudioModels({ baseUrl: config.baseUrl });
  });

  handle('lmstudio:get-config', async (_event: IpcMainInvokeEvent) => {
    return getDaemonClient().call('settings.getLMStudioConfig');
  });

  handle(
    'lmstudio:set-config',
    async (_event: IpcMainInvokeEvent, config: LMStudioConfig | null) => {
      if (config !== null) {
        validateLMStudioConfig(config);
      }
      await getDaemonClient().call('settings.setLMStudioConfig', { config });
    },
  );

  handle(
    'custom:test-connection',
    async (_event: IpcMainInvokeEvent, baseUrl: string, apiKey?: string) => {
      try {
        const sanitizedUrl = sanitizeString(baseUrl, 'baseUrl', 256);
        const sanitizedApiKey = apiKey ? sanitizeString(apiKey, 'apiKey', 512) : undefined;
        return testCustomConnection(sanitizedUrl, sanitizedApiKey);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Connection test failed',
        };
      }
    },
  );
}
