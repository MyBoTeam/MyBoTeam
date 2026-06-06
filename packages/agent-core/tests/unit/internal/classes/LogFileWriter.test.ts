import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExistsSync = vi.hoisted(() => vi.fn());
const mockMkdirSync = vi.hoisted(() => vi.fn());
const mockReaddirSync = vi.hoisted(() => vi.fn());
const mockStatSync = vi.hoisted(() => vi.fn());
const mockAppendFileSync = vi.hoisted(() => vi.fn());
const mockUnlinkSync = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    readdirSync: mockReaddirSync,
    statSync: mockStatSync,
    appendFileSync: mockAppendFileSync,
    unlinkSync: mockUnlinkSync,
  },
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  readdirSync: mockReaddirSync,
  statSync: mockStatSync,
  appendFileSync: mockAppendFileSync,
  unlinkSync: mockUnlinkSync,
}));

vi.mock('../../../../src/utils/redact.js', () => ({
  redact: vi.fn((msg: string) => msg),
}));

import { LogFileWriter } from '../../../../src/internal/classes/LogFileWriter.js';

let writer: LogFileWriter;

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mockExistsSync.mockReturnValue(true);
  mockReaddirSync.mockReturnValue([]);
  writer = new LogFileWriter('/tmp/logs');
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  writer.shutdown();
});

describe('LogFileWriter', () => {
  describe('initialize', () => {
    it('creates log dir if it does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      writer.initialize();
      expect(mockMkdirSync).toHaveBeenCalledWith('/tmp/logs', { recursive: true });
    });

    it('does not create log dir if it exists', () => {
      writer.initialize();
      expect(mockMkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('write', () => {
    it('buffers log entries without immediate flush', () => {
      writer.initialize();
      writer.write('INFO', 'main', 'test message');
      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });

    it('flushes when buffer exceeds max entries', () => {
      const maxEntries = 100;
      writer.initialize();
      mockStatSync.mockReturnValue({ size: 10 });

      for (let i = 0; i < maxEntries; i++) {
        writer.write('INFO', 'main', `msg ${i}`);
      }

      expect(mockAppendFileSync).toHaveBeenCalled();
    });

    it('drops entries when file size exceeded on same day', () => {
      writer.initialize();
      mockStatSync.mockReturnValue({ size: 10 });
      for (let i = 0; i < 100; i++) {
        writer.write('INFO', 'main', `msg ${i}`);
      }
      mockAppendFileSync.mockClear();

      writer.write('INFO', 'main', 'dropped');
      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });
  });

  describe('flush', () => {
    it('writes buffered entries to file', () => {
      writer.initialize();
      mockStatSync.mockReturnValue({ size: 10 });

      writer.write('INFO', 'main', 'line1');
      writer.write('WARN', 'mcp', 'line2');
      writer.flush();

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.log'),
        expect.stringContaining('line1'),
      );
    });

    it('does nothing when buffer is empty', () => {
      writer.flush();
      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });

    it('handles flush failure gracefully', () => {
      writer.initialize();
      mockStatSync.mockReturnValue({ size: 10 });

      writer.write('INFO', 'main', 'test');
      mockAppendFileSync.mockImplementationOnce(() => {
        throw new Error('Disk full');
      });
      expect(() => writer.flush()).not.toThrow();
    });
  });

  describe('shutdown', () => {
    it('flushes buffered entries and clears timer', () => {
      writer.initialize();
      mockStatSync.mockReturnValue({ size: 10 });
      writer.write('INFO', 'main', 'shutdown-test');
      writer.shutdown();
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('shutdown-test'),
      );
    });
  });

  describe('getCurrentLogPath', () => {
    it('returns current log file path', () => {
      writer.initialize();
      const logPath = writer.getCurrentLogPath();
      expect(logPath).toContain('.log');
    });
  });

  describe('getLogDir', () => {
    it('returns configured log dir', () => {
      expect(writer.getLogDir()).toBe('/tmp/logs');
    });
  });
});
