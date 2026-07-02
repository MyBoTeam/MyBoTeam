import { describe, expect, it } from 'vitest';
import { ProviderErrorSchema } from '../../src/errors.js';

describe('ProviderErrorSchema', () => {
  it('accepts auth error', () => {
    const result = ProviderErrorSchema.safeParse({
      category: 'auth',
      code: 'INVALID_KEY',
      message: 'Invalid API key',
      retryable: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts rate limit error', () => {
    const result = ProviderErrorSchema.safeParse({
      category: 'rate_limit',
      code: 'RATE_EXCEEDED',
      message: 'Rate limit exceeded',
      statusCode: 429,
      retryable: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts network error', () => {
    const result = ProviderErrorSchema.safeParse({
      category: 'network',
      code: 'TIMEOUT',
      message: 'Request timed out',
      retryable: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts provider error', () => {
    const result = ProviderErrorSchema.safeParse({
      category: 'provider',
      code: 'MODEL_OVERLOADED',
      message: 'Model is overloaded',
      providerMessage: 'Please try again later',
      retryable: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid category', () => {
    const result = ProviderErrorSchema.safeParse({
      category: 'invalid',
      code: 'ERR',
      message: 'Error',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty code', () => {
    const result = ProviderErrorSchema.safeParse({
      category: 'auth',
      code: '',
      message: 'Error',
    });
    expect(result.success).toBe(false);
  });
});
