import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceCleanupHandler } from '../../../src/daemon/lifecycle/resource-cleanup-handler';

describe('ResourceCleanupHandler', () => {
  let handler: ResourceCleanupHandler;

  beforeEach(() => {
    handler = new ResourceCleanupHandler();
  });

  describe('cleanup()', () => {
    it('should cleanup all resources', async () => {
      await handler.cleanup();
      // Should not throw
    });

    it('should track cleanup statistics', async () => {
      await handler.cleanup();
      const counts = handler.getResourceCounts();
      expect(counts.sockets).toBe(0);
      expect(counts.fileHandles).toBe(0);
      expect(counts.tempFiles).toBe(0);
    });
  });

  describe('destroySockets()', () => {
    it('should destroy all sockets immediately', () => {
      // Mock socket
      const mockSocket = {
        destroy: vi.fn(),
      };
      handler.registerSocket(mockSocket as any);

      handler.destroySockets();

      expect(mockSocket.destroy).toHaveBeenCalled();
    });

    it('should handle empty socket list', () => {
      handler.destroySockets();
      // Should not throw
    });
  });

  describe('closeFileHandles()', () => {
    it('should close all file handles', async () => {
      const mockHandle = {
        close: vi.fn().mockResolvedValue(undefined),
      };
      handler.registerFileHandle(mockHandle as any);

      await handler.closeFileHandles();

      expect(mockHandle.close).toHaveBeenCalled();
    });

    it('should handle empty file handle list', async () => {
      await handler.closeFileHandles();
      // Should not throw
    });
  });

  describe('removeTempFiles()', () => {
    it('should remove temp files', async () => {
      // Mock fs operations
      await handler.removeTempFiles();
      // Should not throw
    });
  });

  describe('getResourceCounts()', () => {
    it('should return resource counts', () => {
      const counts = handler.getResourceCounts();
      expect(counts).toHaveProperty('sockets');
      expect(counts).toHaveProperty('fileHandles');
      expect(counts).toHaveProperty('tempFiles');
    });

    it('should track registered resources', () => {
      const mockSocket = { destroy: vi.fn() };
      const mockHandle = { close: vi.fn() };

      handler.registerSocket(mockSocket as any);
      handler.registerFileHandle(mockHandle as any);

      const counts = handler.getResourceCounts();
      expect(counts.sockets).toBe(1);
      expect(counts.fileHandles).toBe(1);
    });
  });
});
