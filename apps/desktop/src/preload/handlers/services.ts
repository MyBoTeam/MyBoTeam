import { ipcRenderer } from 'electron';

export const serviceHandlers = {
  getProviderSettings: (): Promise<unknown> => ipcRenderer.invoke('provider-settings:get'),
  setActiveProvider: (providerId: string | null): Promise<void> =>
    ipcRenderer.invoke('provider-settings:set-active', providerId),
  getConnectedProvider: (providerId: string): Promise<unknown> =>
    ipcRenderer.invoke('provider-settings:get-connected', providerId),
  setConnectedProvider: (providerId: string, provider: unknown): Promise<void> =>
    ipcRenderer.invoke('provider-settings:set-connected', providerId, provider),
  removeConnectedProvider: (providerId: string): Promise<void> =>
    ipcRenderer.invoke('provider-settings:remove-connected', providerId),
  updateProviderModel: (providerId: string, modelId: string | null): Promise<void> =>
    ipcRenderer.invoke('provider-settings:update-model', providerId, modelId),
  setProviderDebugMode: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('provider-settings:set-debug', enabled),
  getProviderDebugMode: (): Promise<boolean> => ipcRenderer.invoke('provider-settings:get-debug'),

  getSkills: (): Promise<import('@myboteam/agent-core/desktop-main').Skill[]> =>
    ipcRenderer.invoke('skills:list'),
  getEnabledSkills: (): Promise<import('@myboteam/agent-core/desktop-main').Skill[]> =>
    ipcRenderer.invoke('skills:list-enabled'),
  setSkillEnabled: (id: string, enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('skills:set-enabled', id, enabled),
  getSkillContent: (id: string): Promise<string | null> =>
    ipcRenderer.invoke('skills:get-content', id),
  getUserSkillsPath: (): Promise<string> => ipcRenderer.invoke('skills:get-user-skills-path'),
  pickSkillFolder: (): Promise<string | null> => ipcRenderer.invoke('skills:pick-folder'),
  addSkillFromFolder: (
    folderPath: string,
  ): Promise<import('@myboteam/agent-core/desktop-main').Skill | null> =>
    ipcRenderer.invoke('skills:add-from-folder', folderPath),
  addSkillFromGitHub: (
    rawUrl: string,
  ): Promise<import('@myboteam/agent-core/desktop-main').Skill> =>
    ipcRenderer.invoke('skills:add-from-github', rawUrl),
  deleteSkill: (id: string): Promise<void> => ipcRenderer.invoke('skills:delete', id),
  resyncSkills: (): Promise<import('@myboteam/agent-core/desktop-main').Skill[]> =>
    ipcRenderer.invoke('skills:resync'),
  openSkillInEditor: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('skills:open-in-editor', filePath),
  showSkillInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('skills:show-in-folder', filePath),

  logEvent: (payload: { level?: string; message: string; context?: Record<string, unknown> }) =>
    ipcRenderer.invoke('log:event', payload),
  exportLogs: (): Promise<{ success: boolean; path?: string; error?: string; reason?: string }> =>
    ipcRenderer.invoke('logs:export'),

  speechIsConfigured: (): Promise<boolean> => ipcRenderer.invoke('speech:is-configured'),
  speechGetConfig: (): Promise<{ enabled: boolean; hasApiKey: boolean; apiKeyPrefix?: string }> =>
    ipcRenderer.invoke('speech:get-config'),
  speechValidate: (apiKey?: string): Promise<{ valid: boolean; error?: string }> =>
    ipcRenderer.invoke('speech:validate', apiKey),
  speechTranscribe: (
    audioData: ArrayBuffer,
    mimeType?: string,
  ): Promise<
    | {
        success: true;
        result: { text: string; confidence?: number; duration: number; timestamp: number };
      }
    | {
        success: false;
        error: { code: string; message: string };
      }
  > => ipcRenderer.invoke('speech:transcribe', audioData, mimeType),

  getDaemonSocketPath: (): Promise<string> => ipcRenderer.invoke('daemon:get-socket-path'),
  daemonPing: (): Promise<{ status: string; uptime: number }> => ipcRenderer.invoke('daemon:ping'),
  daemonRestart: (): Promise<{ success: boolean }> => ipcRenderer.invoke('daemon:restart'),
  daemonStop: (): Promise<{ success: boolean }> => ipcRenderer.invoke('daemon:stop'),
  daemonStart: (): Promise<{ success: boolean }> => ipcRenderer.invoke('daemon:start'),
  getCloseBehavior: (): Promise<string> => ipcRenderer.invoke('daemon:get-close-behavior'),
  setCloseBehavior: (behavior: string): Promise<void> =>
    ipcRenderer.invoke('daemon:set-close-behavior', behavior),

  onDaemonDisconnected: (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on('daemon:disconnected', listener);
    return () => ipcRenderer.removeListener('daemon:disconnected', listener);
  },
  onDaemonReconnected: (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on('daemon:reconnected', listener);
    return () => ipcRenderer.removeListener('daemon:reconnected', listener);
  },
  onDaemonReconnectFailed: (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on('daemon:reconnect-failed', listener);
    return () => ipcRenderer.removeListener('daemon:reconnect-failed', listener);
  },

  listSchedules: (workspaceId?: string): Promise<unknown[]> =>
    ipcRenderer.invoke('scheduler:list', workspaceId),
  createSchedule: (cron: string, prompt: string, workspaceId?: string): Promise<unknown> =>
    ipcRenderer.invoke('scheduler:create', cron, prompt, workspaceId),
  deleteSchedule: (scheduleId: string): Promise<void> =>
    ipcRenderer.invoke('scheduler:delete', scheduleId),
  setScheduleEnabled: (scheduleId: string, enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('scheduler:set-enabled', scheduleId, enabled),
  isAutoStartEnabled: (): Promise<boolean> => ipcRenderer.invoke('daemon:is-auto-start-enabled'),

  myboteamAiConnect: (): Promise<unknown> => ipcRenderer.invoke('myboteam-ai:connect'),
  myboteamAiEnsureReady: (): Promise<unknown> => ipcRenderer.invoke('myboteam-ai:ensure-ready'),
  myboteamAiDisconnect: (): Promise<void> => ipcRenderer.invoke('myboteam-ai:disconnect'),
  myboteamAiGetUsage: (): Promise<unknown> => ipcRenderer.invoke('myboteam-ai:get-usage'),
  myboteamAiGetStatus: (): Promise<{ connected: boolean }> =>
    ipcRenderer.invoke('myboteam-ai:get-status'),
  onMyboteamAiUsageUpdate: (callback: (usage: unknown) => void) => {
    const listener = (_: unknown, usage: unknown) => callback(usage);
    ipcRenderer.on('myboteam-ai:usage-updated', listener);
    return () => ipcRenderer.removeListener('myboteam-ai:usage-updated', listener);
  },

  onCloseRequested: (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on('app:close-requested', listener);
    return () => ipcRenderer.removeListener('app:close-requested', listener);
  },
  respondToClose: (decision: 'keep-daemon' | 'stop-daemon' | 'cancel'): void => {
    ipcRenderer.send('app:close-response', decision);
  },

  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),
  isFullScreen: (): Promise<boolean> => ipcRenderer.invoke('window:is-fullscreen'),
  onMaximizedChanged: (callback: (maximized: boolean) => void): (() => void) => {
    const listener = (_: unknown, maximized: boolean) => callback(maximized);
    ipcRenderer.on('window:maximized-changed', listener);
    return () => ipcRenderer.removeListener('window:maximized-changed', listener);
  },
  onFullScreenChanged: (callback: (fullscreen: boolean) => void): (() => void) => {
    const listener = (_: unknown, fullscreen: boolean) => callback(fullscreen);
    ipcRenderer.on('window:fullscreen-changed', listener);
    return () => ipcRenderer.removeListener('window:fullscreen-changed', listener);
  },
};
