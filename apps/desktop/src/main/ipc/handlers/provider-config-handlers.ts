import { registerAzureFoundryHandlers } from './provider-config-handlers/azure-foundry-handlers';
import { registerLiteLLMHandlers } from './provider-config-handlers/litellm-handlers';
import { registerLMStudioHandlers } from './provider-config-handlers/lmstudio-handlers';
import { registerMyboteamAiHandlers } from './provider-config-handlers/myboteam-ai-handlers';
import { registerNimHandlers } from './provider-config-handlers/nim-handlers';
import { registerOllamaHandlers } from './provider-config-handlers/ollama-handlers';
import { registerProviderSettingsHandlers } from './provider-config-handlers/provider-settings-handlers';
import { handle } from './utils';

export function registerProviderConfigHandlers(): void {
  registerOllamaHandlers(handle);
  registerAzureFoundryHandlers(handle);
  registerLiteLLMHandlers(handle);
  registerLMStudioHandlers(handle);
  registerNimHandlers(handle);
  registerMyboteamAiHandlers(handle);
  registerProviderSettingsHandlers(handle);
}
