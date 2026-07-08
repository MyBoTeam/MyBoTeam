import { describe, expect, it, vi } from 'vitest';
import { RetryHandler } from '../../src/providers/tools/retry-handler';

describe('RetryHandler', () => {
  describe('execute', () => {
    it('should return result on first success', async () => {
      const handler = new RetryHandler({ maxAttempts: 3, delay: 10 });
      const fn = vi.fn().mockResolvedValue('success');

      const result = await handler.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const handler = new RetryHandler({ maxAttempts: 3, delay: 10 });
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValue('success');

      const result = await handler.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts', async () => {
      const handler = new RetryHandler({ maxAttempts: 2, delay: 10 });
      const fn = vi.fn().mockRejectedValue(new Error('Permanent error'));

      await expect(handler.execute(fn)).rejects.toThrow('Permanent error');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const handler = new RetryHandler({ maxAttempts: 3, delay: 10 });
      const fn = vi.fn().mockRejectedValue(new Error('Auth error'));
      const isRetryable = (error: Error) => !error.message.includes('Auth');

      await expect(handler.execute(fn, isRetryable)).rejects.toThrow('Auth error');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const handler = new RetryHandler({ maxAttempts: 3, delay: 100, backoff: 'exponential' });
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      const start = Date.now();
      const result = await handler.execute(fn);
      const elapsed = Date.now() - start;

      expect(result).toBe('success');
      expect(elapsed).toBeGreaterThanOrEqual(300); // 100 + 200
    });

    it('should use linear backoff', async () => {
      const handler = new RetryHandler({ maxAttempts: 4, delay: 100, backoff: 'linear' });
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'))
        .mockResolvedValue('success');

      const start = Date.now();
      const result = await handler.execute(fn);
      const elapsed = Date.now() - start;

      expect(result).toBe('success');
      expect(elapsed).toBeGreaterThanOrEqual(600); // 100 + 200 + 300
      expect(elapsed).toBeLessThan(650); // exponential would be 100+200+400=700
    });
  });
});
