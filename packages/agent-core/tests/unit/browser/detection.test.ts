import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExistsSync = vi.fn();
const mockReaddirSync = vi.fn();
const mockHomedir = vi.fn();

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readdirSync: mockReaddirSync,
  },
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
}));

vi.mock('node:os', () => ({
  default: {
    homedir: mockHomedir,
  },
  homedir: mockHomedir,
}));

describe('browser/detection', () => {
  let originalPlatform: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalPlatform = process.platform;
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    process.env = originalEnv;
  });

  describe('isSystemChromeInstalled', () => {
    it('should detect Chrome on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockExistsSync.mockReturnValueOnce(true);

      const { isSystemChromeInstalled } = await import('../../../src/browser/detection.js');
      expect(isSystemChromeInstalled()).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith('/Applications/Google Chrome.app');
    });

    it('should return false when Chrome is not found on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockExistsSync.mockReturnValueOnce(false);

      const { isSystemChromeInstalled } = await import('../../../src/browser/detection.js');
      expect(isSystemChromeInstalled()).toBe(false);
    });

    it('should detect Chrome on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      process.env.PROGRAMFILES = 'C:\\Program Files';
      process.env['PROGRAMFILES(X86)'] = 'C:\\Program Files (x86)';
      mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const { isSystemChromeInstalled } = await import('../../../src/browser/detection.js');
      expect(isSystemChromeInstalled()).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith(expect.stringContaining('Chrome'));
    });

    it('should detect Chrome on Linux via google-chrome', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      mockExistsSync.mockReturnValueOnce(true);

      const { isSystemChromeInstalled } = await import('../../../src/browser/detection.js');
      expect(isSystemChromeInstalled()).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith('/usr/bin/google-chrome');
    });

    it('should detect Chrome on Linux via chromium-browser fallback', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const { isSystemChromeInstalled } = await import('../../../src/browser/detection.js');
      expect(isSystemChromeInstalled()).toBe(true);
      expect(mockExistsSync).toHaveBeenLastCalledWith('/usr/bin/chromium-browser');
    });
  });

  describe('isPlaywrightInstalled', () => {
    it('should return true when ms-playwright exists with chromium entries on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockHomedir.mockReturnValue('/Users/test');
      mockExistsSync.mockReturnValueOnce(true);
      mockReaddirSync.mockReturnValueOnce(['chromium-1000', 'firefox-900']);

      const { isPlaywrightInstalled } = await import('../../../src/browser/detection.js');
      expect(isPlaywrightInstalled()).toBe(true);
      expect(mockReaddirSync).toHaveBeenCalledWith('/Users/test/Library/Caches/ms-playwright');
    });

    it('should return true when ms-playwright exists with chromium in .cache on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockHomedir.mockReturnValue('/Users/test');
      mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
      mockReaddirSync.mockReturnValueOnce(['chromium-1000']);

      const { isPlaywrightInstalled } = await import('../../../src/browser/detection.js');
      expect(isPlaywrightInstalled()).toBe(true);
      expect(mockReaddirSync).toHaveBeenCalledWith('/Users/test/.cache/ms-playwright');
    });

    it('should check Windows path first on win32', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      process.env.LOCALAPPDATA = 'C:\\Users\\test\\AppData\\Local';
      mockHomedir.mockReturnValue('C:\\Users\\test');
      mockExistsSync.mockReturnValueOnce(true);
      mockReaddirSync.mockReturnValueOnce(['chromium-1000']);

      const { isPlaywrightInstalled } = await import('../../../src/browser/detection.js');
      expect(isPlaywrightInstalled()).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith(expect.stringContaining('ms-playwright'));
    });

    it('should return false when no playwright dir exists', async () => {
      mockHomedir.mockReturnValue('/Users/test');
      mockExistsSync.mockReturnValue(false);

      const { isPlaywrightInstalled } = await import('../../../src/browser/detection.js');
      expect(isPlaywrightInstalled()).toBe(false);
    });

    it('should handle readdir errors gracefully', async () => {
      mockHomedir.mockReturnValue('/Users/test');
      mockExistsSync.mockReturnValueOnce(true);
      mockReaddirSync.mockImplementationOnce(() => {
        throw new Error('permission denied');
      });
      mockExistsSync.mockReturnValueOnce(true);
      mockReaddirSync.mockImplementationOnce(() => {
        throw new Error('permission denied');
      });

      const { isPlaywrightInstalled } = await import('../../../src/browser/detection.js');
      expect(isPlaywrightInstalled()).toBe(false);
    });

    it('should return false when no chromium entry exists', async () => {
      mockHomedir.mockReturnValue('/Users/test');
      mockExistsSync.mockReturnValueOnce(true);
      mockReaddirSync.mockReturnValueOnce(['firefox-900']);

      const { isPlaywrightInstalled } = await import('../../../src/browser/detection.js');
      expect(isPlaywrightInstalled()).toBe(false);
    });
  });

  describe('hasBrowserAvailable', () => {
    it('should return true when Chrome is installed', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockExistsSync.mockReturnValueOnce(true);

      const { hasBrowserAvailable } = await import('../../../src/browser/detection.js');
      expect(hasBrowserAvailable()).toBe(true);
    });

    it('should return true when Playwright is installed but Chrome is not', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockHomedir.mockReturnValue('/Users/test');
      mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
      mockReaddirSync.mockReturnValueOnce(['chromium-1000']);

      const { hasBrowserAvailable } = await import('../../../src/browser/detection.js');
      expect(hasBrowserAvailable()).toBe(true);
    });

    it('should return false when neither Chrome nor Playwright is available', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockHomedir.mockReturnValue('/Users/test');
      mockExistsSync.mockReturnValue(false);

      const { hasBrowserAvailable } = await import('../../../src/browser/detection.js');
      expect(hasBrowserAvailable()).toBe(false);
    });
  });
});
