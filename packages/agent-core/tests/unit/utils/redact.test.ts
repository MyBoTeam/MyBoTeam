import { describe, expect, it } from 'vitest';
import { redact } from '../../../src/utils/redact.js';

describe('redact', () => {
  it('redacts OpenAI-style API keys', () => {
    const result = redact('sk-abc123xyz456def789ghi012jkl345');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('sk-abc123xyz456def789ghi012jkl345');
  });

  it('redacts xAI-style API keys', () => {
    const result = redact('xai-abc123xyz456def789ghi012jkl345');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts Google AI API keys', () => {
    const result = redact('AIzaSyDf8LpW2Qvx9C3b5MnOpqrStUvWxYz12345');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts AWS access keys', () => {
    const result = redact('AKIAIOSFODNN7EXAMPLE');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts Bearer tokens', () => {
    const result = redact('Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts inline api_key patterns', () => {
    const result = redact('api_key=sk-abcdefghijklmnopqrstuvwx');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts inline secret patterns', () => {
    const result = redact('secret=my-super-secret-key-12345');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts inline password patterns', () => {
    const result = redact('password: super-secret-password');
    expect(result).toContain('[REDACTED]');
  });

  it('preserves text with no sensitive data', () => {
    const result = redact('Hello, this is a normal message with no secrets.');
    expect(result).toBe('Hello, this is a normal message with no secrets.');
  });

  it('preserves empty string', () => {
    expect(redact('')).toBe('');
  });

  it('handles multiple redactions in a single string', () => {
    const input =
      'key1: sk-abcdefghijklmnopqrstuvwx, key2: AIzaSyDf8LpW2Qvx9C3b5MnOpqrStUvWxYz12345';
    const result = redact(input);
    expect(result).not.toContain('sk-abcdefghijklmnopqrstuvwx');
    expect(result).not.toContain('AIzaSyDf8LpW2Qvx9C3b5MnOpqrStUvWxYz12345');
  });

  it('keeps first 4 chars of matched pattern as prefix', () => {
    const result = redact('sk-abcdefghijklmnopqrstuvwx');
    expect(result).toBe('sk-a[REDACTED]');
  });
});
