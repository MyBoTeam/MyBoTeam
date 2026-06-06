import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogFileWriter = vi.hoisted(() => ({
  initialize: vi.fn(),
  shutdown: vi.fn(),
  log: vi.fn(),
}));

const mockGetLogFileWriter = vi.hoisted(() => vi.fn(() => mockLogFileWriter));
const mockShutdownLogFileWriter = vi.hoisted(() => vi.fn());

vi.mock('@main/logging/log-file-writer', () => ({
  getLogFileWriter: mockGetLogFileWriter,
  shutdownLogFileWriter: mockShutdownLogFileWriter,
}));

import {
  getLogCollector,
  initializeLogCollector,
  shutdownLogCollector,
} from '@main/logging/log-collector';

describe('log-collector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLogCollector', () => {
    it('should return the log file writer instance', () => {
      const collector = getLogCollector();
      expect(mockGetLogFileWriter).toHaveBeenCalled();
      expect(collector).toBe(mockLogFileWriter);
    });
  });

  describe('initializeLogCollector', () => {
    it('should call initialize on the collector', () => {
      initializeLogCollector();
      expect(mockLogFileWriter.initialize).toHaveBeenCalledOnce();
    });
  });

  describe('shutdownLogCollector', () => {
    it('should shutdown the collector and the file writer', () => {
      getLogCollector();
      shutdownLogCollector();
      expect(mockLogFileWriter.shutdown).toHaveBeenCalledOnce();
      expect(mockShutdownLogFileWriter).toHaveBeenCalledOnce();
    });

    it('should handle shutdown when no instance was created', () => {
      shutdownLogCollector();
      expect(mockShutdownLogFileWriter).toHaveBeenCalledOnce();
    });
  });
});
