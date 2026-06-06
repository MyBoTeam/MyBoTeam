import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
    resolve: (...args: string[]) => args.join('/'),
  },
  join: (...args: string[]) => args.join('/'),
  resolve: (...args: string[]) => args.join('/'),
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      if (name === 'userData') return '/mock/userData';
      return '/mock/default';
    }),
  },
}));

const mockCreateLogWriter = vi.hoisted(() =>
  vi.fn(() => ({
    initialize: vi.fn(),
    shutdown: vi.fn(),
    log: vi.fn(),
  })),
);

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  createLogWriter: mockCreateLogWriter,
}));

import {
  getLogFileWriter,
  initializeLogFileWriter,
  shutdownLogFileWriter,
} from '@main/logging/log-file-writer';

describe('log-file-writer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLogFileWriter', () => {
    it('should create and cache the LogWriter with the userData/logs path', () => {
      const first = getLogFileWriter();
      expect(mockCreateLogWriter).toHaveBeenCalledOnce();
      expect(mockCreateLogWriter).toHaveBeenCalledWith({ logDir: '/mock/userData/logs' });
      expect(first).toBeDefined();

      const second = getLogFileWriter();
      expect(mockCreateLogWriter).toHaveBeenCalledTimes(1);
      expect(first).toBe(second);
    });
  });

  describe('initializeLogFileWriter', () => {
    it('should call initialize on the writer', () => {
      const writer = getLogFileWriter();
      initializeLogFileWriter();
      expect(writer.initialize).toHaveBeenCalledOnce();
    });
  });

  describe('shutdownLogFileWriter', () => {
    it('should shutdown and nullify the instance', () => {
      const writer = getLogFileWriter();
      shutdownLogFileWriter();
      expect(writer.shutdown).toHaveBeenCalledOnce();
    });

    it('should handle shutdown when no instance exists', () => {
      shutdownLogFileWriter();
      expect(() => shutdownLogFileWriter()).not.toThrow();
    });
  });
});
