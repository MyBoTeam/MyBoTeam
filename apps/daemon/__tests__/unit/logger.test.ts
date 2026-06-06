import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { log } from '../../src/logger.js';

describe('daemon logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('info writes ISO-timestamped message to console.log', () => {
    log.info('hello');
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.* \[INFO\] hello$/),
    );
  });

  it('warn writes ISO-timestamped message to console.warn', () => {
    log.warn('beware');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.* \[WARN\] beware$/),
    );
  });

  it('error writes ISO-timestamped message to console.error', () => {
    log.error('boom');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.* \[ERROR\] boom$/),
    );
  });

  it('info forwards extra args to console.log', () => {
    log.info('count', 42, { key: 'val' });
    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\] count/), 42, {
      key: 'val',
    });
  });

  it('warn forwards extra args to console.warn', () => {
    log.warn('rate', 0.9);
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/\[WARN\] rate/), 0.9);
  });

  it('error forwards extra args with an Error object', () => {
    const err = new Error('fail');
    log.error('task failed', err);
    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/\[ERROR\] task failed/), err);
  });
});
