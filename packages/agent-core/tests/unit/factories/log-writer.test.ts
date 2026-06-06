import { describe, expect, it, vi } from 'vitest';

const mockFileWriter = { write: vi.fn() };
const mockCollector = {
  initialize: vi.fn(),
  log: vi.fn(),
  logMcp: vi.fn(),
  logBrowser: vi.fn(),
  logOpenCode: vi.fn(),
  logEnv: vi.fn(),
  logIpc: vi.fn(),
  flush: vi.fn(),
  getCurrentLogPath: vi.fn().mockReturnValue('/tmp/test.log'),
  getLogDir: vi.fn().mockReturnValue('/tmp/logs'),
  shutdown: vi.fn(),
};

function LogFileWriterMock() {
  return mockFileWriter;
}
function LogCollectorMock() {
  return mockCollector;
}

vi.mock('../../../src/internal/classes/LogFileWriter.js', () => ({
  LogFileWriter: LogFileWriterMock,
}));

vi.mock('../../../src/internal/classes/LogCollector.js', () => ({
  LogCollector: LogCollectorMock,
}));

import { createLogWriter } from '../../../src/factories/log-writer.js';

describe('createLogWriter', () => {
  const options = { logDir: '/tmp/logs' };

  it('should return object with all expected methods', () => {
    const writer = createLogWriter(options);
    expect(typeof writer.initialize).toBe('function');
    expect(typeof writer.write).toBe('function');
    expect(typeof writer.log).toBe('function');
    expect(typeof writer.logMcp).toBe('function');
    expect(typeof writer.logBrowser).toBe('function');
    expect(typeof writer.logOpenCode).toBe('function');
    expect(typeof writer.logEnv).toBe('function');
    expect(typeof writer.logIpc).toBe('function');
    expect(typeof writer.flush).toBe('function');
    expect(typeof writer.getCurrentLogPath).toBe('function');
    expect(typeof writer.getLogDir).toBe('function');
    expect(typeof writer.shutdown).toBe('function');
  });

  it('should delegate initialize to collector', () => {
    const writer = createLogWriter(options);
    writer.initialize();
    expect(mockCollector.initialize).toHaveBeenCalledOnce();
  });

  it('should delegate write to fileWriter', () => {
    const writer = createLogWriter(options);
    writer.write('info', 'system', 'test');
    expect(mockFileWriter.write).toHaveBeenCalledWith('info', 'system', 'test');
  });

  it('should delegate log to collector', () => {
    const writer = createLogWriter(options);
    writer.log('info', 'system', 'test', { key: 'val' });
    expect(mockCollector.log).toHaveBeenCalledWith('info', 'system', 'test', { key: 'val' });
  });

  it('should delegate logMcp to collector', () => {
    const writer = createLogWriter(options);
    writer.logMcp('info', 'msg');
    expect(mockCollector.logMcp).toHaveBeenCalledWith('info', 'msg', undefined);
  });

  it('should delegate logBrowser to collector', () => {
    const writer = createLogWriter(options);
    writer.logBrowser('warn', 'browser msg');
    expect(mockCollector.logBrowser).toHaveBeenCalledWith('warn', 'browser msg', undefined);
  });

  it('should delegate logOpenCode to collector', () => {
    const writer = createLogWriter(options);
    writer.logOpenCode('error', 'oc msg');
    expect(mockCollector.logOpenCode).toHaveBeenCalledWith('error', 'oc msg', undefined);
  });

  it('should delegate logEnv to collector', () => {
    const writer = createLogWriter(options);
    writer.logEnv('info', 'env msg');
    expect(mockCollector.logEnv).toHaveBeenCalledWith('info', 'env msg', undefined);
  });

  it('should delegate logIpc to collector', () => {
    const writer = createLogWriter(options);
    writer.logIpc('info', 'ipc msg');
    expect(mockCollector.logIpc).toHaveBeenCalledWith('info', 'ipc msg', undefined);
  });

  it('should delegate flush to collector', () => {
    const writer = createLogWriter(options);
    writer.flush();
    expect(mockCollector.flush).toHaveBeenCalledOnce();
  });

  it('should delegate getCurrentLogPath to collector', () => {
    const writer = createLogWriter(options);
    const result = writer.getCurrentLogPath();
    expect(result).toBe('/tmp/test.log');
    expect(mockCollector.getCurrentLogPath).toHaveBeenCalledOnce();
  });

  it('should delegate getLogDir to collector', () => {
    const writer = createLogWriter(options);
    const result = writer.getLogDir();
    expect(result).toBe('/tmp/logs');
    expect(mockCollector.getLogDir).toHaveBeenCalledOnce();
  });

  it('should delegate shutdown to collector', () => {
    const writer = createLogWriter(options);
    writer.shutdown();
    expect(mockCollector.shutdown).toHaveBeenCalledOnce();
  });
});
