import { registerApiKeyValidationHandlers } from './api-key-handlers/api-key-validation-handlers';
import { registerBedrockHandlers } from './api-key-handlers/bedrock-handlers';
import { registerModelDiscoveryHandlers } from './api-key-handlers/model-discovery-handlers';

import { registerSettingsApiKeyHandlers } from './api-key-handlers/settings-api-key-handlers';

export {
  ALLOWED_API_KEY_PROVIDERS,
  fetchBedrockModels,
  fetchProviderModels,
  sanitizeString,
  validateApiKey,
  validateAzureFoundry,
} from '@myboteam/agent-core/desktop-main';
export { storeApiKey } from '../../store/secureStorage';

export type { ProviderOptions } from './api-key-handlers/api-key-validation-types';
export { API_KEY_VALIDATION_TIMEOUT_MS } from './utils';

export function registerApiKeyHandlers(): void {
  registerSettingsApiKeyHandlers();
  registerApiKeyValidationHandlers();
  registerBedrockHandlers();
  registerModelDiscoveryHandlers();
}
