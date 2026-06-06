import type {
  LanguagePreference,
  StoredFavorite,
  ThemeColorPreference,
  ThemePreference,
} from '../../../types/storage.js';
import type { CloudBrowserConfig } from '../cloud-browser.js';
import type { ConnectorStatus, McpConnector, OAuthTokens, StoredAuthEntry } from '../connector.js';
import type { CreditUsage } from '../gateway.js';
import type { GoogleAccount, GoogleAccountToken } from '../google-account.js';
import type { MessagingConfig } from '../messaging.js';
import type { PermissionResponse } from '../permission.js';
import type {
  AzureFoundryConfig,
  HuggingFaceLocalConfig,
  LiteLLMConfig,
  LMStudioConfig,
  NimConfig,
  OllamaConfig,
  SelectedModel,
} from '../provider.js';
import type { ConnectedProvider, ProviderId, ProviderSettings } from '../providerSettings.js';
import type { SandboxConfig } from '../sandbox.js';
import type { Skill } from '../skills.js';
import type { Task, TaskStatus } from '../task.js';
import type { TodoItem } from '../todo.js';
import type {
  KnowledgeNote,
  KnowledgeNoteCreateInput,
  KnowledgeNoteUpdateInput,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from '../workspace.js';
import type {
  GwsAccountAddInput,
  GwsAccountTokenResult,
  SettingsSnapshot,
  WorkspaceDeleteResult,
  WorkspaceSetActiveResult,
} from './event-types.js';
import type { HealthCheckResult, WhatsAppDaemonConfig } from './json-rpc-types.js';
import type {
  ScheduledTask,
  SessionResumeParams,
  StorageDeleteTaskParams,
  TaskCancelScheduledParams,
  TaskIdParams,
  TaskListParams,
  TaskScheduleParams,
  TaskStartParams,
} from './task-types.js';

export interface DaemonMethodMap {
  'task.start': { params: TaskStartParams; result: Task };
  'task.cancel': { params: TaskIdParams; result: undefined };
  'task.interrupt': { params: TaskIdParams; result: undefined };
  'task.list': { params: TaskListParams | undefined; result: Task[] };
  'task.get': { params: TaskIdParams; result: Task | null };
  'task.delete': { params: StorageDeleteTaskParams; result: undefined };
  'task.clearHistory': { params: undefined; result: undefined };
  'task.getTodos': { params: TaskIdParams; result: TodoItem[] };
  'task.getActiveCount': { params: undefined; result: number };
  'task.status': {
    params: TaskIdParams;
    result: {
      taskId: string;
      status: TaskStatus;
      prompt: string;
      createdAt: string;
    } | null;
  };

  'session.resume': { params: SessionResumeParams; result: Task };

  'permission.respond': { params: PermissionResponse; result: undefined };

  'task.schedule': { params: TaskScheduleParams; result: ScheduledTask };
  'task.listScheduled': { params: { workspaceId?: string } | undefined; result: ScheduledTask[] };
  'task.cancelScheduled': { params: TaskCancelScheduledParams; result: undefined };
  'task.setScheduleEnabled': {
    params: { scheduleId: string; enabled: boolean };
    result: undefined;
  };

  'whatsapp.connect': { params: undefined; result: undefined };
  'whatsapp.disconnect': { params: undefined; result: undefined };
  'whatsapp.getConfig': { params: undefined; result: WhatsAppDaemonConfig | null };
  'whatsapp.setEnabled': { params: { enabled: boolean }; result: undefined };

  'daemon.ping': { params: undefined; result: { status: 'ok'; uptime: number; buildId?: string } };
  'daemon.shutdown': { params: undefined; result: undefined };
  'health.check': { params: undefined; result: HealthCheckResult };

  'myboteam-ai.connect': {
    params: undefined;
    result: { deviceFingerprint: string; usage: CreditUsage | null };
  };
  'myboteam-ai.get-usage': { params: undefined; result: CreditUsage };
  'myboteam-ai.disconnect': { params: undefined; result: undefined };

  'auth.openai.startLogin': {
    params: undefined;
    result: { sessionId: string; authorizeUrl: string };
  };
  'auth.openai.awaitCompletion': {
    params: { sessionId: string; timeoutMs?: number };
    result: { ok: true; plan: 'free' | 'paid' } | { ok: false; error: string };
  };
  'auth.openai.status': {
    params: undefined;
    result: { connected: boolean; expires?: number };
  };
  'auth.openai.getAccessToken': {
    params: undefined;
    result: string | null;
  };

  'secrets.storeApiKey': { params: { provider: string; apiKey: string }; result: undefined };
  'secrets.getApiKey': { params: { provider: string }; result: string | null };
  'secrets.deleteApiKey': { params: { provider: string }; result: boolean };
  'secrets.getAllApiKeys': { params: undefined; result: Record<string, string | null> };
  'secrets.hasAnyApiKey': { params: undefined; result: boolean };
  'secrets.storeBedrockCredentials': { params: { credentials: string }; result: undefined };
  'secrets.getBedrockCredentials': {
    params: undefined;
    result: Record<string, string> | null;
  };
  'secrets.clear': { params: undefined; result: undefined };

  'settings.getAll': { params: undefined; result: SettingsSnapshot };
  'settings.setTheme': { params: { theme: ThemePreference }; result: undefined };
  'settings.setThemeColor': { params: { themeColor: ThemeColorPreference }; result: undefined };
  'settings.setLanguage': { params: { language: LanguagePreference }; result: undefined };
  'settings.setDebugMode': { params: { enabled: boolean }; result: undefined };
  'settings.setNotificationsEnabled': { params: { enabled: boolean }; result: undefined };
  'settings.getNotificationsEnabled': { params: undefined; result: boolean };
  'settings.setCloseBehavior': {
    params: { behavior: 'keep-daemon' | 'stop-daemon' };
    result: undefined;
  };
  'settings.getCloseBehavior': {
    params: undefined;
    result: 'keep-daemon' | 'stop-daemon';
  };
  'settings.setSandboxConfig': { params: { config: SandboxConfig }; result: undefined };
  'settings.getSandboxConfig': { params: undefined; result: SandboxConfig };
  'settings.setCloudBrowserConfig': {
    params: { config: CloudBrowserConfig | null };
    result: undefined;
  };
  'settings.getCloudBrowserConfig': {
    params: undefined;
    result: CloudBrowserConfig | null;
  };
  'settings.setMessagingConfig': {
    params: { config: MessagingConfig | null };
    result: undefined;
  };
  'settings.getMessagingConfig': { params: undefined; result: MessagingConfig | null };
  'settings.setOnboardingComplete': { params: { complete: boolean }; result: undefined };

  'settings.getSelectedModel': { params: undefined; result: SelectedModel | null };
  'settings.setSelectedModel': { params: { model: SelectedModel }; result: undefined };
  'settings.getOpenAiBaseUrl': { params: undefined; result: string };
  'settings.setOpenAiBaseUrl': { params: { baseUrl: string }; result: undefined };
  'settings.getOllamaConfig': { params: undefined; result: OllamaConfig | null };
  'settings.setOllamaConfig': { params: { config: OllamaConfig | null }; result: undefined };
  'settings.getLiteLLMConfig': { params: undefined; result: LiteLLMConfig | null };
  'settings.setLiteLLMConfig': { params: { config: LiteLLMConfig | null }; result: undefined };
  'settings.getAzureFoundryConfig': {
    params: undefined;
    result: AzureFoundryConfig | null;
  };
  'settings.setAzureFoundryConfig': {
    params: { config: AzureFoundryConfig | null };
    result: undefined;
  };
  'settings.getLMStudioConfig': { params: undefined; result: LMStudioConfig | null };
  'settings.setLMStudioConfig': { params: { config: LMStudioConfig | null }; result: undefined };
  'settings.getNimConfig': { params: undefined; result: NimConfig | null };
  'settings.setNimConfig': { params: { config: NimConfig | null }; result: undefined };

  'provider.getSettings': { params: undefined; result: ProviderSettings };
  'provider.setActive': { params: { providerId: ProviderId | null }; result: undefined };
  'provider.setConnected': {
    params: { providerId: ProviderId; provider: ConnectedProvider };
    result: undefined;
  };
  'provider.removeConnected': { params: { providerId: ProviderId }; result: undefined };
  'provider.updateModel': {
    params: { providerId: ProviderId; modelId: string | null };
    result: undefined;
  };
  'provider.setDebugMode': { params: { enabled: boolean }; result: undefined };
  'provider.getDebugMode': { params: undefined; result: boolean };
  'provider.getMyboteamAiCredits': { params: undefined; result: CreditUsage | null };
  'provider.saveMyboteamAiCredits': { params: { usage: CreditUsage }; result: undefined };
  'provider.getHuggingFaceLocalConfig': {
    params: undefined;
    result: HuggingFaceLocalConfig | null;
  };
  'provider.setHuggingFaceLocalConfig': {
    params: { config: HuggingFaceLocalConfig | null };
    result: undefined;
  };

  'workspace.list': { params: undefined; result: Workspace[] };
  'workspace.get': { params: { workspaceId: string }; result: Workspace | null };
  'workspace.getActive': { params: undefined; result: Workspace | null };
  'workspace.setActive': {
    params: { workspaceId: string };
    result: WorkspaceSetActiveResult;
  };
  'workspace.create': { params: { input: WorkspaceCreateInput }; result: Workspace };
  'workspace.update': {
    params: { workspaceId: string; input: WorkspaceUpdateInput };
    result: Workspace | null;
  };
  'workspace.delete': {
    params: { workspaceId: string };
    result: WorkspaceDeleteResult;
  };

  'knowledgeNote.list': { params: { workspaceId: string }; result: KnowledgeNote[] };
  'knowledgeNote.get': {
    params: { noteId: string; workspaceId: string };
    result: KnowledgeNote | null;
  };
  'knowledgeNote.create': {
    params: { input: KnowledgeNoteCreateInput };
    result: KnowledgeNote;
  };
  'knowledgeNote.update': {
    params: { noteId: string; workspaceId: string; input: KnowledgeNoteUpdateInput };
    result: KnowledgeNote | null;
  };
  'knowledgeNote.delete': {
    params: { noteId: string; workspaceId: string };
    result: undefined;
  };

  'favorites.list': { params: undefined; result: StoredFavorite[] };
  'favorites.add': {
    params: { taskId: string; prompt: string; summary?: string };
    result: undefined;
  };
  'favorites.remove': { params: TaskIdParams; result: undefined };
  'favorites.isFavorite': { params: TaskIdParams; result: boolean };

  'connectors.list': { params: undefined; result: McpConnector[] };
  'connectors.getEnabled': { params: undefined; result: McpConnector[] };
  'connectors.getById': { params: { id: string }; result: McpConnector | null };
  'connectors.upsert': { params: { connector: McpConnector }; result: undefined };
  'connectors.setEnabled': { params: { id: string; enabled: boolean }; result: undefined };
  'connectors.setStatus': { params: { id: string; status: ConnectorStatus }; result: undefined };
  'connectors.delete': { params: { id: string }; result: undefined };
  'connectors.storeTokens': {
    params: { connectorId: string; tokens: OAuthTokens };
    result: undefined;
  };
  'connectors.getTokens': { params: { connectorId: string }; result: OAuthTokens | null };
  'connectors.deleteTokens': { params: { connectorId: string }; result: undefined };

  'connectors.authEntry.read': {
    params: { connectorKey: string };
    result: StoredAuthEntry | null;
  };
  'connectors.authEntry.write': {
    params: { connectorKey: string; entry: StoredAuthEntry };
    result: undefined;
  };
  'connectors.authEntry.delete': { params: { connectorKey: string }; result: undefined };

  'gwsAccount.list': { params: undefined; result: GoogleAccount[] };
  'gwsAccount.add': { params: { input: GwsAccountAddInput }; result: undefined };
  'gwsAccount.remove': { params: { googleAccountId: string }; result: undefined };
  'gwsAccount.updateLabel': {
    params: { googleAccountId: string; label: string };
    result: undefined;
  };
  'gwsAccount.updateToken': {
    params: { googleAccountId: string; token: GoogleAccountToken; connectedAt: string };
    result: undefined;
  };
  'gwsAccount.getToken': {
    params: { googleAccountId: string };
    result: GwsAccountTokenResult | null;
  };
  'gwsAccount.refreshNow': { params: { googleAccountId: string }; result: undefined };

  'skills.list': { params: undefined; result: Skill[] };
  'skills.listEnabled': { params: undefined; result: Skill[] };
  'skills.setEnabled': { params: { skillId: string; enabled: boolean }; result: undefined };
  'skills.getContent': { params: { skillId: string }; result: string | null };
  'skills.addFromPath': { params: { sourcePath: string }; result: Skill | null };
  'skills.delete': { params: { skillId: string }; result: undefined };
  'skills.resync': { params: undefined; result: Skill[] };
  'skills.getUserSkillsPath': { params: undefined; result: string };

  'logs.getTasksForBugReport': { params: undefined; result: Task[] };
}

export type DaemonMethod = keyof DaemonMethodMap;
