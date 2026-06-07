import { describe, expect, it } from 'vitest';
import { normalizeLightdashUrl } from '@/pages/settings/connectors/components/lightdash/normalize-url';

describe('normalizeLightdashUrl', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeLightdashUrl('')).toBe('');
  });

  it('trims whitespace', () => {
    expect(normalizeLightdashUrl('  https://example.com  ')).toBe('https://example.com/api/v1/mcp');
  });

  it('adds https:// for bare hostnames without scheme', () => {
    expect(normalizeLightdashUrl('example.com')).toBe('https://example.com/api/v1/mcp');
  });

  it('handles bare company name as Lightdash Cloud', () => {
    expect(normalizeLightdashUrl('mycompany')).toBe('https://mycompany.lightdash.cloud/api/v1/mcp');
  });

  it('preserves existing /api/v1/mcp path', () => {
    expect(normalizeLightdashUrl('https://example.com/api/v1/mcp')).toBe(
      'https://example.com/api/v1/mcp',
    );
  });

  it('appends /api/v1/mcp to URL without it', () => {
    expect(normalizeLightdashUrl('https://example.com')).toBe('https://example.com/api/v1/mcp');
  });

  it('handles HTTP URLs', () => {
    expect(normalizeLightdashUrl('http://example.com')).toBe('http://example.com/api/v1/mcp');
  });

  it('strips trailing slashes before appending path', () => {
    expect(normalizeLightdashUrl('https://example.com///')).toBe('https://example.com/api/v1/mcp');
  });

  it('handles non-http protocols by prepending https', () => {
    const result = normalizeLightdashUrl('ftp://example.com');
    expect(result).toContain('api/v1/mcp');
  });

  it('handles URLs with existing path', () => {
    expect(normalizeLightdashUrl('https://example.com/something')).toBe(
      'https://example.com/something/api/v1/mcp',
    );
  });

  it('returns input as-is if URL parsing fails', () => {
    expect(normalizeLightdashUrl('https://')).toBe('https://');
  });
});
