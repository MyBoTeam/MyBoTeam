import { describe, expect, it } from 'vitest';
import { normalizeBaseUrl, validateHttpUrl } from '../../../src/utils/url.js';

describe('validateHttpUrl', () => {
  it('accepts http URL', () => {
    const result = validateHttpUrl('http://example.com');
    expect(result.href).toBe('http://example.com/');
  });

  it('accepts https URL', () => {
    const result = validateHttpUrl('https://api.openai.com/v1');
    expect(result.href).toBe('https://api.openai.com/v1');
  });

  it('rejects ftp protocol', () => {
    expect(() => validateHttpUrl('ftp://files.example.com')).toThrow(
      'must use http or https protocol',
    );
  });

  it('rejects invalid URL strings', () => {
    expect(() => validateHttpUrl('not-a-url')).toThrow('is not a valid URL');
  });

  it('rejects empty string', () => {
    expect(() => validateHttpUrl('')).toThrow('is not a valid URL');
  });

  it('uses custom field name in error messages', () => {
    expect(() => validateHttpUrl('invalid', 'API Endpoint')).toThrow(
      'API Endpoint is not a valid URL',
    );
  });

  it('uses custom field name for protocol error', () => {
    expect(() => validateHttpUrl('ftp://x.com', 'MyURL')).toThrow(
      'MyURL must use http or https protocol',
    );
  });

  it('accepts URL with path and query', () => {
    const result = validateHttpUrl('https://example.com/api/v1?key=val&page=1');
    expect(result.pathname).toBe('/api/v1');
    expect(result.search).toBe('?key=val&page=1');
  });
});

describe('normalizeBaseUrl', () => {
  it('removes trailing slash', () => {
    expect(normalizeBaseUrl('https://example.com/')).toBe('https://example.com');
  });

  it('removes multiple trailing slashes', () => {
    expect(normalizeBaseUrl('https://example.com/api///')).toBe('https://example.com/api');
  });

  it('returns unchanged when no trailing slash', () => {
    expect(normalizeBaseUrl('https://example.com')).toBe('https://example.com');
  });

  it('returns unchanged for empty string', () => {
    expect(normalizeBaseUrl('')).toBe('');
  });

  it('handles single character', () => {
    expect(normalizeBaseUrl('/')).toBe('');
  });
});
