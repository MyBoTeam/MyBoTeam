import { describe, expect, it, vi } from 'vitest';
import { createLogger, logger } from '@/lib/logger';

describe('logger', () => {
  it('exports a default app logger', () => {
    expect(logger).toBeDefined();
    expect(logger.debug).toBeInstanceOf(Function);
    expect(logger.info).toBeInstanceOf(Function);
    expect(logger.warn).toBeInstanceOf(Function);
    expect(logger.error).toBeInstanceOf(Function);
  });

  it('createLogger returns an object with all log methods', () => {
    const log = createLogger('Test');
    expect(log.debug).toBeInstanceOf(Function);
    expect(log.info).toBeInstanceOf(Function);
    expect(log.warn).toBeInstanceOf(Function);
    expect(log.error).toBeInstanceOf(Function);
  });

  it('createLogger methods can be called without error', () => {
    const log = createLogger('Safe');
    expect(() => log.debug('msg')).not.toThrow();
    expect(() => log.info('msg')).not.toThrow();
    expect(() => log.warn('msg')).not.toThrow();
    expect(() => log.error('msg')).not.toThrow();
  });

  it('createLogger methods accept extra args without error', () => {
    const log = createLogger('Args');
    expect(() => log.debug('msg', { a: 1 })).not.toThrow();
    expect(() => log.info('msg', 1, 2, 3)).not.toThrow();
    expect(() => log.warn('msg', new Error('test'))).not.toThrow();
    expect(() => log.error('msg', null, undefined)).not.toThrow();
  });

  it('multiple loggers can coexist', () => {
    const a = createLogger('A');
    const b = createLogger('B');
    expect(a).not.toBe(b);
  });

  it('createLogger can be called with empty string prefix', () => {
    const log = createLogger('');
    expect(() => log.info('test')).not.toThrow();
  });

  it('createLogger can be called with special characters in prefix', () => {
    const log = createLogger('My-App_v2');
    expect(() => log.warn('edge case')).not.toThrow();
  });
});
