import type { GoogleAccount } from '@myboteam/agent-core/common';
import type {
  KnowledgeNote,
  KnowledgeNoteCreateInput,
  KnowledgeNoteUpdateInput,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from '@myboteam/agent-core/desktop-main';
import { ipcRenderer } from 'electron';

export const workspaceFileHandlers = {
  listWorkspaces: (): Promise<Workspace[]> => ipcRenderer.invoke('workspace:list'),
  getActiveWorkspaceId: (): Promise<string | null> => ipcRenderer.invoke('workspace:get-active'),
  switchWorkspace: (workspaceId: string): Promise<{ success: boolean; reason?: string }> =>
    ipcRenderer.invoke('workspace:switch', workspaceId),
  createWorkspace: (input: WorkspaceCreateInput): Promise<Workspace> =>
    ipcRenderer.invoke('workspace:create', input),
  updateWorkspace: (id: string, input: WorkspaceUpdateInput): Promise<Workspace | null> =>
    ipcRenderer.invoke('workspace:update', id, input),
  deleteWorkspace: (id: string): Promise<boolean> => ipcRenderer.invoke('workspace:delete', id),

  listKnowledgeNotes: (workspaceId: string): Promise<KnowledgeNote[]> =>
    ipcRenderer.invoke('knowledge-notes:list', workspaceId),
  createKnowledgeNote: (input: KnowledgeNoteCreateInput): Promise<KnowledgeNote> =>
    ipcRenderer.invoke('knowledge-notes:create', input),
  updateKnowledgeNote: (
    id: string,
    workspaceId: string,
    input: KnowledgeNoteUpdateInput,
  ): Promise<KnowledgeNote | null> =>
    ipcRenderer.invoke('knowledge-notes:update', id, workspaceId, input),
  deleteKnowledgeNote: (id: string, workspaceId: string): Promise<boolean> =>
    ipcRenderer.invoke('knowledge-notes:delete', id, workspaceId),

  onWorkspaceChanged: (callback: (data: { workspaceId: string }) => void) => {
    const listener = (_: unknown, data: { workspaceId: string }) => callback(data);
    ipcRenderer.on('workspace:changed', listener);
    return () => ipcRenderer.removeListener('workspace:changed', listener);
  },
  onWorkspaceDeleted: (callback: (data: { workspaceId: string }) => void) => {
    const listener = (_: unknown, data: { workspaceId: string }) => callback(data);
    ipcRenderer.on('workspace:deleted', listener);
    return () => ipcRenderer.removeListener('workspace:deleted', listener);
  },

  pickFolder: (): Promise<string | null> => ipcRenderer.invoke('files:pick-folder'),
  pickFiles: (): Promise<import('@myboteam/agent-core/common').FileAttachmentInfo[]> =>
    ipcRenderer.invoke('files:pick'),
  processDroppedFiles: (
    paths: string[],
  ): Promise<import('@myboteam/agent-core/common').FileAttachmentInfo[]> =>
    ipcRenderer.invoke('files:process-dropped', paths),

  getSandboxConfig: (): Promise<{
    mode: 'disabled' | 'native' | 'docker';
    allowedPaths: string[];
    networkRestricted: boolean;
    allowedHosts: string[];
    dockerImage?: string;
    networkPolicy?: { allowOutbound: boolean; allowedHosts?: string[] };
  }> => ipcRenderer.invoke('sandbox:get-config'),
  setSandboxConfig: (config: {
    mode: 'disabled' | 'native' | 'docker';
    allowedPaths: string[];
    networkRestricted: boolean;
    allowedHosts: string[];
    dockerImage?: string;
    networkPolicy?: { allowOutbound: boolean; allowedHosts?: string[] };
  }): Promise<void> => ipcRenderer.invoke('sandbox:set-config', config),

  captureScreenshot: (): Promise<{
    success: boolean;
    data?: string;
    width?: number;
    height?: number;
    error?: string;
  }> => ipcRenderer.invoke('debug:capture-screenshot'),

  captureAxtree: (): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('debug:capture-axtree'),

  generateBugReport: (data: {
    taskId?: string;
    taskPrompt?: string;
    taskStatus?: string;
    taskCreatedAt?: string;
    taskCompletedAt?: string;
    messages?: unknown[];
    debugLogs?: unknown[];
    screenshot?: string;
    axtree?: string;
    appVersion?: string;
    platform?: string;
  }): Promise<{ success: boolean; path?: string; error?: string; reason?: string }> =>
    ipcRenderer.invoke('debug:generate-bug-report', data),

  gws: {
    listAccounts: (): Promise<GoogleAccount[]> => ipcRenderer.invoke('gws:accounts:list'),
    startAuth: (label: string): Promise<{ state: string; authUrl: string }> =>
      ipcRenderer.invoke('gws:accounts:start-auth', label),
    completeAuth: (state: string, code: string): Promise<GoogleAccount> =>
      ipcRenderer.invoke('gws:accounts:complete-auth', state, code),
    removeAccount: (id: string): Promise<void> => ipcRenderer.invoke('gws:accounts:remove', id),
    updateLabel: (id: string, label: string): Promise<void> =>
      ipcRenderer.invoke('gws:accounts:update-label', id, label),
    cancelAuth: (state: string): Promise<void> =>
      ipcRenderer.invoke('gws:accounts:cancel-auth', state),
    onStatusChanged: (callback: (id: string, status: string) => void): (() => void) => {
      const listener = (_: unknown, id: string, status: string) => callback(id, status);
      ipcRenderer.on('gws:account:status-changed', listener);
      return () => ipcRenderer.removeListener('gws:account:status-changed', listener);
    },
    onAuthError: (callback: (payload: { message: string }) => void): (() => void) => {
      const listener = (_: unknown, payload: { message: string }) => callback(payload);
      ipcRenderer.on('gws:account:auth-error', listener);
      return () => ipcRenderer.removeListener('gws:account:auth-error', listener);
    },
  },
};
