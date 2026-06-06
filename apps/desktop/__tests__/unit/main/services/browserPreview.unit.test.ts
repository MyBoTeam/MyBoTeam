import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockResolveBrowserWsEndpoint = vi.hoisted(() => vi.fn());
const mockResolveTargetId = vi.hoisted(() => vi.fn());
const mockAutoStartScreencastUtil = vi.hoisted(() => vi.fn());
const mockEmitFrameCapture = vi.hoisted(() => vi.fn());
const mockEmitNavigationEvent = vi.hoisted(() => vi.fn());
const mockEmitStatusUpdate = vi.hoisted(() => vi.fn());

vi.mock('@main/services/browser-preview-utils', () => ({
  resolveBrowserWsEndpoint: mockResolveBrowserWsEndpoint,
  resolveTargetId: mockResolveTargetId,
  autoStartScreencast: mockAutoStartScreencastUtil,
  emitFrameCapture: mockEmitFrameCapture,
  emitNavigationEvent: mockEmitNavigationEvent,
  emitStatusUpdate: mockEmitStatusUpdate,
}));

const mockCdpMocks = vi.hoisted(() => {
  const connect = vi.fn();
  const sendCommand = vi.fn();
  const onEvent = vi.fn(() => vi.fn());
  const disconnect = vi.fn().mockResolvedValue(undefined);
  return {
    connect,
    sendCommand,
    onEvent,
    disconnect,
    MockCdpClient: class {
      connect = connect;
      sendCommand = sendCommand;
      onEvent = onEvent;
      disconnect = disconnect;
    },
  };
});

vi.mock('@main/services/cdp-client', () => ({
  CdpClient: mockCdpMocks.MockCdpClient,
}));

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => ({
    write: vi.fn(),
    logEnv: vi.fn(),
    flush: vi.fn(),
    getCurrentLogPath: vi.fn(() => '/mock/logs/app.log'),
    getLogDir: vi.fn(() => '/mock/logs'),
    initialize: vi.fn(),
    shutdown: vi.fn(),
    logBrowser: vi.fn(),
  })),
}));

import {
  autoStartScreencast,
  isScreencastActive,
  startBrowserPreviewStream,
  stopAllBrowserPreviewStreams,
  stopBrowserPreviewStream,
} from '@main/services/browserPreview';

describe('browserPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveBrowserWsEndpoint.mockResolvedValue('ws://127.0.0.1:9223');
    mockResolveTargetId.mockResolvedValue('target-123');
    mockCdpMocks.connect.mockResolvedValue(undefined);
    mockCdpMocks.sendCommand.mockResolvedValue({ sessionId: 'sess-1' });
  });

  describe('startBrowserPreviewStream', () => {
    it('should start a preview stream successfully', async () => {
      await startBrowserPreviewStream('task-1');

      expect(mockResolveBrowserWsEndpoint).toHaveBeenCalled();
      expect(mockResolveTargetId).toHaveBeenCalledWith('task-1', 'main');
      expect(mockCdpMocks.connect).toHaveBeenCalledWith('ws://127.0.0.1:9223');
      expect(mockCdpMocks.sendCommand).toHaveBeenCalledWith('Target.attachToTarget', {
        targetId: 'target-123',
        flatten: true,
      });
      expect(mockCdpMocks.sendCommand).toHaveBeenCalledWith(
        'Page.startScreencast',
        {
          format: 'jpeg',
          quality: 50,
          everyNthFrame: 3,
          maxWidth: 960,
          maxHeight: 640,
        },
        'sess-1',
      );
      expect(mockEmitStatusUpdate).toHaveBeenCalledWith('task-1', 'main', 'starting');
      expect(mockEmitStatusUpdate).toHaveBeenCalledWith('task-1', 'main', 'streaming');
      expect(isScreencastActive()).toBe(true);
    });

    it('should stop existing stream before starting a new one', async () => {
      mockCdpMocks.sendCommand.mockResolvedValue({ sessionId: 'sess-1' });

      await startBrowserPreviewStream('task-1');
      vi.clearAllMocks();

      mockCdpMocks.sendCommand.mockResolvedValue({ sessionId: 'sess-2' });
      await startBrowserPreviewStream('task-1');

      expect(mockCdpMocks.disconnect).toHaveBeenCalled();
    });

    it('should use custom page name', async () => {
      await startBrowserPreviewStream('task-1', 'chat');

      expect(mockResolveTargetId).toHaveBeenCalledWith('task-1', 'chat');
    });

    it('should use default page name for empty string', async () => {
      await startBrowserPreviewStream('task-1', '');

      expect(mockResolveTargetId).toHaveBeenCalledWith('task-1', 'main');
    });

    it('should use default page name for whitespace-only string', async () => {
      await startBrowserPreviewStream('task-1', '   ');

      expect(mockResolveTargetId).toHaveBeenCalledWith('task-1', 'main');
    });

    it('should handle errors gracefully', async () => {
      mockResolveBrowserWsEndpoint.mockRejectedValue(new Error('CDP unavailable'));

      await startBrowserPreviewStream('task-1');

      expect(mockEmitStatusUpdate).toHaveBeenCalledWith(
        'task-1',
        'main',
        'error',
        'CDP unavailable',
      );
      expect(mockCdpMocks.disconnect).toHaveBeenCalled();
    });

    it('should handle non-Error errors gracefully', async () => {
      mockResolveBrowserWsEndpoint.mockRejectedValue('string error');

      await startBrowserPreviewStream('task-1');

      expect(mockEmitStatusUpdate).toHaveBeenCalledWith('task-1', 'main', 'error', 'string error');
    });

    it('should dispatch events correctly', async () => {
      type EventHandler = (event: {
        sessionId?: string;
        method?: string;
        params?: unknown;
      }) => void;
      let registeredHandler: EventHandler | null = null;
      mockCdpMocks.onEvent.mockImplementation((handler: EventHandler) => {
        registeredHandler = handler;
        return vi.fn();
      });

      await startBrowserPreviewStream('task-1');

      registeredHandler!({
        sessionId: 'sess-1',
        method: 'Page.screencastFrame',
        params: {
          data: 'base64img',
          sessionId: 1,
          metadata: { deviceWidth: 960, deviceHeight: 640 },
        },
      });

      expect(mockEmitFrameCapture).toHaveBeenCalledWith('task-1', 'main', 'base64img', 960, 640);
      expect(mockCdpMocks.sendCommand).toHaveBeenCalledWith(
        'Page.screencastFrameAck',
        { sessionId: 1 },
        'sess-1',
      );

      registeredHandler!({
        sessionId: 'sess-1',
        method: 'Page.frameNavigated',
        params: { frame: { url: 'https://example.com' } },
      });

      expect(mockEmitNavigationEvent).toHaveBeenCalledWith('task-1', 'main', 'https://example.com');

      registeredHandler!({
        sessionId: 'sess-1',
        method: 'Page.loadEventFired',
        params: {},
      });

      expect(mockEmitStatusUpdate).toHaveBeenCalledWith('task-1', 'main', 'streaming');

      mockEmitFrameCapture.mockClear();
      registeredHandler!({
        sessionId: 'other-sess',
        method: 'Page.screencastFrame',
        params: { data: 'base64', sessionId: 2 },
      });
      expect(mockEmitFrameCapture).not.toHaveBeenCalled();
    });

    it('should handle screencastFrame without metadata', async () => {
      type EventHandler = (event: {
        sessionId?: string;
        method?: string;
        params?: unknown;
      }) => void;
      let registeredHandler: EventHandler | null = null;
      mockCdpMocks.onEvent.mockImplementation((handler: EventHandler) => {
        registeredHandler = handler;
        return vi.fn();
      });

      await startBrowserPreviewStream('task-1');
      registeredHandler!({
        sessionId: 'sess-1',
        method: 'Page.screencastFrame',
        params: { data: 'base64img', sessionId: 1 },
      });

      expect(mockEmitFrameCapture).toHaveBeenCalledWith(
        'task-1',
        'main',
        'base64img',
        undefined,
        undefined,
      );
    });

    it('should handle navigation event without frame URL', async () => {
      type EventHandler = (event: {
        sessionId?: string;
        method?: string;
        params?: unknown;
      }) => void;
      let registeredHandler: EventHandler | null = null;
      mockCdpMocks.onEvent.mockImplementation((handler: EventHandler) => {
        registeredHandler = handler;
        return vi.fn();
      });

      await startBrowserPreviewStream('task-1');
      mockEmitNavigationEvent.mockClear();

      registeredHandler!({
        sessionId: 'sess-1',
        method: 'Page.frameNavigated',
        params: { frame: {} },
      });

      expect(mockEmitNavigationEvent).not.toHaveBeenCalled();
    });
  });

  describe('stopBrowserPreviewStream', () => {
    it('should stop an active stream', async () => {
      await startBrowserPreviewStream('task-1');
      vi.clearAllMocks();

      await stopBrowserPreviewStream('task-1');

      expect(mockCdpMocks.sendCommand).toHaveBeenCalledWith('Page.stopScreencast', {}, 'sess-1');
      expect(mockCdpMocks.disconnect).toHaveBeenCalled();
      expect(mockEmitStatusUpdate).toHaveBeenCalledWith('task-1', 'main', 'stopped');
      expect(isScreencastActive()).toBe(false);
    });

    it('should be a no-op for non-existent task', async () => {
      await stopBrowserPreviewStream('non-existent');

      expect(mockCdpMocks.sendCommand).not.toHaveBeenCalled();
    });

    it('should handle errors during stop gracefully', async () => {
      await startBrowserPreviewStream('task-1');
      vi.clearAllMocks();
      mockCdpMocks.sendCommand.mockRejectedValue(new Error('Already stopped'));
      mockCdpMocks.disconnect.mockRejectedValue(new Error('Not connected'));

      await expect(stopBrowserPreviewStream('task-1')).resolves.toBeUndefined();
    });
  });

  describe('stopAllBrowserPreviewStreams', () => {
    it('should stop all active streams', async () => {
      await startBrowserPreviewStream('task-1');
      await startBrowserPreviewStream('task-2');
      vi.clearAllMocks();

      await stopAllBrowserPreviewStreams();

      expect(mockCdpMocks.disconnect).toHaveBeenCalledTimes(2);
    });

    it('should handle no active streams', async () => {
      await expect(stopAllBrowserPreviewStreams()).resolves.toBeUndefined();
    });
  });

  describe('autoStartScreencast', () => {
    it('should delegate to utils', async () => {
      mockAutoStartScreencastUtil.mockResolvedValue(undefined);

      await autoStartScreencast('task-1');

      expect(mockAutoStartScreencastUtil).toHaveBeenCalledWith('task-1', expect.any(Function));
    });
  });
});
