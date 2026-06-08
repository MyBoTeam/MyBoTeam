import type {
  AppSettings,
  LanguagePreference,
  ThemeColorPreference,
  ThemePreference,
} from '../../../types/storage.js';
import type { CloudBrowserConfig } from '../cloud-browser.js';
import type { GoogleAccountStatus, GoogleAccountToken } from '../google-account.js';
import type { MessagingConfig } from '../messaging.js';
import type {
  AzureFoundryConfig,
  HuggingFaceLocalConfig,
  LiteLLMConfig,
  LMStudioConfig,
  NimConfig,
  OllamaConfig,
  SelectedModel,
} from '../provider.js';
import type { ProviderSettings } from '../providerSettings.js';
import type { SandboxConfig } from '../sandbox.js';

export interface SettingsSnapshot {
  app: AppSettings;
  providers: ProviderSettings;
  huggingFaceLocalConfig: HuggingFaceLocalConfig | null;
  notificationsEnabled: boolean;
  closeBehavior: 'keep-daemon' | 'stop-daemon';
  sandboxConfig: SandboxConfig;
  cloudBrowserConfig: CloudBrowserConfig | null;
  messagingConfig: MessagingConfig | null;
  nimConfig: NimConfig | null;
}

export type SettingsChangePayload =
  | { key: 'theme'; value: ThemePreference }
  | { key: 'themeColor'; value: ThemeColorPreference }
  | { key: 'language'; value: LanguagePreference }
  | { key: 'debugMode'; value: boolean }
  | { key: 'notificationsEnabled'; value: boolean }
  | { key: 'closeBehavior'; value: 'keep-daemon' | 'stop-daemon' }
  | { key: 'sandboxConfig'; value: SandboxConfig }
  | { key: 'cloudBrowserConfig'; value: CloudBrowserConfig | null }
  | { key: 'messagingConfig'; value: MessagingConfig | null }
  | { key: 'onboardingComplete'; value: boolean }
  | { key: 'providerSettings' }
  | { key: 'huggingFaceLocalConfig'; value: HuggingFaceLocalConfig | null }
  | { key: 'selectedModel'; value: SelectedModel }
  | { key: 'openaiBaseUrl'; value: string }
  | { key: 'ollamaConfig'; value: OllamaConfig | null }
  | { key: 'litellmConfig'; value: LiteLLMConfig | null }
  | { key: 'azureFoundryConfig'; value: AzureFoundryConfig | null }
  | { key: 'lmstudioConfig'; value: LMStudioConfig | null }
  | { key: 'nimConfig'; value: NimConfig | null };

export interface WorkspaceSetActiveResult {
  changed: boolean;
}

export interface WorkspaceDeleteResult {
  deleted: boolean;
  newActiveWorkspaceId?: string;
}

export type WorkspaceChangePayload =
  | { kind: 'workspace.created'; workspaceId: string }
  | { kind: 'workspace.updated'; workspaceId: string }
  | { kind: 'workspace.deleted'; workspaceId: string }
  | { kind: 'workspace.activeChanged'; workspaceId: string }
  | { kind: 'knowledgeNote.changed'; workspaceId: string };

export interface GwsAccountAddInput {
  googleAccountId: string;
  email: string;
  displayName: string;
  pictureUrl: string | null;
  label: string;
  connectedAt: string;
  token: GoogleAccountToken;
}

export interface GwsAccountTokenResult {
  accessToken: string;
  scopes: string[];
  expiresAt: number;
}

export interface GwsAccountStatusChangedPayload {
  googleAccountId: string;
  status: GoogleAccountStatus;
}

export interface SkillsChangedPayload {
  kind: 'added' | 'removed' | 'updated' | 'resynced';
}

export interface DaemonNotificationMap {
  'task.progress': import('../task.js').TaskProgress;
  'task.message': { taskId: string; messages: import('../task.js').TaskMessage[] };
  'task.statusChange': { taskId: string; status: string; completedAt?: string };
  'task.summary': { taskId: string; summary: string };
  'task.complete': { taskId: string; result: import('../task.js').TaskResult };
  'task.error': { taskId: string; error?: string };
  'permission.request': import('../permission.js').PermissionRequest;
  'todo.update': { taskId: string; todos: import('../todo.js').TodoItem[] };
  'auth.error': { taskId: string; providerId: string; message: string };
  'browser.frame': { taskId: string; [key: string]: unknown };
  'whatsapp.qr': { qr: string };
  'whatsapp.status': { status: import('../messaging.js').MessagingConnectionStatus };
  'settings.changed': SettingsChangePayload;
  'workspace.changed': WorkspaceChangePayload;
  'gwsAccount.statusChanged': GwsAccountStatusChangedPayload;
  'skills.changed': SkillsChangedPayload;
}

export type DaemonNotification = keyof DaemonNotificationMap;
