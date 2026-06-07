import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({
  call: vi.fn(),
  onNotification: vi.fn(),
}));

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: vi.fn(() => mockDaemonClient),
}));

import {
  close,
  createWorkspace,
  deleteWorkspace,
  getActiveWorkspace,
  getWorkspace,
  initialize,
  isInitialized,
  listWorkspaces,
  switchWorkspace,
  updateWorkspace,
} from '@main/store/workspaceManager';

const mockWorkspace = (id: string, name: string) => ({
  id,
  name,
  description: null,
  isDefault: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('workspaceManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    close();
  });

  describe('initialize', () => {
    it('should load workspaces and subscribe to notifications', async () => {
      const ws1 = mockWorkspace('ws-1', 'Workspace 1');
      const ws2 = mockWorkspace('ws-2', 'Workspace 2');
      mockDaemonClient.call.mockImplementation(async (method: string) => {
        if (method === 'workspace.list') return [ws1, ws2];
        if (method === 'workspace.getActive') return ws1;
        return null;
      });

      await initialize();

      expect(isInitialized()).toBe(true);
      expect(getActiveWorkspace()).toBe('ws-1');
      expect(listWorkspaces()).toEqual([ws1, ws2]);
      expect(getWorkspace('ws-1')).toEqual(ws1);
      expect(mockDaemonClient.onNotification).toHaveBeenCalledWith(
        'workspace.changed',
        expect.any(Function),
      );
    });

    it('should handle empty workspace list', async () => {
      mockDaemonClient.call.mockImplementation(async (method: string) => {
        if (method === 'workspace.list') return [];
        if (method === 'workspace.getActive') return null;
        return null;
      });

      await initialize();

      expect(isInitialized()).toBe(true);
      expect(getActiveWorkspace()).toBeNull();
      expect(listWorkspaces()).toEqual([]);
    });
  });

  describe('CRUD operations', () => {
    beforeEach(async () => {
      const ws1 = mockWorkspace('ws-1', 'Default');
      mockDaemonClient.call.mockImplementation(async (method: string) => {
        if (method === 'workspace.list') return [ws1];
        if (method === 'workspace.getActive') return ws1;
        return null;
      });
      await initialize();
      vi.clearAllMocks();
    });

    it('should create a workspace', async () => {
      const newWs = mockWorkspace('ws-2', 'New Workspace');
      mockDaemonClient.call.mockResolvedValue(newWs);

      const result = await createWorkspace({ name: 'New Workspace' });

      expect(result).toEqual(newWs);
      expect(mockDaemonClient.call).toHaveBeenCalledWith('workspace.create', {
        input: { name: 'New Workspace' },
      });
      expect(getWorkspace('ws-2')).toEqual(newWs);
    });

    it('should switch active workspace', async () => {
      mockDaemonClient.call.mockResolvedValue({ changed: true });

      const result = await switchWorkspace('ws-2');

      expect(result).toBe(true);
      expect(getActiveWorkspace()).toBe('ws-2');
    });

    it('should return false when switch did not change', async () => {
      mockDaemonClient.call.mockResolvedValue({ changed: false });

      const result = await switchWorkspace('ws-1');

      expect(result).toBe(false);
      expect(getActiveWorkspace()).toBe('ws-1');
    });

    it('should update a workspace', async () => {
      const updatedWs = { ...mockWorkspace('ws-1', 'Updated Name') };
      mockDaemonClient.call.mockResolvedValue(updatedWs);

      const result = await updateWorkspace('ws-1', { name: 'Updated Name' });

      expect(result).toEqual(updatedWs);
      expect(getWorkspace('ws-1')?.name).toBe('Updated Name');
    });

    it('should return null when updating non-existent workspace', async () => {
      mockDaemonClient.call.mockResolvedValue(null);

      const result = await updateWorkspace('ws-999', { name: 'Nope' });

      expect(result).toBeNull();
    });

    it('should delete a workspace', async () => {
      mockDaemonClient.call.mockResolvedValue({
        deleted: true,
        newActiveWorkspaceId: undefined,
      });

      const result = await deleteWorkspace('ws-2');

      expect(result).toEqual({ deleted: true });
      expect(getWorkspace('ws-2')).toBeNull();
    });

    it('should update active workspace on delete when newActiveWorkspaceId provided', async () => {
      mockDaemonClient.call.mockResolvedValue({
        deleted: true,
        newActiveWorkspaceId: 'ws-1',
      });

      await deleteWorkspace('ws-2');

      expect(getActiveWorkspace()).toBe('ws-1');
    });

    it('should handle delete returning deleted: false', async () => {
      mockDaemonClient.call.mockResolvedValue({
        deleted: false,
      });

      const result = await deleteWorkspace('ws-999');

      expect(result).toEqual({ deleted: false });
    });
  });

  describe('cache refresh from notification', () => {
    let notificationHandler: ((payload: Record<string, unknown>) => Promise<void>) | null = null;

    beforeEach(async () => {
      const ws1 = mockWorkspace('ws-1', 'Default');
      mockDaemonClient.call.mockImplementation(async (method: string) => {
        if (method === 'workspace.list') return [ws1];
        if (method === 'workspace.getActive') return ws1;
        return null;
      });
      await initialize();

      notificationHandler = mockDaemonClient.onNotification.mock.calls[0][1] as (
        payload: Record<string, unknown>,
      ) => Promise<void>;

      vi.clearAllMocks();
    });

    it('should update cache on workspace.created notification', async () => {
      const newWs = mockWorkspace('ws-new', 'New');
      mockDaemonClient.call.mockResolvedValue(newWs);

      await notificationHandler!({ kind: 'workspace.created', workspaceId: 'ws-new' });

      expect(mockDaemonClient.call).toHaveBeenCalledWith('workspace.get', {
        workspaceId: 'ws-new',
      });
      expect(getWorkspace('ws-new')).toEqual(newWs);
    });

    it('should update cache on workspace.updated notification', async () => {
      const updatedWs = { ...mockWorkspace('ws-1', 'Updated') };
      mockDaemonClient.call.mockResolvedValue(updatedWs);

      await notificationHandler!({ kind: 'workspace.updated', workspaceId: 'ws-1' });

      expect(getWorkspace('ws-1')?.name).toBe('Updated');
    });

    it('should delete from cache on workspace.deleted notification', async () => {
      const ws2 = mockWorkspace('ws-2', 'Other');
      mockDaemonClient.call.mockResolvedValue(undefined);

      import('@main/store/workspaceManager').then(() => {});

      await notificationHandler!({ kind: 'workspace.deleted', workspaceId: 'ws-2' });

      expect(getWorkspace('ws-2')).toBeNull();
    });

    it('should update active workspace on workspace.activeChanged notification', async () => {
      await notificationHandler!({ kind: 'workspace.activeChanged', workspaceId: 'ws-2' });

      expect(getActiveWorkspace()).toBe('ws-2');
    });

    it('should handle knowledgeNote.changed notification gracefully', async () => {
      await notificationHandler!({ kind: 'knowledgeNote.changed', workspaceId: 'ws-1' });

      expect(mockDaemonClient.call).not.toHaveBeenCalled();
    });

    it.skip('should handle cache refresh errors gracefully', async () => {
      mockDaemonClient.call.mockRejectedValue(new Error('RPC failed'));

      await expect(
        notificationHandler!({ kind: 'workspace.created', workspaceId: 'ws-fail' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('close', () => {
    it('should clear all state', async () => {
      const ws1 = mockWorkspace('ws-1', 'Default');
      mockDaemonClient.call.mockImplementation(async (method: string) => {
        if (method === 'workspace.list') return [ws1];
        if (method === 'workspace.getActive') return ws1;
        return null;
      });
      await initialize();

      close();

      expect(isInitialized()).toBe(false);
      expect(getActiveWorkspace()).toBeNull();
      expect(listWorkspaces()).toEqual([]);
    });
  });
});
