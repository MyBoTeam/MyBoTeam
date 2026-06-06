import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.0.0'),
  },
  BrowserWindow: {
    fromWebContents: vi.fn(() => ({ id: 1 })),
  },
  dialog: {
    showSaveDialog: vi.fn(),
  },
}));

vi.mock('node:fs', () => {
  const mockAccess = vi.fn();
  const mockWriteFile = vi.fn();
  const mockExistsSync = vi.fn();
  return {
    default: {
      existsSync: mockExistsSync,
      promises: { access: mockAccess, writeFile: mockWriteFile },
    },
    existsSync: mockExistsSync,
    promises: { access: mockAccess, writeFile: mockWriteFile },
  };
});

const mockAssertTrustedWindow = vi.hoisted(() => vi.fn((w: unknown) => w));

vi.mock('@main/ipc/handlers/utils', () => ({
  assertTrustedWindow: mockAssertTrustedWindow,
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handlers[channel as string] = handler;
  }),
}));

import { registerBugReportHandlers } from '@main/ipc/handlers/bug-report-handlers';
import { dialog } from 'electron';

describe('bug-report-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerBugReportHandlers();
  });

  describe('debug:generate-bug-report', () => {
    it('should return error when debug mode is disabled', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: false } });
      const result = await handlers['debug:generate-bug-report']({ sender: {} }, {});
      expect(result).toEqual({ success: false, error: 'Debug mode is disabled' });
    });

    it('should return error when window is untrusted', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: true } });
      mockAssertTrustedWindow.mockImplementation(() => {
        throw new Error('Untrusted window');
      });
      const result = await handlers['debug:generate-bug-report']({ sender: {} }, {});
      expect(result).toEqual({ success: false, error: 'Untrusted window' });
    });

    it('should generate bug report file successfully', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: true } });
      mockAssertTrustedWindow.mockReturnValue({ id: 1 });
      (dialog.showSaveDialog as ReturnType<typeof vi.fn>).mockResolvedValue({
        canceled: false,
        filePath: '/tmp/bug-report.json',
      });

      const result = await handlers['debug:generate-bug-report'](
        { sender: {} },
        {
          taskId: 'task-1',
          taskPrompt: 'test',
          taskStatus: 'completed',
          appVersion: '1.0.0',
          platform: 'darwin',
          messages: [{ role: 'user' }],
        },
      );
      expect(result).toEqual({ success: true, path: '/tmp/bug-report.json' });
    });

    it('should save screenshot as separate file', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: true } });
      (dialog.showSaveDialog as ReturnType<typeof vi.fn>).mockResolvedValue({
        canceled: false,
        filePath: '/tmp/bug-report.json',
      });
      vi.mocked((await import('node:fs')).promises.access).mockRejectedValue(
        new Error('not found'),
      );

      const result = await handlers['debug:generate-bug-report'](
        { sender: {} },
        {
          screenshot: 'base64encodedstring',
          taskPrompt: 'test',
        },
      );
      expect(result.success).toBe(true);
    });

    it('should return cancelled when dialog is cancelled', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: true } });
      (dialog.showSaveDialog as ReturnType<typeof vi.fn>).mockResolvedValue({
        canceled: true,
        filePath: null,
      });
      const result = await handlers['debug:generate-bug-report']({ sender: {} }, {});
      expect(result).toEqual({ success: false, reason: 'cancelled' });
    });

    it('should handle write errors', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: true } });
      (dialog.showSaveDialog as ReturnType<typeof vi.fn>).mockResolvedValue({
        canceled: false,
        filePath: '/tmp/bug-report.json',
      });
      vi.mocked((await import('node:fs')).promises.writeFile).mockRejectedValue(
        new Error('Disk full'),
      );

      const result = await handlers['debug:generate-bug-report'](
        { sender: {} },
        { taskPrompt: 'test' },
      );
      expect(result).toEqual({ success: false, error: 'Disk full' });
    });
  });
});
