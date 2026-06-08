import { registerApiKeyValidationHandlers } from './api-key-handlers/api-key-validation-handlers';
import { registerBedrockHandlers } from './api-key-handlers/bedrock-handlers';
import { registerModelDiscoveryHandlers } from './api-key-handlers/model-discovery-handlers';

import { registerSettingsApiKeyHandlers } from './api-key-handlers/settings-api-key-handlers';

export function registerApiKeyHandlers(): void {
  registerSettingsApiKeyHandlers();
  registerApiKeyValidationHandlers();
  registerBedrockHandlers();
  registerModelDiscoveryHandlers();
}
