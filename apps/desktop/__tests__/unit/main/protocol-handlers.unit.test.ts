import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockWebContentsSend = vi.hoisted(() => vi.fn());
const mockIsLoadingMainFrame = vi.hoisted(() => vi.fn(() => false));
const mockIsDestroyed = vi.hoisted(() => vi.fn(() => false));
/**
 * Simulates did-finish-load: when a listener is registered, toggle
 * isLoadingMainFrame to false and invoke the callback so drainProtocolUrlQueue
 * proceeds to drain.
 */
const mockWebContentsOnce = vi.hoisted(() =>
  vi.fn((_event: string, cb: () => void) => {
    mockIsLoadingMainFrame.mockReturnValue(false);
    cb();
  }),
);
const mockOnIpc = vi.hoisted(() => vi.fn());
const mockOnEvent = vi.hoisted(() => vi.fn());
const mockWhenReady = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const mockGetVersion = vi.hoisted(() => vi.fn(() => '1.2.3'));

vi.mock('electron', () => {
  const mockApp: Record<string, unknown> = {
    on: mockOnEvent,
    whenReady: mockWhenReady,
    getVersion: mockGetVersion,
  };
  return {
    app: mockApp,
    ipcMain: {
      handle: mockOnIpc,
    },
    BrowserWindow: vi.fn(),
  };
});

import {
  drainProtocolUrlQueue,
  handleProtocolUrlFromArgs,
  handleSecondInstanceProtocolUrl,
  registerAppIpcHandlers,
  registerProtocolEventHandlers,
} from '@main/protocol-handlers';

function makeMockWin() {
  return {
    webContents: {
      send: mockWebContentsSend,
      isLoadingMainFrame: mockIsLoadingMainFrame,
      once: mockWebContentsOnce,
    },
    isDestroyed: mockIsDestroyed,
  } as any;
}

describe('protocol-handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoadingMainFrame.mockReturnValue(false);
    mockIsDestroyed.mockReturnValue(false);
  });

  describe('drainProtocolUrlQueue', () => {
    it('should wait for did-finish-load when renderer is loading', () => {
      mockIsLoadingMainFrame.mockReturnValue(true);
      const win = makeMockWin();

      drainProtocolUrlQueue(win);

      expect(win.webContents.once).toHaveBeenCalledWith('did-finish-load', expect.any(Function));
    });
  });

  describe('handleProtocolUrlFromArgs', () => {
    const origPlatform = process.platform;
    const origArgv = process.argv;

    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: origPlatform, configurable: true });
      Object.defineProperty(process, 'argv', { value: origArgv, configurable: true });
    });

    it('should do nothing on non-Windows platforms', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
      const getWindow = vi.fn();
      handleProtocolUrlFromArgs(getWindow);
      expect(getWindow).not.toHaveBeenCalled();
    });

    it('should do nothing on Windows when no protocol URL in args', () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
      Object.defineProperty(process, 'argv', { value: ['app.exe', '--flag'], configurable: true });
      const getWindow = vi.fn();
      handleProtocolUrlFromArgs(getWindow);
      expect(getWindow).not.toHaveBeenCalled();
    });

    it('should enqueue and dispatch protocol URL on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
      Object.defineProperty(process, 'argv', {
        value: ['app.exe', 'myboteam://callback?code=abc'],
        configurable: true,
      });

      const win = makeMockWin();
      const getWindow = vi.fn(() => win);
      handleProtocolUrlFromArgs(getWindow);

      await mockWhenReady();
      expect(mockWebContentsSend).toHaveBeenCalled();
    });
  });

  describe('registerProtocolEventHandlers', () => {
    it('should register open-url event handler', () => {
      const getWindow = vi.fn(() => makeMockWin());
      registerProtocolEventHandlers(getWindow);
      expect(mockOnEvent).toHaveBeenCalledWith('open-url', expect.any(Function));
    });
  });

  describe('handleSecondInstanceProtocolUrl', () => {
    const origPlatform = process.platform;

    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: origPlatform, configurable: true });
    });

    it('should do nothing on non-Windows platforms', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
      const win = makeMockWin();
      const getWindow = vi.fn();
      handleSecondInstanceProtocolUrl(win, ['app.exe', 'myboteam://callback'], getWindow);
      expect(getWindow).not.toHaveBeenCalled();
    });

    it('should do nothing when no protocol URL in commandLine', () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
      const win = makeMockWin();
      const getWindow = vi.fn();
      handleSecondInstanceProtocolUrl(win, ['app.exe', '--flag'], getWindow);
      expect(getWindow).not.toHaveBeenCalled();
    });

    it('should dispatch protocol URL on Windows when found in commandLine', () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
      const win = makeMockWin();
      const getWindow = vi.fn(() => win);
      handleSecondInstanceProtocolUrl(win, ['app.exe', 'myboteam://callback?token=xyz'], getWindow);
      expect(mockWebContentsSend).toHaveBeenCalled();
    });
  });

  describe('registerAppIpcHandlers', () => {
    it('should register app:version, app:platform, and app:is-e2e-mode handlers', () => {
      registerAppIpcHandlers();
      expect(mockOnIpc).toHaveBeenCalledWith('app:version', expect.any(Function));
      expect(mockOnIpc).toHaveBeenCalledWith('app:platform', expect.any(Function));
      expect(mockOnIpc).toHaveBeenCalledWith('app:is-e2e-mode', expect.any(Function));
    });
  });
});
