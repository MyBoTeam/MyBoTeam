import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExistsSync = vi.fn();

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
  },
  existsSync: mockExistsSync,
}));

describe('browser/browser-spawn', () => {
  let originalPlatform: string;

  beforeEach(() => {
    vi.clearAllMocks();
    originalPlatform = process.platform;
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  describe('buildNodeEnvironment', () => {
    it('should return a copy of process.env when no bundledNodeBinPath', async () => {
      const { buildNodeEnvironment } = await import('../../../src/browser/browser-spawn.js');
      const result = buildNodeEnvironment();
      expect(result.PATH).toBe(process.env.PATH);
    });

    it('should prepend bundledNodeBinPath to PATH on non-Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const originalPath = process.env.PATH ?? '';
      const { buildNodeEnvironment } = await import('../../../src/browser/browser-spawn.js');
      const result = buildNodeEnvironment('/bundled/node/bin');
      expect(result.PATH).toBe(`/bundled/node/bin:${originalPath}`);
      expect(result.NODE_BIN_PATH).toBe('/bundled/node/bin');
    });

    it('should prepend bundledNodeBinPath to PATH on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const originalPath = process.env.PATH ?? '';
      const { buildNodeEnvironment } = await import('../../../src/browser/browser-spawn.js');
      const result = buildNodeEnvironment('C:\\bundled\\node\\bin');
      expect(result.PATH).toBe(`C:\\bundled\\node\\bin;${originalPath}`);
      expect(result.Path).toBe(`C:\\bundled\\node\\bin;${originalPath}`);
      expect(result.NODE_BIN_PATH).toBe('C:\\bundled\\node\\bin');
    });

    it('should use only bundled path when PATH is empty', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const originalPath = process.env.PATH;
      process.env.PATH = '';
      const { buildNodeEnvironment } = await import('../../../src/browser/browser-spawn.js');
      const result = buildNodeEnvironment('/bundled/bin');
      expect(result.PATH).toBe('/bundled/bin');
      process.env.PATH = originalPath;
    });
  });

  describe('getNodeExecutable', () => {
    it('should throw if bundledNodeBinPath is not provided', async () => {
      const { getNodeExecutable } = await import('../../../src/browser/browser-spawn.js');
      expect(() => getNodeExecutable()).toThrow('Bundled Node.js path is missing');
    });

    it('should return node path on non-Windows when file exists', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockExistsSync.mockReturnValueOnce(true);
      const { getNodeExecutable } = await import('../../../src/browser/browser-spawn.js');
      const result = getNodeExecutable('/bundled/node/bin');
      expect(result).toBe('/bundled/node/bin/node');
    });

    it('should return node.exe on Windows when file exists', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      mockExistsSync.mockReturnValueOnce(true);
      const { getNodeExecutable } = await import('../../../src/browser/browser-spawn.js');
      const result = getNodeExecutable('C:\\bundled\\node\\bin');
      expect(result).toContain('node.exe');
    });

    it('should throw if node executable does not exist', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockExistsSync.mockReturnValueOnce(false);
      const { getNodeExecutable } = await import('../../../src/browser/browser-spawn.js');
      expect(() => getNodeExecutable('/bundled/node/bin')).toThrow('Missing bundled Node.js');
    });
  });

  describe('resolvePlaywrightCliPath', () => {
    it('should return the first valid candidate path', async () => {
      mockExistsSync.mockReturnValueOnce(true);
      const { resolvePlaywrightCliPath } = await import('../../../src/browser/browser-spawn.js');
      const result = resolvePlaywrightCliPath('/mcp-tools');
      expect(result).toBe('/mcp-tools/dev-browser/node_modules/playwright/cli.js');
    });

    it('should try the second candidate if first does not exist', async () => {
      mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
      const { resolvePlaywrightCliPath } = await import('../../../src/browser/browser-spawn.js');
      const result = resolvePlaywrightCliPath('/mcp-tools');
      expect(result).toBe('/mcp-tools/node_modules/playwright/cli.js');
    });

    it('should throw if no candidate exists', async () => {
      mockExistsSync.mockReturnValue(false);
      const { resolvePlaywrightCliPath } = await import('../../../src/browser/browser-spawn.js');
      expect(() => resolvePlaywrightCliPath('/mcp-tools')).toThrow('Playwright CLI not found');
    });
  });
});
