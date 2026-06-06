import { describe, expect, it } from 'vitest';
import { serializeError } from '../../../src/utils/error.js';

describe('serializeError', () => {
  it('returns string as-is', () => {
    expect(serializeError('something went wrong')).toBe('something went wrong');
  });

  it('stringifies an Error object as empty object (non-enumerable props)', () => {
    const result = serializeError(new Error('boom'));
    expect(result).toBe('{}');
  });

  it('stringifies a plain object', () => {
    const result = serializeError({ code: 500, detail: 'fail' });
    expect(result).toBe('{"code":500,"detail":"fail"}');
  });

  it('handles null', () => {
    const result = serializeError(null);
    expect(result).toBe('null');
  });

  it('returns Unknown error for undefined (JSON.stringify returns undefined)', () => {
    const result = serializeError(undefined);
    expect(result).toBe('Unknown error');
  });

  it('handles numbers', () => {
    expect(serializeError(42)).toBe('42');
  });

  it('throws on circular references (not caught)', () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    expect(() => serializeError(circular)).toThrow();
  });
});
