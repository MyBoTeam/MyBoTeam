import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockWriter = vi.hoisted(() => ({
  initialize: vi.fn(),
  write: vi.fn(),
  flush: vi.fn(),
  getCurrentLogPath: vi.fn(() => '/logs/app.log'),
  getLogDir: vi.fn(() => '/logs'),
  shutdown: vi.fn(),
}));

vi.mock('../../../../src/common/utils/log-source-detector.js', () => ({
  detectLogSource: vi.fn(() => 'main'),
}));

import { LogCollector } from '../../../../src/internal/classes/LogCollector.js';

let collector: LogCollector;

beforeEach(() => {
  vi.clearAllMocks();
  collector = new LogCollector(mockWriter);
});

afterEach(() => {
  if (collector.initialized) {
    collector.shutdown();
  }
  vi.restoreAllMocks();
});

describe('LogCollector', () => {
  describe('initialize', () => {
    it('initializes the writer and overrides console methods', () => {
      collector.initialize();

      expect(mockWriter.initialize).toHaveBeenCalled();
      expect(mockWriter.write).toHaveBeenCalledWith('INFO', 'main', 'LogCollector initialized');
      expect(collector.initialized).toBe(true);
    });

    it('is idempotent on second call', () => {
      collector.initialize();
      mockWriter.write.mockClear();

      collector.initialize();

      expect(mockWriter.write).not.toHaveBeenCalledWith('INFO', 'main', 'LogCollector initialized');
    });
  });

  describe('shutdown', () => {
    it('restores console and shuts down writer', () => {
      const originalConsoleLog = console.log;
      collector.initialize();
      expect(console.log).not.toBe(originalConsoleLog);

      collector.shutdown();

      expect(mockWriter.shutdown).toHaveBeenCalled();
      expect(console.log).toBe(originalConsoleLog);
      expect(collector.initialized).toBe(false);
    });

    it('is a no-op when not initialized', () => {
      collector.shutdown();
      expect(mockWriter.shutdown).not.toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it('writes a simple message', () => {
      collector.log('INFO', 'main', 'Hello world');
      expect(mockWriter.write).toHaveBeenCalledWith('INFO', 'main', 'Hello world');
    });

    it('appends serialized data to the message', () => {
      collector.log('ERROR', 'mcp', 'Request failed', { status: 500, url: '/api/test' });
      expect(mockWriter.write).toHaveBeenCalledWith(
        'ERROR',
        'mcp',
        'Request failed {"status":500,"url":"/api/test"}',
      );
    });

    it('handles unserializable data gracefully', () => {
      const circular: Record<string, unknown> = { ref: null };
      circular.ref = circular;
      collector.log('WARN', 'env', 'Circular', circular);
      expect(mockWriter.write).toHaveBeenCalledWith(
        'WARN',
        'env',
        'Circular [unserializable data]',
      );
    });
  });

  describe('logMcp', () => {
    it('delegates to log with mcp source', () => {
      collector.logMcp('INFO', 'MCP started', { port: 3000 });
      expect(mockWriter.write).toHaveBeenCalledWith('INFO', 'mcp', 'MCP started {"port":3000}');
    });
  });

  describe('logBrowser', () => {
    it('delegates to log with browser source', () => {
      collector.logBrowser('INFO', 'Browser launched');
      expect(mockWriter.write).toHaveBeenCalledWith('INFO', 'browser', 'Browser launched');
    });
  });

  describe('logOpenCode', () => {
    it('delegates to log with opencode source', () => {
      collector.logOpenCode('INFO', 'CLI started');
      expect(mockWriter.write).toHaveBeenCalledWith('INFO', 'opencode', 'CLI started');
    });
  });

  describe('logEnv', () => {
    it('delegates to log with env source', () => {
      collector.logEnv('INFO', 'Environment ready');
      expect(mockWriter.write).toHaveBeenCalledWith('INFO', 'env', 'Environment ready');
    });
  });

  describe('logIpc', () => {
    it('delegates to log with ipc source', () => {
      collector.logIpc('INFO', 'IPC message received');
      expect(mockWriter.write).toHaveBeenCalledWith('INFO', 'ipc', 'IPC message received');
    });
  });

  describe('flush', () => {
    it('delegates to writer flush', () => {
      collector.flush();
      expect(mockWriter.flush).toHaveBeenCalled();
    });
  });

  describe('getCurrentLogPath', () => {
    it('delegates to writer', () => {
      expect(collector.getCurrentLogPath()).toBe('/logs/app.log');
    });
  });

  describe('getLogDir', () => {
    it('delegates to writer', () => {
      expect(collector.getLogDir()).toBe('/logs');
    });
  });

  describe('console interception', () => {
    it('captures console.log calls', () => {
      collector.initialize();
      mockWriter.write.mockClear();

      console.log('test message');

      expect(mockWriter.write).toHaveBeenCalledWith('INFO', 'main', 'test message');
    });

    it('captures console.warn calls', () => {
      collector.initialize();
      mockWriter.write.mockClear();

      console.warn('warning');

      expect(mockWriter.write).toHaveBeenCalledWith('WARN', 'main', 'warning');
    });

    it('captures console.error calls', () => {
      collector.initialize();
      mockWriter.write.mockClear();

      console.error('error occurred');

      expect(mockWriter.write).toHaveBeenCalledWith('ERROR', 'main', 'error occurred');
    });

    it('captures console.debug calls', () => {
      collector.initialize();
      mockWriter.write.mockClear();

      console.debug('debug info');

      expect(mockWriter.write).toHaveBeenCalledWith('DEBUG', 'main', 'debug info');
    });

    it('handles multiple arguments in console calls', () => {
      collector.initialize();
      mockWriter.write.mockClear();

      console.log('count:', 42, { key: 'value' });

      expect(mockWriter.write).toHaveBeenCalledWith('INFO', 'main', 'count: 42 {"key":"value"}');
    });
  });
});
