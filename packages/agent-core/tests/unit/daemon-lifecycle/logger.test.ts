import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger, LogLevel } from '../../../src/daemon/lifecycle/logger';

describe('Logger', () => {
  let logger: Logger;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new Logger('TestContext');
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  describe('debug()', () => {
    it('should log debug message', () => {
      logger.debug('Test message');

      expect(stdoutSpy).toHaveBeenCalled();
      const call = stdoutSpy.mock.calls[0][0] as string;
      const entry = JSON.parse(call);

      expect(entry.level).toBe(LogLevel.DEBUG);
      expect(entry.message).toBe('Test message');
      expect(entry.context).toBe('TestContext');
    });
  });

  describe('info()', () => {
    it('should log info message', () => {
      logger.info('Test message');

      expect(stdoutSpy).toHaveBeenCalled();
      const call = stdoutSpy.mock.calls[0][0] as string;
      const entry = JSON.parse(call);

      expect(entry.level).toBe(LogLevel.INFO);
      expect(entry.message).toBe('Test message');
    });
  });

  describe('warn()', () => {
    it('should log warn message', () => {
      logger.warn('Test message');

      expect(stdoutSpy).toHaveBeenCalled();
      const call = stdoutSpy.mock.calls[0][0] as string;
      const entry = JSON.parse(call);

      expect(entry.level).toBe(LogLevel.WARN);
      expect(entry.message).toBe('Test message');
    });
  });

  describe('error()', () => {
    it('should log error message', () => {
      logger.error('Test message');

      expect(stdoutSpy).toHaveBeenCalled();
      const call = stdoutSpy.mock.calls[0][0] as string;
      const entry = JSON.parse(call);

      expect(entry.level).toBe(LogLevel.ERROR);
      expect(entry.message).toBe('Test message');
    });
  });

  describe('metadata', () => {
    it('should include metadata in log entry', () => {
      logger.info('Test message', { key: 'value' });

      const call = stdoutSpy.mock.calls[0][0] as string;
      const entry = JSON.parse(call);

      expect(entry.metadata).toEqual({ key: 'value' });
    });
  });

  describe('correlationId', () => {
    it('should generate correlation ID', () => {
      const correlationId = logger.getCorrelationId();
      expect(correlationId).toBeTypeOf('string');
      expect(correlationId.length).toBeGreaterThan(0);
    });

    it('should use provided correlation ID', () => {
      const customLogger = new Logger('Test', 'custom-id');
      expect(customLogger.getCorrelationId()).toBe('custom-id');
    });
  });

  describe('child()', () => {
    it('should create child logger with same correlation ID', () => {
      const childLogger = logger.child('ChildContext');

      expect(childLogger.getCorrelationId()).toBe(logger.getCorrelationId());
    });
  });

  describe('timestamp', () => {
    it('should include ISO timestamp', () => {
      logger.info('Test message');

      const call = stdoutSpy.mock.calls[0][0] as string;
      const entry = JSON.parse(call);

      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
