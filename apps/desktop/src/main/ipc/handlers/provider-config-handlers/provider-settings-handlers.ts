import type {
  ConnectedProvider,
  ProviderId,
  SelectedModel,
} from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import { getDaemonClient } from '../../../daemon-bootstrap';
import { cleanupVertexServiceAccountKey } from '../../../opencode';
import { registerVertexHandlers } from '../../../providers';
import type { IpcHandler } from '../../types';
import { isDaemonUnavailableError } from '../utils';

const EMPTY_PROVIDER_SETTINGS = {
  connectedProviders: {},
  activeProviderId: null,
  selectedModel: null,
  debugMode: false,
};

export function registerProviderSettingsHandlers(handle: IpcHandler): void {
  handle('model:get', async (_event: IpcMainInvokeEvent) => {
    try {
      return await getDaemonClient().call('settings.getSelectedModel');
    } catch (err) {
      if (isDaemonUnavailableError(err)) return null;
      throw err;
    }
  });

  handle('model:set', async (_event: IpcMainInvokeEvent, model: SelectedModel) => {
    if (!model || typeof model.provider !== 'string' || typeof model.model !== 'string') {
      throw new Error('Invalid model configuration');
    }
    await getDaemonClient().call('settings.setSelectedModel', { model });
  });

  handle('provider-settings:get', async () => {
    try {
      return await getDaemonClient().call('provider.getSettings');
    } catch (err) {
      if (isDaemonUnavailableError(err)) return EMPTY_PROVIDER_SETTINGS;
      throw err;
    }
  });

  handle(
    'provider-settings:set-active',
    async (_event: IpcMainInvokeEvent, providerId: ProviderId | null) => {
      await getDaemonClient().call('provider.setActive', { providerId });
    },
  );

  handle(
    'provider-settings:get-connected',
    async (_event: IpcMainInvokeEvent, providerId: ProviderId) => {
      const settings = await getDaemonClient().call('provider.getSettings');
      return settings.connectedProviders[providerId] ?? null;
    },
  );

  handle(
    'provider-settings:set-connected',
    async (_event: IpcMainInvokeEvent, providerId: ProviderId, provider: ConnectedProvider) => {
      await getDaemonClient().call('provider.setConnected', { providerId, provider });
    },
  );

  handle(
    'provider-settings:remove-connected',
    async (_event: IpcMainInvokeEvent, providerId: ProviderId) => {
      await getDaemonClient().call('provider.removeConnected', { providerId });
      if (providerId === 'vertex') {
        cleanupVertexServiceAccountKey();
      }
    },
  );

  handle(
    'provider-settings:update-model',
    async (_event: IpcMainInvokeEvent, providerId: ProviderId, modelId: string | null) => {
      await getDaemonClient().call('provider.updateModel', { providerId, modelId });
    },
  );

  handle('provider-settings:set-debug', async (_event: IpcMainInvokeEvent, enabled: boolean) => {
    await getDaemonClient().call('provider.setDebugMode', { enabled });
  });

  handle('provider-settings:get-debug', async () => {
    return getDaemonClient().call('provider.getDebugMode');
  });

  registerVertexHandlers(handle);
}
