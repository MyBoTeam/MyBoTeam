import { describe, expect, it } from 'vitest';
import { safeParseJson, safeParseJsonWithFallback } from '../../../src/utils/json.js';

describe('safeParseJson', () => {
  it('parses valid JSON', () => {
    const result = safeParseJson<{ name: string }>('{"name":"test"}');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'test' });
    }
  });

  it('parses JSON array', () => {
    const result = safeParseJson<number[]>('[1, 2, 3]');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([1, 2, 3]);
    }
  });

  it('returns error for null input', () => {
    const result = safeParseJson(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Input is null or empty');
    }
  });

  it('returns error for empty string', () => {
    const result = safeParseJson('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Input is null or empty');
    }
  });

  it('returns error for malformed JSON', () => {
    const result = safeParseJson('{bad json}');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('returns error for non-JSON string', () => {
    const result = safeParseJson('hello world');
    expect(result.success).toBe(false);
  });
});

describe('safeParseJsonWithFallback', () => {
  it('returns parsed data on success', () => {
    const result = safeParseJsonWithFallback<{ key: string }>('{"key":"val"}');
    expect(result).toEqual({ key: 'val' });
  });

  it('returns fallback on null input', () => {
    const result = safeParseJsonWithFallback<number>(null, 42);
    expect(result).toBe(42);
  });

  it('returns null fallback by default on parse failure', () => {
    const result = safeParseJsonWithFallback('invalid');
    expect(result).toBeNull();
  });

  it('returns custom fallback on parse failure', () => {
    const result = safeParseJsonWithFallback('invalid', { a: 1 });
    expect(result).toEqual({ a: 1 });
  });

  it('returns custom fallback on empty string', () => {
    const result = safeParseJsonWithFallback('', 'default');
    expect(result).toBe('default');
  });
});
