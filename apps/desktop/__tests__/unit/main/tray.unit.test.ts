import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetToolTip = vi.fn();
const mockSetContextMenu = vi.fn();
const mockDestroy = vi.fn();
const mockOn = vi.fn();
const mockIsDestroyed = vi.fn(() => false);

const mockShow = vi.fn();
const mockHide = vi.fn();
const mockFocus = vi.fn();
const mockIsVisible = vi.fn(() => true);

const mockTrayInstance = {
  setToolTip: mockSetToolTip,
  setContextMenu: mockSetContextMenu,
  destroy: mockDestroy,
  on: mockOn,
  isDestroyed: mockIsDestroyed,
};

const mockMainWindow = {
  show: mockShow,
  hide: mockHide,
  focus: mockFocus,
  isVisible: mockIsVisible,
  isDestroyed: vi.fn(() => false),
};

const mockTrayConstructor = vi.hoisted(() =>
  vi.fn(function MockTray() {
    return mockTrayInstance;
  }),
);

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
  },
  Tray: mockTrayConstructor,
  nativeImage: {
    createFromPath: vi.fn(() => ({ isEmpty: () => false, resize: vi.fn(() => ({})) })),
  },
  Menu: {
    buildFromTemplate: vi.fn((items: unknown) => items),
  },
}));

vi.mock('@main/daemon/service-manager', () => ({
  isAutoStartEnabled: vi.fn(() => false),
  enableAutoStart: vi.fn(),
  disableAutoStart: vi.fn(),
}));

import { createTray, destroyTray, updateTaskCount, updateTray } from '@main/tray';
import { app, Menu, nativeImage, Tray } from 'electron';

const mockedNativeImage = vi.mocked(nativeImage);

describe('Tray', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_ROOT = '/mock/app/root';
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockIsDestroyed.mockReturnValue(false);
    mockIsVisible.mockReturnValue(true);
  });

  describe('createTray', () => {
    it('should create a tray with resized icon', () => {
      const result = createTray(mockMainWindow as unknown as Electron.BrowserWindow);
      expect(Tray).toHaveBeenCalled();
      expect(mockSetToolTip).toHaveBeenCalledWith('MyBoTeam');
      expect(mockOn).toHaveBeenCalledWith('click', expect.any(Function));
      expect(result).toBe(mockTrayInstance);
    });

    it('should toggle window visibility on click', () => {
      createTray(mockMainWindow as unknown as Electron.BrowserWindow);
      const clickHandler = mockOn.mock.calls.find((c: [string]) => c[0] === 'click')?.[1];
      clickHandler();
      expect(mockHide).toHaveBeenCalled();
      mockIsVisible.mockReturnValue(false);
      clickHandler();
      expect(mockShow).toHaveBeenCalled();
    });

    it('should not show hidden window on click when destroyed', () => {
      mockMainWindow.isDestroyed.mockReturnValue(true);
      createTray(mockMainWindow as unknown as Electron.BrowserWindow);
      const clickHandler = mockOn.mock.calls.find((c: [string]) => c[0] === 'click')?.[1];
      clickHandler();
      expect(mockShow).not.toHaveBeenCalled();
    });

    it('should resize icon to 22x22 on Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
      createTray(mockMainWindow as unknown as Electron.BrowserWindow);
      const icon = mockedNativeImage.createFromPath.mock.results[0].value;
      expect(icon.resize).toHaveBeenCalledWith({ width: 22, height: 22 });
    });

    it('should resize icon to 16x16 on non-Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
      createTray(mockMainWindow as unknown as Electron.BrowserWindow);
      const icon = mockedNativeImage.createFromPath.mock.results[0].value;
      expect(icon.resize).toHaveBeenCalledWith({ width: 16, height: 16 });
    });
  });

  describe('updateTaskCount', () => {
    it('should update context menu with active task count', () => {
      createTray(mockMainWindow as unknown as Electron.BrowserWindow);
      updateTaskCount(3, mockMainWindow as unknown as Electron.BrowserWindow);
      expect(Menu.buildFromTemplate).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ label: 'Active Tasks: 3' })]),
      );
      expect(mockSetToolTip).toHaveBeenCalledWith('MyBoTeam — 3 task(s) running');
    });

    it('should show "No Active Tasks" when count is zero', () => {
      createTray(mockMainWindow as unknown as Electron.BrowserWindow);
      updateTaskCount(0, mockMainWindow as unknown as Electron.BrowserWindow);
      expect(Menu.buildFromTemplate).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ label: 'No Active Tasks' })]),
      );
      expect(mockSetToolTip).toHaveBeenCalledWith('MyBoTeam');
    });

    it('should not update when tray is destroyed', () => {
      mockIsDestroyed.mockReturnValue(true);
      updateTaskCount(5, mockMainWindow as unknown as Electron.BrowserWindow);
      expect(mockSetContextMenu).not.toHaveBeenCalled();
    });
  });

  describe('destroyTray', () => {
    it('should destroy tray if it exists', () => {
      createTray(null);
      destroyTray();
      expect(mockDestroy).toHaveBeenCalled();
    });

    it('should not throw if no tray exists', () => {
      expect(() => destroyTray()).not.toThrow();
    });
  });

  describe('updateTray', () => {
    it('should update tray context menu', () => {
      createTray(mockMainWindow as unknown as Electron.BrowserWindow);
      updateTray();
      expect(mockSetContextMenu).toHaveBeenCalled();
    });

    it('should not throw if no tray exists', () => {
      expect(() => updateTray()).not.toThrow();
    });
  });
});
