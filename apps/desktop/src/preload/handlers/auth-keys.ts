import type { ProviderType } from '@myboteam/agent-core/desktop-main';
import { ipcRenderer } from 'electron';

export const authKeyHandlers = {
  getApiKeys: (): Promise<unknown[]> => ipcRenderer.invoke('settings:api-keys'),
  addApiKey: (provider: ProviderType, key: string, label?: string): Promise<unknown> =>
    ipcRenderer.invoke('settings:add-api-key', provider, key, label),
  removeApiKey: (id: string): Promise<void> => ipcRenderer.invoke('settings:remove-api-key', id),

  getOpenAiOauthStatus: (): Promise<{ connected: boolean; expires?: number }> =>
    ipcRenderer.invoke('opencode:auth:openai:status'),
  loginOpenAiWithChatGpt: (): Promise<{ ok: boolean; openedUrl?: string }> =>
    ipcRenderer.invoke('opencode:auth:openai:login'),
  getSlackMcpOauthStatus: (): Promise<{ connected: boolean; pendingAuthorization: boolean }> =>
    ipcRenderer.invoke('opencode:auth:slack:status'),
  loginSlackMcp: (): Promise<{ ok: boolean }> => ipcRenderer.invoke('opencode:auth:slack:login'),
  logoutSlackMcp: (): Promise<void> => ipcRenderer.invoke('opencode:auth:slack:logout'),
  getCopilotOAuthStatus: (): Promise<{
    connected: boolean;
    username?: string;
    expiresAt?: number;
  }> => ipcRenderer.invoke('opencode:auth:copilot:status'),
  loginGithubCopilot: (): Promise<{
    ok: boolean;
    userCode?: string;
    verificationUri?: string;
    expiresIn?: number;
  }> => ipcRenderer.invoke('opencode:auth:copilot:login'),
  logoutGithubCopilot: (): Promise<void> => ipcRenderer.invoke('opencode:auth:copilot:logout'),

  hasApiKey: (): Promise<boolean> => ipcRenderer.invoke('api-key:exists'),
  setApiKey: (key: string): Promise<void> => ipcRenderer.invoke('api-key:set', key),
  getApiKey: (): Promise<string | null> => ipcRenderer.invoke('api-key:get'),
  validateApiKey: (key: string): Promise<{ valid: boolean; error?: string }> =>
    ipcRenderer.invoke('api-key:validate', key),
  validateApiKeyForProvider: (
    provider: string,
    key: string,
    options?: Record<string, unknown>,
  ): Promise<{ valid: boolean; error?: string }> =>
    ipcRenderer.invoke('api-key:validate-provider', provider, key, options),
  clearApiKey: (): Promise<void> => ipcRenderer.invoke('api-key:clear'),

  getAllApiKeys: (): Promise<Record<string, { exists: boolean; prefix?: string }>> =>
    ipcRenderer.invoke('api-keys:all'),
  hasAnyApiKey: (): Promise<boolean> => ipcRenderer.invoke('api-keys:has-any'),
};
