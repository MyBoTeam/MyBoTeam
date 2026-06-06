import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockApp = vi.hoisted(() => ({ quit: vi.fn() }));

vi.mock('electron', () => ({
  app: mockApp,
}));

const mockStopDevBrowser = vi.hoisted(() => vi.fn());
const mockCleanupVertex = vi.hoisted(() => vi.fn());
const mockSlackOAuthDispose = vi.hoisted(() => vi.fn());

vi.mock('@main/opencode', () => ({
  cleanupVertexServiceAccountKey: mockCleanupVertex,
  stopDevBrowserServer: mockStopDevBrowser,
}));

vi.mock('@main/opencode/slack-auth', () => ({
  slackMcpOAuthFlow: { dispose: mockSlackOAuthDispose },
}));

const mockFlushAnalytics = vi.hoisted(() => vi.fn());
const mockTrackAppClose = vi.hoisted(() => vi.fn());
const mockFlushMixpanel = vi.hoisted(() => vi.fn());

vi.mock('@main/analytics/analytics-service', () => ({
  flushAnalytics: mockFlushAnalytics,
}));

vi.mock('@main/analytics/events', () => ({
  trackAppClose: mockTrackAppClose,
}));

vi.mock('@main/analytics/mixpanel-service', () => ({
  flushMixpanel: mockFlushMixpanel,
}));

const mockStopHFServer = vi.hoisted(() => vi.fn());

vi.mock('@main/providers/huggingface-local', () => ({
  stopHuggingFaceServer: mockStopHFServer,
}));

const mockStopBrowserPreview = vi.hoisted(() => vi.fn());

vi.mock('@main/services/browserPreview', () => ({
  stopAllBrowserPreviewStreams: mockStopBrowserPreview,
}));

const mockWorkspaceClose = vi.hoisted(() => vi.fn());

vi.mock('@main/store/workspaceManager', () => ({
  close: mockWorkspaceClose,
}));

const mockDestroyTray = vi.hoisted(() => vi.fn());

vi.mock('@main/tray', () => ({
  destroyTray: mockDestroyTray,
}));

const mockShutdownLogCollector = vi.hoisted(() => vi.fn());

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => ({ logEnv: vi.fn() })),
  shutdownLogCollector: mockShutdownLogCollector,
}));

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));
const mockShutdownDaemon = vi.hoisted(() => vi.fn());

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
  shutdownDaemon: mockShutdownDaemon,
}));

import { requestStopDaemonOnQuit, shutdownApp } from '@main/app-shutdown';

describe('app-shutdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDaemonClient.call.mockReturnValue(Promise.resolve());
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    mockStopDevBrowser.mockResolvedValue(undefined);
    mockStopBrowserPreview.mockResolvedValue(undefined);
    mockStopHFServer.mockResolvedValue(undefined);
    mockTrackAppClose.mockResolvedValue(undefined);
  });

  it('should call destroyTray on shutdown', async () => {
    await shutdownApp(null);
    expect(mockDestroyTray).toHaveBeenCalled();
  });

  it('should stop dev browser server', async () => {
    await shutdownApp(null);
    expect(mockStopDevBrowser).toHaveBeenCalled();
  });

  it('should stop browser preview streams', async () => {
    await shutdownApp(null);
    expect(mockStopBrowserPreview).toHaveBeenCalled();
  });

  it('should stop HF server', async () => {
    await shutdownApp(null);
    expect(mockStopHFServer).toHaveBeenCalled();
  });

  it('should cleanup vertex key', async () => {
    await shutdownApp(null);
    expect(mockCleanupVertex).toHaveBeenCalled();
  });

  it('should dispose slack OAuth flow', async () => {
    await shutdownApp(null);
    expect(mockSlackOAuthDispose).toHaveBeenCalled();
  });

  it('should close workspace manager', async () => {
    await shutdownApp(null);
    expect(mockWorkspaceClose).toHaveBeenCalled();
  });

  it('should track app close and flush analytics', async () => {
    await shutdownApp(null);
    expect(mockTrackAppClose).toHaveBeenCalled();
    expect(mockFlushAnalytics).toHaveBeenCalled();
    expect(mockFlushMixpanel).toHaveBeenCalled();
  });

  it('should call app.quit on shutdown', async () => {
    await shutdownApp(null);
    expect(mockShutdownLogCollector).toHaveBeenCalled();
    expect(mockApp.quit).toHaveBeenCalled();
  });

  it('should handle dev browser timeout error gracefully', async () => {
    mockStopDevBrowser.mockReturnValue(
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 6000);
      }),
    );
    const promise = shutdownApp(null);
    await expect(promise).resolves.toBeUndefined();
  }, 10000);

  it('should handle errors from stopBrowserPreview streams gracefully', async () => {
    mockStopBrowserPreview.mockRejectedValue(new Error('Stream error'));
    await expect(shutdownApp(null)).resolves.toBeUndefined();
  });

  it('should handle errors from stopHFServer gracefully', async () => {
    mockStopHFServer.mockRejectedValue(new Error('HF error'));
    await expect(shutdownApp(null)).resolves.toBeUndefined();
  });

  it('should handle cleanupVertex errors gracefully', async () => {
    mockCleanupVertex.mockImplementation(() => {
      throw new Error('Vertex error');
    });
    await expect(shutdownApp(null)).resolves.toBeUndefined();
  });

  it('should handle slack dispose errors gracefully', async () => {
    mockSlackOAuthDispose.mockImplementation(() => {
      throw new Error('Slack error');
    });
    await expect(shutdownApp(null)).resolves.toBeUndefined();
  });

  it('should handle workspace close errors gracefully', async () => {
    mockWorkspaceClose.mockImplementation(() => {
      throw new Error('Workspace error');
    });
    await expect(shutdownApp(null)).resolves.toBeUndefined();
  });

  it('should handle analytics errors gracefully', async () => {
    mockTrackAppClose.mockRejectedValue(new Error('Analytics error'));
    await expect(shutdownApp(null)).resolves.toBeUndefined();
  });

  it('should shutdown daemon when stopDaemonOnQuit is set', async () => {
    requestStopDaemonOnQuit();
    mockDaemonClient.call.mockResolvedValue(undefined);
    await shutdownApp(null);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('daemon.shutdown');
    expect(mockShutdownDaemon).toHaveBeenCalled();
  });

  it('should skip daemon shutdown RPC on error', async () => {
    requestStopDaemonOnQuit();
    mockDaemonClient.call.mockRejectedValue(new Error('RPC error'));
    await shutdownApp(null);
    expect(mockShutdownDaemon).toHaveBeenCalled();
  });

  it('should propagate logger errors', async () => {
    mockStopDevBrowser.mockRejectedValue(new Error('Dev browser error'));
    await expect(
      shutdownApp({
        logEnv: vi.fn().mockImplementation(() => {
          throw new Error('Log error');
        }),
      } as unknown as ReturnType<typeof vi.fn>),
    ).rejects.toThrow('Log error');
  });

  it('should log errors via logger when provided', async () => {
    const logger = { logEnv: vi.fn() };
    mockStopDevBrowser.mockRejectedValue(new Error('Dev browser error'));
    await shutdownApp(logger as unknown as ReturnType<typeof vi.fn>);
    expect(logger.logEnv).toHaveBeenCalledWith(
      'ERROR',
      expect.stringContaining('Failed to stop dev-browser server'),
    );
  });
});
