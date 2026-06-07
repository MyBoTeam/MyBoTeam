import { ALLOWED_API_KEY_PROVIDERS, sanitizeString } from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import { getDaemonClient } from '../../../daemon-bootstrap';
import {
  deleteApiKey,
  getAllApiKeys,
  getBedrockCredentials,
  storeApiKey,
} from '../../../store/secureStorage';
import { handle } from '../utils';

const CLOUD_BROWSER_PROVIDERS = new Set(['aws-agentcore', 'browserbase', 'steel']);

export function registerSettingsApiKeyHandlers(): void {
  handle('settings:api-keys', async (_event: IpcMainInvokeEvent) => {
    const storedKeys = await getAllApiKeys();

    const bedrockCreds = storedKeys.bedrock ? await getBedrockCredentials() : null;

    const keys = Object.entries(storedKeys)
      .filter(([_provider, apiKey]) => apiKey !== null)
      .map(([provider, apiKey]) => {
        let keyPrefix = '';
        if (provider === 'bedrock') {
          if (bedrockCreds) {
            if (bedrockCreds.authType === 'accessKeys') {
              keyPrefix = `${bedrockCreds.accessKeyId?.substring(0, 8) || 'AKIA'}...`;
            } else if (bedrockCreds.authType === 'profile') {
              keyPrefix = `Profile: ${bedrockCreds.profileName || 'default'}`;
            } else {
              keyPrefix = 'AWS Credentials';
            }
          } else {
            keyPrefix = 'AWS Credentials';
          }
        } else if (provider === 'vertex') {
          try {
            const vertexCreds = apiKey ? JSON.parse(apiKey) : null;
            if (vertexCreds?.projectId) {
              keyPrefix = `${vertexCreds.projectId} (${vertexCreds.location || 'unknown'})`;
            } else {
              keyPrefix = 'GCP Credentials';
            }
          } catch {
            keyPrefix = 'GCP Credentials';
          }
        } else {
          keyPrefix = apiKey && apiKey.length > 0 ? `${apiKey.substring(0, 8)}...` : '';
        }

        let label: string;
        if (provider === 'bedrock') {
          if (bedrockCreds?.authType === 'accessKeys') {
            label = 'AWS Access Keys';
          } else if (bedrockCreds?.authType === 'profile') {
            label = `AWS Profile: ${bedrockCreds.profileName || 'default'}`;
          } else if (bedrockCreds?.authType === 'apiKey') {
            label = 'Bedrock API Key';
          } else {
            label = 'AWS Credentials';
          }
        } else if (provider === 'vertex') {
          try {
            const vertexCreds = apiKey ? JSON.parse(apiKey) : null;
            label =
              vertexCreds?.authType === 'serviceAccount'
                ? 'Service Account'
                : 'Application Default Credentials';
          } catch {
            label = 'GCP Credentials';
          }
        } else {
          label = 'Local API Key';
        }

        return {
          id: `local-${provider}`,
          provider,
          label,
          keyPrefix,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      });

    const azureConfig = await getDaemonClient().call('settings.getAzureFoundryConfig');
    const hasAzureKey = keys.some((k) => k.provider === 'azure-foundry');

    if (azureConfig && azureConfig.authType === 'entra-id' && !hasAzureKey) {
      keys.push({
        id: 'local-azure-foundry',
        provider: 'azure-foundry',
        label: 'Azure Foundry (Entra ID)',
        keyPrefix: 'Entra ID',
        isActive: azureConfig.enabled ?? true,
        createdAt: new Date().toISOString(),
      });
    }

    return keys;
  });

  handle(
    'settings:add-api-key',
    async (_event: IpcMainInvokeEvent, provider: string, key: string, label?: string) => {
      if (!ALLOWED_API_KEY_PROVIDERS.has(provider)) {
        throw new Error('Unsupported API key provider');
      }

      if (CLOUD_BROWSER_PROVIDERS.has(provider)) {
        throw new Error(
          `Provider '${provider}' keys must be saved via the cloud browser settings panel`,
        );
      }

      const maxKeyLength = provider === 'vertex' ? 8192 : 256;
      const sanitizedKey = sanitizeString(key, 'apiKey', maxKeyLength);
      const sanitizedLabel = label ? sanitizeString(label, 'label', 128) : undefined;

      await storeApiKey(provider, sanitizedKey);

      return {
        id: `local-${provider}`,
        provider,
        label: sanitizedLabel || 'Local API Key',
        keyPrefix: `${sanitizedKey.substring(0, 8)}...`,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
    },
  );

  handle('settings:remove-api-key', async (_event: IpcMainInvokeEvent, id: string) => {
    const sanitizedId = sanitizeString(id, 'id', 128);
    const provider = sanitizedId.replace('local-', '');

    if (provider === 'azure-foundry') {
      const client = getDaemonClient();
      const existingConfig = await client.call('settings.getAzureFoundryConfig');
      if (existingConfig) {
        await client.call('settings.setAzureFoundryConfig', {
          config: { ...existingConfig, enabled: false, authType: 'api-key' },
        });
      }
      return;
    }

    await deleteApiKey(provider);
  });
}
