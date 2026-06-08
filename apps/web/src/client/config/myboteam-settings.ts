import type {
  ApiKeyConfig,
  ConnectedProvider,
  KnowledgeNote,
  KnowledgeNoteCreateInput,
  KnowledgeNoteUpdateInput,
  ProviderId,
  ProviderSettings,
  Skill,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from '@myboteam/agent-core';
import type {
  CloudBrowserConfig,
  MessagingConnectionStatus,
  ScheduledTask,
} from '@myboteam/agent-core/common';
import type { MyBoTeamAnalytics } from './myboteam-analytics';
import type {
  AppInfo,
  AppSettingsData,
  CopilotLoginResultData,
  CopilotOAuthStatusData,
  DaemonPingResult,
  OpenAiOauthStatusData,
  OpenCodeCliCheckResult,
  ProviderUnion,
  SandboxConfigData,
  SelectedModelData,
  SimpleResult,
  SlackOauthStatusData,
  SpeechConfigData,
  SpeechTranscriptionResult,
  ThemeChangeData,
  ThemeColorChangeData,
  ValidationResult,
  WhatsAppConfigData,
} from './myboteam-types';

export interface MyBoTeamAPISettings {
  getVersion(): Promise<string>;
  getPlatform(): Promise<string>;
  getAppInfo(): Promise<AppInfo>;
  openExternal(url: string): Promise<void>;
  getApiKeys(): Promise<ApiKeyConfig[]>;
  addApiKey(provider: ProviderUnion, key: string, label?: string): Promise<ApiKeyConfig>;
  removeApiKey(id: string): Promise<void>;
  getNotificationsEnabled(): Promise<boolean>;
  setNotificationsEnabled(enabled: boolean): Promise<void>;
  getDebugMode(): Promise<boolean>;
  setDebugMode(enabled: boolean): Promise<void>;
  getTheme(): Promise<string>;
  setTheme(theme: string): Promise<void>;
  onThemeChange?(callback: (data: ThemeChangeData) => void): () => void;
  getThemeColor(): Promise<string>;
  setThemeColor(color: string): Promise<void>;
  onThemeColorChange?(callback: (data: ThemeColorChangeData) => void): () => void;
  getLanguage(): Promise<string>;
  setLanguage(language: string): Promise<void>;
  getAppSettings(): Promise<AppSettingsData>;
  getCloudBrowserConfig(): Promise<CloudBrowserConfig | null>;
  setCloudBrowserConfig(config: CloudBrowserConfig | null): Promise<void>;
  getWhatsAppConfig(): Promise<WhatsAppConfigData>;
  connectWhatsApp(): Promise<void>;
  disconnectWhatsApp(): Promise<void>;
  setWhatsAppEnabled(enabled: boolean): Promise<void>;
  onWhatsAppQR(callback: (qr: string) => void): () => void;
  onWhatsAppStatus(callback: (status: MessagingConnectionStatus) => void): () => void;
  getOpenAiBaseUrl(): Promise<string>;
  setOpenAiBaseUrl(baseUrl: string): Promise<void>;
  getOpenAiOauthStatus(): Promise<OpenAiOauthStatusData>;
  loginOpenAiWithChatGpt(): Promise<{ ok: boolean; openedUrl?: string }>;
  getSlackMcpOauthStatus(): Promise<SlackOauthStatusData>;
  loginSlackMcp(): Promise<{ ok: boolean }>;
  logoutSlackMcp(): Promise<void>;
  getCopilotOAuthStatus(): Promise<CopilotOAuthStatusData>;
  loginGithubCopilot(): Promise<CopilotLoginResultData>;
  logoutGithubCopilot(): Promise<void>;
  hasApiKey(): Promise<boolean>;
  setApiKey(key: string): Promise<void>;
  getApiKey(): Promise<string | null>;
  validateApiKey(key: string): Promise<ValidationResult>;
  validateApiKeyForProvider(
    provider: string,
    key: string,
    options?: Record<string, unknown>,
  ): Promise<ValidationResult>;
  clearApiKey(): Promise<void>;
  getAllApiKeys(): Promise<Record<string, { exists: boolean; prefix?: string }>>;
  hasAnyApiKey(): Promise<boolean>;
  getOnboardingComplete(): Promise<boolean>;
  setOnboardingComplete(complete: boolean): Promise<void>;
  checkOpenCodeCli(): Promise<OpenCodeCliCheckResult>;
  getOpenCodeVersion(): Promise<string | null>;
  getSelectedModel(): Promise<SelectedModelData>;
  setSelectedModel(model: SelectedModelData): Promise<void>;
  getProviderSettings(): Promise<ProviderSettings>;
  setActiveProvider(providerId: ProviderId | null): Promise<void>;
  getConnectedProvider(providerId: ProviderId): Promise<ConnectedProvider | null>;
  setConnectedProvider(providerId: ProviderId, provider: ConnectedProvider): Promise<void>;
  removeConnectedProvider(providerId: ProviderId): Promise<void>;
  updateProviderModel(providerId: ProviderId, modelId: string | null): Promise<void>;
  setProviderDebugMode(enabled: boolean): Promise<void>;
  getProviderDebugMode(): Promise<boolean>;
  speechIsConfigured(): Promise<boolean>;
  speechGetConfig(): Promise<SpeechConfigData>;
  speechValidate(apiKey?: string): Promise<ValidationResult>;
  speechTranscribe(audioData: ArrayBuffer, mimeType?: string): Promise<SpeechTranscriptionResult>;
  isE2EMode(): Promise<boolean>;
  listWorkspaces(): Promise<Workspace[]>;
  getActiveWorkspaceId(): Promise<string | null>;
  switchWorkspace(workspaceId: string): Promise<SimpleResult & { reason?: string }>;
  createWorkspace(input: WorkspaceCreateInput): Promise<Workspace>;
  updateWorkspace(id: string, input: WorkspaceUpdateInput): Promise<Workspace | null>;
  deleteWorkspace(id: string): Promise<boolean>;
  listKnowledgeNotes(workspaceId: string): Promise<KnowledgeNote[]>;
  createKnowledgeNote(input: KnowledgeNoteCreateInput): Promise<KnowledgeNote>;
  updateKnowledgeNote(
    id: string,
    workspaceId: string,
    input: KnowledgeNoteUpdateInput,
  ): Promise<KnowledgeNote | null>;
  deleteKnowledgeNote(id: string, workspaceId: string): Promise<boolean>;
  onWorkspaceChanged?(callback: (data: { workspaceId: string }) => void): () => void;
  onWorkspaceDeleted?(callback: (data: { workspaceId: string }) => void): () => void;
  getSkills(): Promise<Skill[]>;
  getEnabledSkills(): Promise<Skill[]>;
  setSkillEnabled(id: string, enabled: boolean): Promise<void>;
  getSkillContent(id: string): Promise<string | null>;
  getUserSkillsPath(): Promise<string>;
  pickSkillFolder(): Promise<string | null>;
  addSkillFromFolder(folderPath: string): Promise<Skill | null>;
  addSkillFromGitHub(rawUrl: string): Promise<Skill>;
  deleteSkill(id: string): Promise<void>;
  resyncSkills(): Promise<Skill[]>;
  openSkillInEditor(filePath: string): Promise<void>;
  showSkillInFolder(filePath: string): Promise<void>;
  getDaemonSocketPath(): Promise<string>;
  daemonPing(): Promise<DaemonPingResult>;
  daemonRestart(): Promise<SimpleResult>;
  daemonStop(): Promise<SimpleResult>;
  daemonStart(): Promise<SimpleResult>;
  getCloseBehavior(): Promise<string>;
  setCloseBehavior(behavior: string): Promise<void>;
  getSandboxConfig(): Promise<SandboxConfigData>;
  setSandboxConfig(config: SandboxConfigData): Promise<void>;
  listSchedules(workspaceId?: string): Promise<ScheduledTask[]>;
  createSchedule(cron: string, prompt: string, workspaceId?: string): Promise<ScheduledTask>;
  deleteSchedule(scheduleId: string): Promise<void>;
  setScheduleEnabled(scheduleId: string, enabled: boolean): Promise<void>;
  isAutoStartEnabled(): Promise<boolean>;
  isMaximized(): Promise<boolean>;
  isFullScreen(): Promise<boolean>;
  onMaximizedChanged(callback: (maximized: boolean) => void): () => void;
  onFullScreenChanged(callback: (fullscreen: boolean) => void): () => void;
  analytics: MyBoTeamAnalytics;
}
