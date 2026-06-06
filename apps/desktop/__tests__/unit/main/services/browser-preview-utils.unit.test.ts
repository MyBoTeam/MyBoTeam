import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetAllWindows = vi.hoisted(() => vi.fn());

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: mockGetAllWindows,
  },
}));

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  DEV_BROWSER_CDP_PORT: 9223,
  DEV_BROWSER_PORT: 9222,
}));

import {
  autoStartScreencast,
  DEFAULT_VIEWPORT,
  DEV_BROWSER_HOST,
  emitFrameCapture,
  emitNavigationEvent,
  emitStatusUpdate,
  resolveBrowserWsEndpoint,
  resolveTargetId,
  sendToRenderer,
} from '@main/services/browser-preview-utils';

describe('browser-preview-utils', () => {
  let mockWebContents: { send: ReturnType<typeof vi.fn> };
  let mockWindow: { webContents: typeof mockWebContents; isDestroyed: () => boolean };

  beforeEach(() => {
    mockWebContents = { send: vi.fn() };
    mockWindow = {
      webContents: mockWebContents,
      isDestroyed: () => false,
    };
    mockGetAllWindows.mockReturnValue([mockWindow]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendToRenderer', () => {
    it('should send message to all non-destroyed windows', () => {
      sendToRenderer('test:channel', { data: 1 });

      expect(mockWebContents.send).toHaveBeenCalledWith('test:channel', { data: 1 });
    });

    it('should skip destroyed windows', () => {
      const destroyedWindow = {
        webContents: { send: vi.fn() },
        isDestroyed: () => true,
      };
      mockGetAllWindows.mockReturnValue([mockWindow, destroyedWindow]);

      sendToRenderer('test:channel', { data: 1 });

      expect(mockWebContents.send).toHaveBeenCalledTimes(1);
      expect(destroyedWindow.webContents.send).not.toHaveBeenCalled();
    });

    it('should handle no windows gracefully', () => {
      mockGetAllWindows.mockReturnValue([]);

      expect(() => sendToRenderer('test:channel', {})).not.toThrow();
    });
  });

  describe('emitStatusUpdate', () => {
    it('should emit status update IPC event', () => {
      emitStatusUpdate('task-1', 'main', 'streaming', 'All good');

      const payload = mockWebContents.send.mock.calls[0][1];
      expect(mockWebContents.send).toHaveBeenCalledWith('browser:status', expect.any(Object));
      expect(payload).toMatchObject({
        taskId: 'task-1',
        pageName: 'main',
        status: 'streaming',
        message: 'All good',
      });
      expect(payload.timestamp).toBeGreaterThan(0);
    });
  });

  describe('emitFrameCapture', () => {
    it('should emit frame capture IPC event', () => {
      emitFrameCapture('task-1', 'main', 'base64data', 960, 640);

      const payload = mockWebContents.send.mock.calls[0][1];
      expect(mockWebContents.send).toHaveBeenCalledWith('browser:frame', expect.any(Object));
      expect(payload).toMatchObject({
        taskId: 'task-1',
        pageName: 'main',
        frame: 'base64data',
        width: 960,
        height: 640,
      });
    });
  });

  describe('emitNavigationEvent', () => {
    it('should emit navigation IPC event', () => {
      emitNavigationEvent('task-1', 'main', 'https://example.com');

      expect(mockWebContents.send).toHaveBeenCalledWith('browser:navigate', {
        taskId: 'task-1',
        pageName: 'main',
        url: 'https://example.com',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('resolveTargetId', () => {
    it('should create a page and return its targetId', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ targetId: 'target-123' }),
      });
      vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch);

      const result = await resolveTargetId('task-1', 'main');

      expect(result).toBe('target-123');
      expect(mockFetch).toHaveBeenCalledWith(
        `http://${DEV_BROWSER_HOST}:9222/pages`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'task-1-main',
            viewport: DEFAULT_VIEWPORT,
          }),
        }),
      );
    });

    it('should throw when no targetId returned', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(resolveTargetId('task-1', 'main')).rejects.toThrow(
        'No targetId for page task-1-main',
      );
    });

    it('should throw on fetch error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      await expect(resolveTargetId('task-1', 'main')).rejects.toThrow('Network error');
    });
  });

  describe('resolveBrowserWsEndpoint', () => {
    it('should return websocket debugger URL', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ webSocketDebuggerUrl: 'ws://127.0.0.1:9223' }),
      } as Response);

      const result = await resolveBrowserWsEndpoint();

      expect(result).toBe('ws://127.0.0.1:9223');
    });

    it('should throw when webSocketDebuggerUrl missing', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(resolveBrowserWsEndpoint()).rejects.toThrow(
        'CDP endpoint missing webSocketDebuggerUrl',
      );
    });

    it('should throw on non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(resolveBrowserWsEndpoint()).rejects.toThrow('HTTP 500 from');
    });
  });

  describe('autoStartScreencast', () => {
    it('should start preview when matching pages exist', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ pages: ['task-1-main', 'task-1-other'] }),
      } as Response);

      const startPreview = vi.fn();
      await autoStartScreencast('task-1', startPreview);

      expect(startPreview).toHaveBeenCalledWith('task-1', 'main');
    });

    it('should not start preview when no matching pages exist', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ pages: ['other-task-main'] }),
      } as Response);

      const startPreview = vi.fn();
      await autoStartScreencast('task-1', startPreview);

      expect(startPreview).not.toHaveBeenCalled();
    });

    it('should handle fetch failure gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Server not ready'));

      const startPreview = vi.fn();
      await autoStartScreencast('task-1', startPreview);

      expect(startPreview).not.toHaveBeenCalled();
    });

    it('should handle null data gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      } as Response);

      const startPreview = vi.fn();
      await autoStartScreencast('task-1', startPreview);

      expect(startPreview).not.toHaveBeenCalled();
    });
  });
});
