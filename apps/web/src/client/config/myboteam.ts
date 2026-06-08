import type { ApiKeyConfig, BedrockCredentials, VertexCredentials } from '@myboteam/agent-core';
import type { GoogleAccount, GoogleAccountStatus } from '@myboteam/agent-core/common';

import type { MyBoTeamAPIAccounts } from './myboteam-accounts';
import type { MyBoTeamAPIConnectors } from './myboteam-connectors';
import type { MyBoTeamAPIProviders } from './myboteam-providers';
import type { MyBoTeamAPISettings } from './myboteam-settings';
import type { MyBoTeamAPITasks } from './myboteam-tasks';

export type MyBoTeamAPI = MyBoTeamAPITasks &
  MyBoTeamAPISettings &
  MyBoTeamAPIConnectors &
  MyBoTeamAPIAccounts &
  MyBoTeamAPIProviders;

declare global {
  interface Window {
    myboteam?: MyBoTeamAPI;
  }
}

export function getMyBoTeam() {
  if (!window.myboteam) {
    throw new Error('MyBoTeam API not available - not running in Electron');
  }
  return {
    ...window.myboteam,

    validateBedrockCredentials: async (
      credentials: BedrockCredentials,
    ): Promise<{ valid: boolean; error?: string }> => {
      const result = await window.myboteam!.validateBedrockCredentials(JSON.stringify(credentials));
      return { valid: result.valid, error: result.error };
    },

    saveBedrockCredentials: async (credentials: BedrockCredentials): Promise<ApiKeyConfig> => {
      return window.myboteam!.saveBedrockCredentials(JSON.stringify(credentials));
    },

    getBedrockCredentials: async (): Promise<BedrockCredentials | null> => {
      return window.myboteam!.getBedrockCredentials();
    },

    fetchBedrockModels: (credentials: string) => window.myboteam!.fetchBedrockModels(credentials),

    validateVertexCredentials: async (
      credentials: VertexCredentials,
    ): Promise<{ valid: boolean; error?: string }> => {
      const result = await window.myboteam!.validateVertexCredentials(JSON.stringify(credentials));
      return { valid: result.valid, error: result.error };
    },

    saveVertexCredentials: async (credentials: VertexCredentials): Promise<ApiKeyConfig> => {
      return window.myboteam!.saveVertexCredentials(JSON.stringify(credentials));
    },

    getVertexCredentials: async (): Promise<VertexCredentials | null> => {
      return window.myboteam!.getVertexCredentials();
    },

    fetchVertexModels: (credentials: string) => window.myboteam!.fetchVertexModels(credentials),

    detectVertexProject: () => window.myboteam!.detectVertexProject(),

    listVertexProjects: () => window.myboteam!.listVertexProjects(),

    listHuggingFaceModels: () => window.myboteam!.listHuggingFaceModels(),

    downloadHuggingFaceModel: (modelId: string) =>
      window.myboteam!.downloadHuggingFaceModel(modelId),

    startHuggingFaceServer: (modelId: string) => window.myboteam!.startHuggingFaceServer(modelId),

    onHuggingFaceDownloadProgress: (
      callback: (progress: { status: string; progress?: number; error?: string }) => void,
    ) => window.myboteam!.onHuggingFaceDownloadProgress(callback),

    gwsListAccounts: (): Promise<GoogleAccount[]> => {
      if (!window.myboteam?.gws) {
        return Promise.reject(new Error('GWS API not available'));
      }
      return window.myboteam.gws.listAccounts();
    },

    gwsStartAuth: (label: string): Promise<{ state: string; authUrl: string }> => {
      if (!window.myboteam?.gws) {
        return Promise.reject(new Error('GWS API not available'));
      }
      return window.myboteam.gws.startAuth(label);
    },

    gwsCompleteAuth: (state: string, code: string): Promise<GoogleAccount> => {
      if (!window.myboteam?.gws) {
        return Promise.reject(new Error('GWS API not available'));
      }
      return window.myboteam.gws.completeAuth(state, code);
    },

    gwsRemoveAccount: (id: string): Promise<void> => {
      if (!window.myboteam?.gws) {
        return Promise.reject(new Error('GWS API not available'));
      }
      return window.myboteam.gws.removeAccount(id);
    },

    gwsUpdateLabel: (id: string, label: string): Promise<void> => {
      if (!window.myboteam?.gws) {
        return Promise.reject(new Error('GWS API not available'));
      }
      return window.myboteam.gws.updateLabel(id, label);
    },

    gwsOnStatusChanged: (cb: (id: string, status: GoogleAccountStatus) => void): (() => void) => {
      if (!window.myboteam?.gws) {
        throw new Error('GWS API not available');
      }
      return window.myboteam.gws.onStatusChanged(cb);
    },
  };
}

export function isRunningInElectron(): boolean {
  return window.myboteamShell?.isElectron === true;
}

export function getShellVersion(): string | null {
  return window.myboteamShell?.version ?? null;
}

export function getShellPlatform(): string | null {
  return window.myboteamShell?.platform ?? null;
}

export function useMyBoTeam(): MyBoTeamAPI {
  const api = window.myboteam;
  if (!api) {
    throw new Error('MyBoTeam API not available - not running in Electron');
  }
  return api;
}
