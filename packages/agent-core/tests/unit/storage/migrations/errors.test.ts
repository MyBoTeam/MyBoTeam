import { describe, expect, it } from 'vitest';
import {
  CorruptDatabaseError,
  FutureSchemaError,
} from '../../../../src/storage/migrations/errors.js';

describe('FutureSchemaError', () => {
  it('should set the correct error name', () => {
    const err = new FutureSchemaError(42, 1);
    expect(err.name).toBe('FutureSchemaError');
  });

  it('should store storedVersion and appVersion', () => {
    const err = new FutureSchemaError(42, 1);
    expect(err.storedVersion).toBe(42);
    expect(err.appVersion).toBe(1);
  });

  it('should produce descriptive message', () => {
    const err = new FutureSchemaError(42, 1);
    expect(err.message).toContain('42');
    expect(err.message).toContain('1');
    expect(err.message).toContain('newer');
    expect(err.message).toContain('update the application');
  });
});

describe('CorruptDatabaseError', () => {
  it('should set the correct error name', () => {
    const err = new CorruptDatabaseError('database file is corrupt');
    expect(err.name).toBe('CorruptDatabaseError');
  });

  it('should store the message', () => {
    const err = new CorruptDatabaseError('corruption detected');
    expect(err.message).toBe('corruption detected');
  });

  it('should be an instance of Error', () => {
    const err = new CorruptDatabaseError('test');
    expect(err).toBeInstanceOf(Error);
  });
});
