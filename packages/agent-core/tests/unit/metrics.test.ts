import { describe, expect, it, vi } from 'vitest';
import { MetricsEmitter } from '../../src/providers/tools/metrics';

describe('MetricsEmitter', () => {
  describe('emit', () => {
    it('should call callback with metrics', () => {
      const callback = vi.fn();
      const emitter = new MetricsEmitter(callback);

      emitter.emit({
        requestDuration: 100,
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });

      expect(callback).toHaveBeenCalledWith({
        requestDuration: 100,
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('should handle missing callback gracefully', () => {
      const emitter = new MetricsEmitter();

      expect(() => {
        emitter.emit({
          requestDuration: 100,
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        });
      }).not.toThrow();
    });

    it('should emit error category when provided', () => {
      const callback = vi.fn();
      const emitter = new MetricsEmitter(callback);

      emitter.emit({
        requestDuration: 100,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        errorCategory: 'rate_limit',
      });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ errorCategory: 'rate_limit' }),
      );
    });

    it('should emit timeToFirstChunk when provided', () => {
      const callback = vi.fn();
      const emitter = new MetricsEmitter(callback);

      emitter.emit({
        requestDuration: 50,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        timeToFirstChunk: 50,
      });

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ timeToFirstChunk: 50 }));
    });
  });
});
