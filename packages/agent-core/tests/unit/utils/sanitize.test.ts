import { describe, expect, it } from 'vitest';
import { sanitizeOptionalString, sanitizeString } from '../../../src/utils/sanitize.js';

describe('sanitizeString', () => {
  it('trims and returns a valid string', () => {
    expect(sanitizeString('  hello  ', 'name')).toBe('hello');
  });

  it('throws for non-string input', () => {
    expect(() => sanitizeString(123, 'age')).toThrow('age must be a string');
  });

  it('throws for null', () => {
    expect(() => sanitizeString(null, 'field')).toThrow('field must be a string');
  });

  it('throws for empty string after trim', () => {
    expect(() => sanitizeString('   ', 'name')).toThrow('name is required');
  });

  it('throws for empty string', () => {
    expect(() => sanitizeString('', 'name')).toThrow('name is required');
  });

  it('throws when string exceeds max length', () => {
    const longStr = 'a'.repeat(1001);
    expect(() => sanitizeString(longStr, 'field', 1000)).toThrow(
      'field exceeds maximum length of 1000',
    );
  });

  it('uses default max length of 60000', () => {
    const justRight = 'a'.repeat(60000);
    expect(sanitizeString(justRight, 'field')).toBe(justRight);
  });

  it('accepts object toString values as non-string', () => {
    expect(() => sanitizeString({}, 'obj')).toThrow('obj must be a string');
  });
});

describe('sanitizeOptionalString', () => {
  it('returns string for valid input', () => {
    expect(sanitizeOptionalString('  hello  ', 'name')).toBe('hello');
  });

  it('returns undefined for null', () => {
    expect(sanitizeOptionalString(null, 'name')).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(sanitizeOptionalString(undefined, 'name')).toBeUndefined();
  });

  it('throws for non-string, non-null input', () => {
    expect(() => sanitizeOptionalString(42, 'age')).toThrow('age must be a string');
  });

  it('throws for empty string', () => {
    expect(() => sanitizeOptionalString('', 'name')).toThrow('name is required');
  });

  it('throws when exceeding max length', () => {
    const longStr = 'a'.repeat(500);
    expect(() => sanitizeOptionalString(longStr, 'field', 100)).toThrow(
      'field exceeds maximum length of 100',
    );
  });
});
