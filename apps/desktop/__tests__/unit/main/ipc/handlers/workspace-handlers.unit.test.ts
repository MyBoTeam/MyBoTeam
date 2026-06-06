import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

vi.mock('@main/daemon/daemon-connector', () => ({
  isDaemonStopped: vi.fn(() => false),
}));

const mockWorkspaceManager = vi.hoisted(() => ({
  listWorkspaces: vi.fn(),
  getActiveWorkspace: vi.fn(),
  switchWorkspace: vi.fn(),
  createWorkspace: vi.fn(),
  updateWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
}));

vi.mock('@main/store/workspaceManager', () => mockWorkspaceManager);

vi.mock('electron', () => ({
  BrowserWindow: {
    fromWebContents: vi.fn(() => ({
      id: 1,
      webContents: { send: vi.fn() },
      isDestroyed: vi.fn(() => false),
    })),
  },
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handlers[channel as string] = handler;
  }),
}));

import { registerWorkspaceHandlers } from '@main/ipc/handlers/workspace-handlers';
import { BrowserWindow } from 'electron';

describe('workspace-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerWorkspaceHandlers();
  });

  describe('workspace:list', () => {
    it('should list workspaces', async () => {
      mockWorkspaceManager.listWorkspaces.mockResolvedValue([{ id: 'ws-1', name: 'Workspace 1' }]);
      const result = await handlers['workspace:list']();
      expect(result).toEqual([{ id: 'ws-1', name: 'Workspace 1' }]);
    });
  });

  describe('workspace:get-active', () => {
    it('should return active workspace', async () => {
      mockWorkspaceManager.getActiveWorkspace.mockResolvedValue({ id: 'ws-1' });
      const result = await handlers['workspace:get-active']();
      expect(result).toEqual({ id: 'ws-1' });
    });
  });

  describe('workspace:switch', () => {
    it('should switch workspace when no active tasks', async () => {
      mockDaemonClient.call.mockResolvedValue(0);
      mockWorkspaceManager.switchWorkspace.mockResolvedValue(true);
      const win = { id: 1, webContents: { send: vi.fn() }, isDestroyed: () => false };
      (BrowserWindow.fromWebContents as ReturnType<typeof vi.fn>).mockReturnValue(win);
      const result = await handlers['workspace:switch']({ sender: {} }, 'ws-2');
      expect(result).toEqual({ success: true });
      expect(win.webContents.send).toHaveBeenCalledWith('workspace:changed', {
        workspaceId: 'ws-2',
      });
    });

    it('should fail when tasks are running', async () => {
      mockDaemonClient.call.mockResolvedValue(1);
      const result = await handlers['workspace:switch']({ sender: {} }, 'ws-2');
      expect(result).toEqual({
        success: false,
        reason: 'Cannot switch workspace while tasks are running',
      });
    });

    it('should fail when daemon is unreachable and not stopped', async () => {
      mockDaemonClient.call.mockRejectedValue(new Error('Connection refused'));
      const { isDaemonStopped } = await import('@main/daemon/daemon-connector');
      vi.mocked(isDaemonStopped).mockReturnValue(false);
      const result = await handlers['workspace:switch']({ sender: {} }, 'ws-2');
      expect(result).toEqual({
        success: false,
        reason: 'Cannot switch workspace while tasks are running',
      });
    });

    it('should handle switch error', async () => {
      mockDaemonClient.call.mockResolvedValue(0);
      mockWorkspaceManager.switchWorkspace.mockRejectedValue(new Error('Switch failed'));
      const result = await handlers['workspace:switch']({ sender: {} }, 'ws-2');
      expect(result).toEqual({ success: false, reason: 'Switch failed' });
    });

    it('should return same-workspace message when switch returns false', async () => {
      mockDaemonClient.call.mockResolvedValue(0);
      mockWorkspaceManager.switchWorkspace.mockResolvedValue(false);
      const result = await handlers['workspace:switch']({ sender: {} }, 'ws-1');
      expect(result).toEqual({
        success: false,
        reason: 'Switch did not complete (same workspace)',
      });
    });
  });

  describe('workspace:create', () => {
    it('should create workspace', async () => {
      mockWorkspaceManager.createWorkspace.mockResolvedValue({ id: 'ws-new' });
      const result = await handlers['workspace:create']({} as unknown, { name: 'New Workspace' });
      expect(result).toEqual({ id: 'ws-new' });
    });
  });

  describe('workspace:update', () => {
    it('should update workspace', async () => {
      mockWorkspaceManager.updateWorkspace.mockResolvedValue({ id: 'ws-1', name: 'Updated' });
      const result = await handlers['workspace:update']({} as unknown, 'ws-1', { name: 'Updated' });
      expect(result).toEqual({ id: 'ws-1', name: 'Updated' });
    });
  });

  describe('workspace:delete', () => {
    it('should delete workspace', async () => {
      mockWorkspaceManager.getActiveWorkspace.mockReturnValue('ws-2');
      mockWorkspaceManager.deleteWorkspace.mockResolvedValue({ deleted: true });
      const win = { id: 1, webContents: { send: vi.fn() }, isDestroyed: () => false };
      (BrowserWindow.fromWebContents as ReturnType<typeof vi.fn>).mockReturnValue(win);
      const result = await handlers['workspace:delete']({ sender: {} }, 'ws-2');
      expect(result).toBe(true);
      expect(win.webContents.send).toHaveBeenCalledWith('workspace:deleted', {
        workspaceId: 'ws-2',
      });
    });

    it('should return false when deleting active workspace with active tasks', async () => {
      mockWorkspaceManager.getActiveWorkspace.mockReturnValue('ws-1');
      mockDaemonClient.call.mockResolvedValue(1);
      const result = await handlers['workspace:delete']({ sender: {} }, 'ws-1');
      expect(result).toBe(false);
    });
  });

  describe('knowledge-notes handlers', () => {
    it('should list knowledge notes', async () => {
      mockDaemonClient.call.mockResolvedValue([{ id: 'note-1' }]);
      const result = await handlers['knowledge-notes:list']({} as unknown, 'ws-1');
      expect(mockDaemonClient.call).toHaveBeenCalledWith('knowledgeNote.list', {
        workspaceId: 'ws-1',
      });
    });

    it('should create knowledge note', async () => {
      await handlers['knowledge-notes:create']({} as unknown, {
        workspaceId: 'ws-1',
        title: 'Note',
      });
      expect(mockDaemonClient.call).toHaveBeenCalledWith('knowledgeNote.create', {
        input: { workspaceId: 'ws-1', title: 'Note' },
      });
    });

    it('should update knowledge note', async () => {
      await handlers['knowledge-notes:update']({} as unknown, 'note-1', 'ws-1', {
        title: 'Updated',
      });
      expect(mockDaemonClient.call).toHaveBeenCalledWith('knowledgeNote.update', {
        noteId: 'note-1',
        workspaceId: 'ws-1',
        input: { title: 'Updated' },
      });
    });

    it('should delete knowledge note', async () => {
      await handlers['knowledge-notes:delete']({} as unknown, 'note-1', 'ws-1');
      expect(mockDaemonClient.call).toHaveBeenCalledWith('knowledgeNote.delete', {
        noteId: 'note-1',
        workspaceId: 'ws-1',
      });
    });
  });
});
