import { describe, expect, it, vi } from 'vitest';

const mockRegisterOllama = vi.hoisted(() => vi.fn());
const mockRegisterAzure = vi.hoisted(() => vi.fn());
const mockRegisterLiteLLM = vi.hoisted(() => vi.fn());
const mockRegisterLMStudio = vi.hoisted(() => vi.fn());
const mockRegisterNim = vi.hoisted(() => vi.fn());
const mockRegisterSettings = vi.hoisted(() => vi.fn());

vi.mock('@main/ipc/handlers/provider-config-handlers/ollama-handlers', () => ({
  registerOllamaHandlers: mockRegisterOllama,
}));

vi.mock('@main/ipc/handlers/provider-config-handlers/azure-foundry-handlers', () => ({
  registerAzureFoundryHandlers: mockRegisterAzure,
}));

vi.mock('@main/ipc/handlers/provider-config-handlers/litellm-handlers', () => ({
  registerLiteLLMHandlers: mockRegisterLiteLLM,
}));

vi.mock('@main/ipc/handlers/provider-config-handlers/lmstudio-handlers', () => ({
  registerLMStudioHandlers: mockRegisterLMStudio,
}));

vi.mock('@main/ipc/handlers/provider-config-handlers/nim-handlers', () => ({
  registerNimHandlers: mockRegisterNim,
}));

vi.mock('@main/ipc/handlers/provider-config-handlers/provider-settings-handlers', () => ({
  registerProviderSettingsHandlers: mockRegisterSettings,
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  handle: vi.fn(),
}));

import { registerProviderConfigHandlers } from '@main/ipc/handlers/provider-config-handlers';

describe('provider-config-handlers', () => {
  it('should register all provider config sub-handlers', () => {
    registerProviderConfigHandlers();
    expect(mockRegisterOllama).toHaveBeenCalled();
    expect(mockRegisterAzure).toHaveBeenCalled();
    expect(mockRegisterLiteLLM).toHaveBeenCalled();
    expect(mockRegisterLMStudio).toHaveBeenCalled();
    expect(mockRegisterNim).toHaveBeenCalled();
    expect(mockRegisterSettings).toHaveBeenCalled();
  });
});
