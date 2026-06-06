import { AuthLoginError } from '@main/opencode/auth-login-error';
import { describe, expect, it } from 'vitest';

describe('AuthLoginError', () => {
  it('should be an instance of Error and AuthLoginError', () => {
    const error = new AuthLoginError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AuthLoginError);
  });

  it('should set the name to AuthLoginError', () => {
    const error = new AuthLoginError('Test error');
    expect(error.name).toBe('AuthLoginError');
  });

  it('should set the message correctly', () => {
    const error = new AuthLoginError('Login failed');
    expect(error.message).toBe('Login failed');
  });

  it('should support ErrorOptions (cause)', () => {
    const cause = new Error('Underlying cause');
    const error = new AuthLoginError('Wrapped error', { cause });
    expect(error.cause).toBe(cause);
  });
});
