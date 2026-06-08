import type {
  GoogleAccount,
  GoogleAccountStatus,
  MessagingConnectionStatus,
} from '@myboteam/agent-core/common';

export type ProviderUnion =
  | 'anthropic'
  | 'openai'
  | 'openrouter'
  | 'google'
  | 'xai'
  | 'deepseek'
  | 'moonshot'
  | 'zai'
  | 'azure-foundry'
  | 'custom'
  | 'bedrock'
  | 'litellm'
  | 'lmstudio'
  | 'nebius'
  | 'together'
  | 'fireworks'
  | 'groq'
  | 'elevenlabs'
  | 'nim'
  | 'minimax'
  | 'vertex'
  | 'venice'
  | 'aws-agentcore'
  | 'browserbase'
  | 'steel';

export interface GwsAPI {
  listAccounts(): Promise<GoogleAccount[]>;
  startAuth(label: string): Promise<{ state: string; authUrl: string }>;
  completeAuth(state: string, code: string): Promise<GoogleAccount>;
  removeAccount(id: string): Promise<void>;
  updateLabel(id: string, label: string): Promise<void>;
  cancelAuth(state: string): Promise<void>;
  onStatusChanged(callback: (id: string, status: GoogleAccountStatus) => void): () => void;
  onAuthError(callback: (payload: { message: string }) => void): () => void;
}

export interface AppInfo {
  version: string;
  platform: string;
  arch: string;
  electronVersion: string;
  nodeVersion: string;
}

export type ThemeChangeData = { theme: string; resolved: string };
export type ThemeColorChangeData = { themeColor: string };
export type AppSettingsData = {
  debugMode: boolean;
  onboardingComplete: boolean;
  theme: string;
  language: string;
};
export type WhatsAppConfigData = {
  providerId: string;
  enabled: boolean;
  status: MessagingConnectionStatus;
  phoneNumber?: string;
  lastConnectedAt?: number;
  qrCode?: string;
  qrIssuedAt?: number;
} | null;
export type OpenAiOauthStatusData = { connected: boolean; expires?: number };
export type CopilotOAuthStatusData = {
  connected: boolean;
  username?: string;
  expiresAt?: number;
};
export type CopilotLoginResultData = {
  ok: boolean;
  userCode?: string;
  verificationUri?: string;
  expiresIn?: number;
};
export type SlackOauthStatusData = {
  connected: boolean;
  pendingAuthorization: boolean;
};
export type ValidationResult = { valid: boolean; error?: string };
export type OpenCodeCliCheckResult = {
  installed: boolean;
  version: string | null;
  installCommand: string;
};
export type SelectedModelData = {
  provider: string;
  model: string;
  baseUrl?: string;
  deploymentName?: string;
} | null;
export type SimpleResult = { success: boolean };
export type SimpleResultWithError = { success: boolean; error?: string };
export type SpeechConfigData = {
  enabled: boolean;
  hasApiKey: boolean;
  apiKeyPrefix?: string;
};
export type SandboxConfigData = {
  mode: 'disabled' | 'native' | 'docker';
  allowedPaths: string[];
  networkRestricted: boolean;
  allowedHosts: string[];
  dockerImage?: string;
  networkPolicy?: { allowOutbound: boolean; allowedHosts?: string[] };
};
export type DaemonPingResult = { status: string; uptime: number };
export type SpeechTranscriptionResult =
  | {
      success: true;
      result: { text: string; confidence?: number; duration: number; timestamp: number };
    }
  | { success: false; error: { code: string; message: string } };
export type ScreenshotResult = {
  success: boolean;
  data?: string;
  width?: number;
  height?: number;
  error?: string;
};
export type AxtreeResult = { success: boolean; data?: string; error?: string };
export type BugReportResult = {
  success: boolean;
  path?: string;
  error?: string;
  reason?: string;
};

interface MyBoTeamShell {
  version: string;
  platform: string;
  isElectron: true;
}

declare global {
  interface Window {
    myboteamShell?: MyBoTeamShell;
  }
}
