import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockReplaceMisspelling = vi.hoisted(() => vi.fn());
const mockAddWord = vi.hoisted(() => vi.fn());
const mockSetWindowOpenHandler = vi.hoisted(() => vi.fn());
const mockOpenDevTools = vi.hoisted(() => vi.fn());
const mockLoadURL = vi.hoisted(() => vi.fn());
const mockLoadFile = vi.hoisted(() => vi.fn());
const mockMaximize = vi.hoisted(() => vi.fn());
const mockWindowOn = vi.hoisted(() => vi.fn());
const mockOnHeadersReceived = vi.hoisted(() => vi.fn());
const mockOn = vi.hoisted(() => vi.fn());
const mockPopUp = vi.hoisted(() => vi.fn());
const mockBrowserWindowConstructor = vi.hoisted(() =>
  vi.fn(function MockBrowserWindow() {
    const send = vi.fn();
    return {
      loadURL: mockLoadURL,
      loadFile: mockLoadFile,
      maximize: mockMaximize,
      on: mockWindowOn,
      webContents: {
        on: mockOn,
        setWindowOpenHandler: mockSetWindowOpenHandler,
        openDevTools: mockOpenDevTools,
        replaceMisspelling: mockReplaceMisspelling,
        loadURL: mockLoadURL,
        loadFile: mockLoadFile,
        send,
        session: {
          webRequest: { onHeadersReceived: mockOnHeadersReceived },
          addWordToSpellCheckerDictionary: mockAddWord,
        },
      },
    };
  }),
);

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    dock: { setIcon: vi.fn() },
  },
  BrowserWindow: mockBrowserWindowConstructor,
  nativeImage: {
    createFromPath: vi.fn(() => ({ isEmpty: () => false })),
  },
  nativeTheme: {
    shouldUseDarkColors: false,
  },
  Menu: {
    buildFromTemplate: vi.fn(() => ({ popup: mockPopUp })),
  },
  shell: {
    openExternal: vi.fn(),
  },
}));

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => ({ log: vi.fn() })),
}));

import { createMainWindow } from '@main/app-window';
import { app, BrowserWindow, Menu, nativeTheme, shell } from 'electron';

describe('createMainWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_ROOT = '/mock/app/root';
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
  });

  it('should create a BrowserWindow with correct options', () => {
    const result = createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    expect(BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: 'MyBoTeam',
        titleBarStyle: 'hiddenInset',
      }),
    );
    expect(result.maximize).toHaveBeenCalled();
  });

  it('should load URL when ROUTER_URL is set', () => {
    const win = createMainWindow({ ROUTER_URL: 'http://localhost:5173', WEB_DIST: '/dist' });
    expect(win.webContents.loadURL).toHaveBeenCalledWith('http://localhost:5173');
    expect(win.webContents.loadFile).not.toHaveBeenCalled();
  });

  it('should load file when ROUTER_URL is not set', () => {
    const win = createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    expect(win.webContents.loadFile).toHaveBeenCalled();
    expect(win.webContents.loadURL).not.toHaveBeenCalled();
  });

  it('should set dock icon on macOS', () => {
    createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    expect(app.dock.setIcon).toHaveBeenCalled();
  });

  it('should not open devtools in packaged mode', () => {
    Object.defineProperty(process, 'resourcesPath', { value: '/mock', configurable: true });
    const win = createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    expect(win.webContents.openDevTools).not.toHaveBeenCalled();
  });

  it('should open devtools in non-packaged dev mode', () => {
    process.env.NODE_ENV = 'development';
    const win = createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    expect(win.webContents.openDevTools).toHaveBeenCalled();
  });

  it('should use default titleBarStyle on non-macOS', () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    const calls = (mockBrowserWindowConstructor as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0].titleBarStyle).toBe('default');
  });

  it('should set CSP header with unsafe-inline in dev mode', () => {
    const win = createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    const cb = (mockOnHeadersReceived as ReturnType<typeof vi.fn>).mock.calls[0][0] as (
      details: { responseHeaders: Record<string, string[]> },
      callback: (result: { responseHeaders: Record<string, string[]> }) => void,
    ) => void;
    const mockCallback = vi.fn();
    cb({ responseHeaders: {} }, mockCallback);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        responseHeaders: expect.objectContaining({
          'Content-Security-Policy': [expect.stringContaining("'unsafe-inline'")],
        }),
      }),
    );
  });

  it('should open external URLs via shell', () => {
    const win = createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    const handler = win.webContents.setWindowOpenHandler.mock.calls[0][0];
    const result = handler({ url: 'https://example.com' });
    expect(shell.openExternal).toHaveBeenCalledWith('https://example.com');
    expect(result).toEqual({ action: 'deny' });
  });

  it('should not open non-http URLs via shell', () => {
    const win = createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    const handler = win.webContents.setWindowOpenHandler.mock.calls[0][0];
    handler({ url: 'file:///etc/passwd' });
    expect(shell.openExternal).not.toHaveBeenCalled();
  });

  it('should show spellcheck context menu with suggestions', () => {
    const win = createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    const contextMenuHandler = win.webContents.on.mock.calls.find(
      (c: [string]) => c[0] === 'context-menu',
    )?.[1];
    expect(contextMenuHandler).toBeDefined();
    const params = {
      misspelledWord: 'helloo',
      dictionarySuggestions: ['hello', 'helio'],
    };
    contextMenuHandler(null, params);
    expect(Menu.buildFromTemplate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ label: 'hello' }),
        expect.objectContaining({ label: 'Add to Dictionary' }),
      ]),
    );
  });

  it('should return early from context menu when no misspelled word', () => {
    const win = createMainWindow({ ROUTER_URL: undefined, WEB_DIST: '/dist' });
    const contextMenuHandler = win.webContents.on.mock.calls.find(
      (c: [string]) => c[0] === 'context-menu',
    )?.[1];
    const params = { misspelledWord: '', dictionarySuggestions: [] };
    contextMenuHandler(null, params);
    expect(Menu.buildFromTemplate).not.toHaveBeenCalled();
  });
});
