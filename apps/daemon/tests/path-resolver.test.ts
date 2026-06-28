import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PathResolver } from '../src/path-resolver';

describe('PathResolver', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getDataDir', () => {
    it('should return default data directory when MYBOTEAM_DATA_DIR is not set', () => {
      delete process.env.MYBOTEAM_DATA_DIR;
      const resolver = new PathResolver();
      const dataDir = resolver.getDataDir();
      expect(dataDir).toContain('.myboteam');
    });

    it('should return custom data directory when MYBOTEAM_DATA_DIR is set', () => {
      process.env.MYBOTEAM_DATA_DIR = '/custom/path';
      const resolver = new PathResolver();
      const dataDir = resolver.getDataDir();
      expect(dataDir).toBe('/custom/path');
    });

    it('should resolve relative path against current working directory', () => {
      process.env.MYBOTEAM_DATA_DIR = 'relative/path';
      const resolver = new PathResolver();
      const dataDir = resolver.getDataDir();
      expect(dataDir).toContain('relative/path');
    });
  });

  describe('getSocketPath', () => {
    it('should return Unix socket path on non-Windows platforms', () => {
      const resolver = new PathResolver();
      const socketPath = resolver.getSocketPath();
      expect(socketPath).toContain('myboteam.sock');
    });

    it('should return named pipe path on Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const resolver = new PathResolver();
      const socketPath = resolver.getSocketPath();
      expect(socketPath).toContain('\\\\.\\pipe\\myboteam-');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('getSkillsDir', () => {
    it('should return skills directory path', () => {
      const resolver = new PathResolver();
      const skillsDir = resolver.getSkillsDir();
      expect(skillsDir).toContain('skills');
    });
  });

  describe('getPidFilePath', () => {
    it('should return PID file path', () => {
      const resolver = new PathResolver();
      const pidFilePath = resolver.getPidFilePath();
      expect(pidFilePath).toContain('daemon.pid');
    });
  });
});
