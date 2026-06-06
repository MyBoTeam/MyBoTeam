import { sanitizeAttachments } from '@main/ipc/handlers/attachment-utils';
import { describe, expect, it } from 'vitest';

describe('sanitizeAttachments', () => {
  it('should return empty array for undefined input', () => {
    expect(sanitizeAttachments(undefined)).toEqual([]);
  });

  it('should return empty array for null input', () => {
    expect(sanitizeAttachments(null as unknown as undefined[])).toEqual([]);
  });

  it('should return empty array for non-array input', () => {
    expect(sanitizeAttachments('not an array' as unknown as undefined[])).toEqual([]);
  });

  it('should return empty array for empty array', () => {
    expect(sanitizeAttachments([])).toEqual([]);
  });

  it('should filter out null items', () => {
    const result = sanitizeAttachments([null]);
    expect(result).toEqual([]);
  });

  it('should filter out non-object items', () => {
    const result = sanitizeAttachments(['string', 42, true] as unknown as undefined[]);
    expect(result).toEqual([]);
  });

  it('should filter out items missing required fields', () => {
    const result = sanitizeAttachments([
      { path: '/some/path', name: 'test.txt' },
      { path: '/some/path', type: 'image' },
      { name: 'test.txt', type: 'image' },
    ]);
    expect(result).toEqual([]);
  });

  it('should filter out items with invalid type', () => {
    const result = sanitizeAttachments([
      { path: '/some/path', name: 'test.txt', type: 'invalid-type', size: 100 },
    ]);
    expect(result).toEqual([]);
  });

  it('should return valid attachment objects', () => {
    const result = sanitizeAttachments([
      { path: '/file.png', name: 'file.png', type: 'image', size: 1024 },
    ]);
    expect(result).toEqual([{ path: '/file.png', name: 'file.png', type: 'image', size: 1024 }]);
  });

  it('should clamp size to MAX_ATTACHMENT_SIZE (10MB)', () => {
    const result = sanitizeAttachments([
      { path: '/big-file.pdf', name: 'big-file.pdf', type: 'pdf', size: 20_971_520 },
    ]);
    expect(result[0].size).toBe(10_485_760);
  });

  it('should filter out items with negative size', () => {
    const result = sanitizeAttachments([
      { path: '/file.pdf', name: 'file.pdf', type: 'pdf', size: -1 },
    ]);
    expect(result).toEqual([]);
  });

  it('should truncate path to 4096 chars', () => {
    const longPath = `/a/${'x'.repeat(4100)}`;
    const result = sanitizeAttachments([
      { path: longPath, name: 'file.pdf', type: 'pdf', size: 100 },
    ]);
    expect(result[0].path.length).toBeLessThanOrEqual(4096);
  });

  it('should truncate name to 512 chars', () => {
    const longName = `${'x'.repeat(600)}.txt`;
    const result = sanitizeAttachments([
      { path: '/file.txt', name: longName, type: 'text', size: 100 },
    ]);
    expect(result[0].name.length).toBeLessThanOrEqual(512);
  });

  it('should handle all valid attachment types', () => {
    const items = [
      { path: '/img.png', name: 'img.png', type: 'image', size: 100 },
      { path: '/doc.pdf', name: 'doc.pdf', type: 'pdf', size: 200 },
      { path: '/code.js', name: 'code.js', type: 'code', size: 300 },
      { path: '/readme.txt', name: 'readme.txt', type: 'text', size: 400 },
      { path: '/other.bin', name: 'other.bin', type: 'other', size: 500 },
    ];
    expect(sanitizeAttachments(items)).toEqual(items);
  });

  it('should handle mixed valid and invalid items', () => {
    const result = sanitizeAttachments([
      null,
      { path: '/valid.png', name: 'valid.png', type: 'image', size: 100 },
      { path: '/no-type.txt', name: 'no-type.txt', size: 100 },
      { path: '/valid2.pdf', name: 'valid2.pdf', type: 'pdf', size: 200 },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].path).toBe('/valid.png');
    expect(result[1].path).toBe('/valid2.pdf');
  });
});
