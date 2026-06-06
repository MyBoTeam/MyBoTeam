import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({
  call: vi.fn(),
}));

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: vi.fn(() => mockDaemonClient),
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    (handlers as Record<string, (...args: unknown[]) => unknown>)[channel] = handler;
  }),
}));

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

import { registerFavoritesHandlers } from '@main/ipc/handlers/favorites-handlers';

describe('favorites-handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerFavoritesHandlers();
  });

  describe('favorites:list', () => {
    it('should call daemon favorites.list', async () => {
      mockDaemonClient.call.mockResolvedValue(['task-1', 'task-2']);
      const result = await handlers['favorites:list']();
      expect(mockDaemonClient.call).toHaveBeenCalledWith('favorites.list');
      expect(result).toEqual(['task-1', 'task-2']);
    });
  });

  describe('favorites:add', () => {
    it('should add valid completed task to favorites', async () => {
      mockDaemonClient.call.mockImplementation(async (method: string) => {
        if (method === 'task.get') return { status: 'completed', prompt: 'test', summary: 'done' };
        return undefined;
      });
      await handlers['favorites:add']({} as unknown, 'task-1');
      expect(mockDaemonClient.call).toHaveBeenCalledWith('task.get', { taskId: 'task-1' });
      expect(mockDaemonClient.call).toHaveBeenCalledWith('favorites.add', {
        taskId: 'task-1',
        prompt: 'test',
        summary: 'done',
      });
    });

    it('should throw when task not found', async () => {
      mockDaemonClient.call.mockResolvedValue(null);
      await expect(handlers['favorites:add']({} as unknown, 'task-1')).rejects.toThrow(
        'Favorite failed: task not found',
      );
    });

    it('should throw when task status is not allowed', async () => {
      mockDaemonClient.call.mockImplementation(async (method: string) => {
        if (method === 'task.get') return { status: 'running', prompt: 'test' };
        return undefined;
      });
      await expect(handlers['favorites:add']({} as unknown, 'task-1')).rejects.toThrow(
        'Favorite failed: invalid status',
      );
    });

    it('should add interrupted task to favorites', async () => {
      mockDaemonClient.call.mockImplementation(async (method: string) => {
        if (method === 'task.get')
          return { status: 'interrupted', prompt: 'test', summary: 'partial' };
        return undefined;
      });
      await handlers['favorites:add']({} as unknown, 'task-1');
      expect(mockDaemonClient.call).toHaveBeenCalledWith('favorites.add', {
        taskId: 'task-1',
        prompt: 'test',
        summary: 'partial',
      });
    });
  });

  describe('favorites:remove', () => {
    it('should call daemon favorites.remove', async () => {
      await handlers['favorites:remove']({} as unknown, 'task-1');
      expect(mockDaemonClient.call).toHaveBeenCalledWith('favorites.remove', { taskId: 'task-1' });
    });
  });

  describe('favorites:has', () => {
    it('should call daemon favorites.isFavorite', async () => {
      mockDaemonClient.call.mockResolvedValue(true);
      const result = await handlers['favorites:has']({} as unknown, 'task-1');
      expect(mockDaemonClient.call).toHaveBeenCalledWith('favorites.isFavorite', {
        taskId: 'task-1',
      });
      expect(result).toBe(true);
    });
  });
});
