import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockLogCollector = vi.hoisted(() => ({
  flush: vi.fn(),
  getCurrentLogPath: vi.fn(() => '/tmp/logs/current.log'),
  getLogDir: vi.fn(() => '/tmp/logs'),
  logBrowser: vi.fn(),
}));
const handlers: Record<string, (...args: unknown[]) => unknown> = {};
const mockAssertTrustedWindow = vi.hoisted(() => vi.fn((w: unknown) => w));

const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => mockLogCollector),
}));

vi.mock('electron', () => ({
  BrowserWindow: { fromWebContents: vi.fn(() => ({ id: 1 })) },
  dialog: { showSaveDialog: vi.fn() },
}));

const mockFsExistsSync = vi.hoisted(() => vi.fn());
const mockFsCopyFileSync = vi.hoisted(() => vi.fn());
const mockFsWriteFileSync = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockFsExistsSync,
    copyFileSync: mockFsCopyFileSync,
    writeFileSync: mockFsWriteFileSync,
  },
  existsSync: mockFsExistsSync,
  copyFileSync: mockFsCopyFileSync,
  writeFileSync: mockFsWriteFileSync,
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  assertTrustedWindow: mockAssertTrustedWindow,
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handlers[channel as string] = handler;
  }),
}));

import { registerLogHandlers } from '@main/ipc/handlers/log-handlers';
import { BrowserWindow, dialog } from 'electron';

describe('log-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerLogHandlers();
  });

  describe('logs:export', () => {
    it('should throw when debug mode is disabled', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: false } });
      await expect(handlers['logs:export']({ sender: {} })).rejects.toThrow(
        'Debug mode is disabled',
      );
    });

    it('should export log file successfully', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: true } });
      mockAssertTrustedWindow.mockReturnValue({ id: 1 });
      (dialog.showSaveDialog as ReturnType<typeof vi.fn>).mockResolvedValue({
        canceled: false,
        filePath: '/export/output.log',
      });
      mockFsExistsSync.mockReturnValue(true);

      const result = await handlers['logs:export']({ sender: {} });
      expect(result).toEqual({ success: true, path: '/export/output.log' });
    });

    it('should create header when log file does not exist', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: true } });
      mockAssertTrustedWindow.mockReturnValue({ id: 1 });
      (dialog.showSaveDialog as ReturnType<typeof vi.fn>).mockResolvedValue({
        canceled: false,
        filePath: '/export/output.log',
      });
      mockFsExistsSync.mockReturnValue(false);

      const result = await handlers['logs:export']({ sender: {} });
      expect(result).toEqual({ success: true, path: '/export/output.log' });
    });

    it('should return cancelled when dialog is cancelled', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: true } });
      mockAssertTrustedWindow.mockReturnValue({ id: 1 });
      (dialog.showSaveDialog as ReturnType<typeof vi.fn>).mockResolvedValue({
        canceled: true,
        filePath: null,
      });
      const result = await handlers['logs:export']({ sender: {} });
      expect(result).toEqual({ success: false, reason: 'cancelled' });
    });

    it('should handle file copy errors', async () => {
      mockDaemonClient.call.mockResolvedValue({ app: { debugMode: true } });
      mockAssertTrustedWindow.mockReturnValue({ id: 1 });
      (dialog.showSaveDialog as ReturnType<typeof vi.fn>).mockResolvedValue({
        canceled: false,
        filePath: '/export/output.log',
      });
      mockFsExistsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      const result = await handlers['logs:export']({ sender: {} });
      expect(result).toEqual({ success: false, error: 'Permission denied' });
    });
  });

  describe('log:event', () => {
    it('should call logBrowser with valid log level', async () => {
      await handlers['log:event']({} as unknown, {
        level: 'WARN',
        message: 'test warn',
        context: { key: 'val' },
      });
      expect(mockLogCollector.logBrowser).toHaveBeenCalledWith('WARN', 'test warn', { key: 'val' });
    });

    it('should default to INFO for invalid log level', async () => {
      await handlers['log:event']({} as unknown, { level: 'INVALID', message: 'test' });
      expect(mockLogCollector.logBrowser).toHaveBeenCalledWith('INFO', 'test', undefined);
    });

    it('should handle missing payload gracefully', async () => {
      await handlers['log:event']({} as unknown, undefined);
      expect(mockLogCollector.logBrowser).toHaveBeenCalledWith('INFO', '', undefined);
    });

    it('should return { ok: true }', async () => {
      const result = await handlers['log:event']({} as unknown, { message: 'test' });
      expect(result).toEqual({ ok: true });
    });
  });
});
