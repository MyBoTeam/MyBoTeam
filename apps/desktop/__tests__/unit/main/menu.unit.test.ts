import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCheckForUpdates = vi.hoisted(() => vi.fn());
const mockGetUpdateState = vi.hoisted(() => vi.fn());
const mockQuitAndInstall = vi.hoisted(() => vi.fn());
const mockSetOnUpdateDownloaded = vi.hoisted(() => vi.fn());

vi.mock('@main/updater', () => ({
  checkForUpdates: mockCheckForUpdates,
  getUpdateState: mockGetUpdateState,
  quitAndInstall: mockQuitAndInstall,
  setOnUpdateDownloaded: mockSetOnUpdateDownloaded,
}));

const mockShowMessageBox = vi.hoisted(() => vi.fn());
const mockSetApplicationMenu = vi.hoisted(() => vi.fn());
const mockBuildFromTemplate = vi.hoisted(() => vi.fn((template: unknown) => template));
const mockGetVersion = vi.hoisted(() => vi.fn(() => '1.0.0'));

vi.mock('electron', () => ({
  app: {
    name: 'MyBoTeam',
    getVersion: mockGetVersion,
  },
  Menu: {
    setApplicationMenu: mockSetApplicationMenu,
    buildFromTemplate: mockBuildFromTemplate,
  },
  dialog: {
    showMessageBox: mockShowMessageBox,
  },
  shell: {
    openExternal: vi.fn(),
  },
}));

import { buildAppMenu, initMenu, refreshAppMenu } from '@main/menu';
import { app, Menu } from 'electron';

describe('Application Menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockGetUpdateState.mockReturnValue({
      updateAvailable: false,
      downloadedVersion: null,
    });
  });

  describe('buildAppMenu', () => {
    it('should build and set application menu', () => {
      buildAppMenu();
      expect(Menu.setApplicationMenu).toHaveBeenCalled();
      const template = Menu.buildFromTemplate.mock.calls[0][0];
      expect(template.length).toBeGreaterThan(0);
    });

    it('should include "Check for Updates" when no update available', () => {
      buildAppMenu();
      const template = Menu.buildFromTemplate.mock.calls[0][0];
      const flatItems = flattenMenu(template);
      expect(
        flatItems.some(
          (i: Electron.MenuItemConstructorOptions) => i.label === 'Check for Updates...',
        ),
      ).toBe(true);
    });

    it('should include "Restart to Update" when update available', () => {
      mockGetUpdateState.mockReturnValue({
        updateAvailable: true,
        downloadedVersion: '1.1.0',
      });
      buildAppMenu();
      const template = Menu.buildFromTemplate.mock.calls[0][0];
      const flatItems = flattenMenu(template);
      expect(
        flatItems.some((i: Electron.MenuItemConstructorOptions) =>
          i.label?.includes('Restart to Update'),
        ),
      ).toBe(true);
    });

    it('should include macOS-specific submenu on darwin', () => {
      buildAppMenu();
      const template = Menu.buildFromTemplate.mock.calls[0][0];
      const appMenu = template.find(
        (i: Electron.MenuItemConstructorOptions) => i.label === 'MyBoTeam',
      );
      expect(appMenu).toBeDefined();
      expect(appMenu.submenu).toBeDefined();
    });

    it('should include Help menu with Learn More on all platforms', () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
      buildAppMenu();
      const template = Menu.buildFromTemplate.mock.calls[0][0];
      const helpMenu = template.find(
        (i: Electron.MenuItemConstructorOptions) => i.label === 'Help',
      );
      expect(helpMenu).toBeDefined();
      const helpSubmenu = helpMenu.submenu as Electron.MenuItemConstructorOptions[];
      expect(helpSubmenu.some((i) => i.label === 'Learn More')).toBe(true);
    });

    it('should include About on non-macOS in Help menu', () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
      buildAppMenu();
      const template = Menu.buildFromTemplate.mock.calls[0][0];
      const helpMenu = template.find(
        (i: Electron.MenuItemConstructorOptions) => i.label === 'Help',
      );
      const helpSubmenu = helpMenu.submenu as Electron.MenuItemConstructorOptions[];
      expect(helpSubmenu.some((i) => i.label === 'About MyBoTeam')).toBe(true);
    });

    it('should include Edit menu', () => {
      buildAppMenu();
      const template = Menu.buildFromTemplate.mock.calls[0][0];
      expect(template.some((i: Electron.MenuItemConstructorOptions) => i.label === 'Edit')).toBe(
        true,
      );
    });
  });

  describe('refreshAppMenu', () => {
    it('should rebuild the menu', () => {
      buildAppMenu();
      vi.clearAllMocks();
      refreshAppMenu();
      expect(Menu.setApplicationMenu).toHaveBeenCalled();
    });
  });

  describe('initMenu', () => {
    it('should build menu and set update callback', () => {
      initMenu();
      expect(Menu.setApplicationMenu).toHaveBeenCalled();
      expect(mockSetOnUpdateDownloaded).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should refresh menu when update is downloaded', () => {
      initMenu();
      const callback = mockSetOnUpdateDownloaded.mock.calls[0][0];
      vi.clearAllMocks();
      callback();
      expect(Menu.setApplicationMenu).toHaveBeenCalled();
    });
  });
});

function flattenMenu(
  items: Electron.MenuItemConstructorOptions[],
): Electron.MenuItemConstructorOptions[] {
  const result: Electron.MenuItemConstructorOptions[] = [];
  for (const item of items) {
    result.push(item);
    if (item.submenu && Array.isArray(item.submenu)) {
      result.push(...flattenMenu(item.submenu as Electron.MenuItemConstructorOptions[]));
    }
  }
  return result;
}
