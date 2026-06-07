import { create } from 'zustand';
import { createLogger } from '@/utils/logger';

const logger = createLogger('WorkspaceStore');

import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from '@myboteam/agent-core/common';
import { getMyBoTeam } from '@/config/myboteam';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isLoading: boolean;
  isSwitching: boolean;

  loadWorkspaces: () => Promise<void>;
  switchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (input: WorkspaceCreateInput) => Promise<Workspace | null>;
  updateWorkspace: (id: string, input: WorkspaceUpdateInput) => Promise<Workspace | null>;
  deleteWorkspace: (id: string) => Promise<boolean>;
  setActiveWorkspaceId: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: false,
  isSwitching: false,

  loadWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const myboteam = getMyBoTeam();
      const [workspaces, activeId] = await Promise.all([
        myboteam.listWorkspaces(),
        myboteam.getActiveWorkspaceId(),
      ]);
      set({ workspaces, activeWorkspaceId: activeId, isLoading: false });
    } catch (err) {
      logger.error('Failed to load workspaces:', err);
      set({ isLoading: false });
    }
  },

  switchWorkspace: async (id: string) => {
    if (id === get().activeWorkspaceId) {
      return;
    }
    set({ isSwitching: true });
    try {
      const myboteam = getMyBoTeam();
      const result = await myboteam.switchWorkspace(id);
      if (result.success) {
        set({ activeWorkspaceId: id, isSwitching: false });
      } else {
        logger.warn('Workspace switch rejected:', result.reason);
        set({ isSwitching: false });
      }
    } catch (err) {
      logger.error('Failed to switch workspace:', err);
      set({ isSwitching: false });
    }
  },

  createWorkspace: async (input: WorkspaceCreateInput) => {
    try {
      const myboteam = getMyBoTeam();
      const workspace = await myboteam.createWorkspace(input);
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
      }));
      return workspace;
    } catch (err) {
      logger.error('Failed to create workspace:', err);
      return null;
    }
  },

  updateWorkspace: async (id: string, input: WorkspaceUpdateInput) => {
    try {
      const myboteam = getMyBoTeam();
      const updated = await myboteam.updateWorkspace(id, input);
      if (updated) {
        set((state) => ({
          workspaces: state.workspaces.map((w) => (w.id === id ? updated : w)),
        }));
      }
      return updated;
    } catch (err) {
      logger.error('Failed to update workspace:', err);
      return null;
    }
  },

  deleteWorkspace: async (id: string) => {
    try {
      const myboteam = getMyBoTeam();
      const deleted = await myboteam.deleteWorkspace(id);
      if (deleted) {
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== id),
        }));
      }
      return deleted;
    } catch (err) {
      logger.error('Failed to delete workspace:', err);
      return false;
    }
  },

  setActiveWorkspaceId: (id: string) => {
    set({ activeWorkspaceId: id });
  },
}));

let unsubscribeWorkspaceChanged: (() => void) | undefined;

if (typeof window !== 'undefined' && window.myboteam) {
  unsubscribeWorkspaceChanged?.();
  const unsub = window.myboteam.onWorkspaceChanged?.((data: { workspaceId: string }) => {
    useWorkspaceStore.getState().setActiveWorkspaceId(data.workspaceId);
  });
  if (unsub) {
    unsubscribeWorkspaceChanged = unsub;
  }
}

import.meta.hot?.dispose(() => {
  unsubscribeWorkspaceChanged?.();
  unsubscribeWorkspaceChanged = undefined;
});
