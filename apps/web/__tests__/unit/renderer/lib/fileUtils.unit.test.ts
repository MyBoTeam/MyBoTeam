import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatFileSize,
  generateFileId,
  getFileType,
  MAX_FILE_SIZE,
  MAX_FILES,
  processFileAttachments,
} from '@/lib/fileUtils';

describe('fileUtils', () => {
  describe('getFileType()', () => {
    it('returns "image" for image extensions', () => {
      expect(getFileType('photo.png')).toBe('image');
      expect(getFileType('photo.jpg')).toBe('image');
      expect(getFileType('photo.jpeg')).toBe('image');
      expect(getFileType('photo.gif')).toBe('image');
      expect(getFileType('photo.webp')).toBe('image');
      expect(getFileType('photo.svg')).toBe('image');
      expect(getFileType('photo.bmp')).toBe('image');
      expect(getFileType('photo.ico')).toBe('image');
    });

    it('returns "text" for text extensions', () => {
      expect(getFileType('readme.txt')).toBe('text');
      expect(getFileType('readme.md')).toBe('text');
      expect(getFileType('data.csv')).toBe('text');
      expect(getFileType('output.log')).toBe('text');
      expect(getFileType('page.xml')).toBe('text');
      expect(getFileType('index.html')).toBe('text');
      expect(getFileType('config.yml')).toBe('text');
      expect(getFileType('config.yaml')).toBe('text');
      expect(getFileType('config.toml')).toBe('text');
      expect(getFileType('config.ini')).toBe('text');
      expect(getFileType('config.cfg')).toBe('text');
    });

    it('returns "code" for code file extensions', () => {
      expect(getFileType('script.js')).toBe('code');
      expect(getFileType('script.jsx')).toBe('code');
      expect(getFileType('component.ts')).toBe('code');
      expect(getFileType('component.tsx')).toBe('code');
      expect(getFileType('app.py')).toBe('code');
      expect(getFileType('main.go')).toBe('code');
      expect(getFileType('main.rs')).toBe('code');
      expect(getFileType('data.json')).toBe('code');
      expect(getFileType('style.css')).toBe('code');
    });

    it('returns "pdf" for pdf extension', () => {
      expect(getFileType('document.pdf')).toBe('pdf');
    });

    it('returns "other" for unknown extensions', () => {
      expect(getFileType('archive.zip')).toBe('other');
      expect(getFileType('video.mp4')).toBe('other');
      expect(getFileType('audio.mp3')).toBe('other');
    });

    it('handles case-insensitive extensions', () => {
      expect(getFileType('photo.PNG')).toBe('image');
      expect(getFileType('script.TS')).toBe('code');
      expect(getFileType('readme.TXT')).toBe('text');
    });

    it('handles files without extensions', () => {
      expect(getFileType('Makefile')).toBe('other');
      expect(getFileType('README')).toBe('other');
    });
  });

  describe('generateFileId()', () => {
    it('generates a string starting with "file_"', () => {
      const id = generateFileId();
      expect(id).toMatch(/^file_/);
    });

    it('generates unique ids on successive calls', () => {
      const id1 = generateFileId();
      const id2 = generateFileId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('formatFileSize()', () => {
    it('formats bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('formats KB', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10 * 1024)).toBe('10.0 KB');
    });

    it('formats MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10.0 MB');
    });
  });

  describe('processFileAttachments()', () => {
    let file: File;

    beforeEach(() => {
      file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    });

    it('returns empty array when at max files', () => {
      const result = processFileAttachments([file], MAX_FILES);
      expect(result).toEqual([]);
    });

    it('accepts a valid file when under the limit', () => {
      const result = processFileAttachments([file], 0);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test.txt');
      expect(result[0].type).toBe('text');
      expect(result[0].size).toBe(file.size);
    });

    it('skips files over MAX_FILE_SIZE', () => {
      const bigFile = new File(['x'.repeat(MAX_FILE_SIZE + 1)], 'big.bin', {
        type: 'application/octet-stream',
      });
      const onOversize = vi.fn();
      const result = processFileAttachments([bigFile], 0, { onOversize });
      expect(result).toHaveLength(0);
      expect(onOversize).toHaveBeenCalledWith('big.bin', formatFileSize(MAX_FILE_SIZE));
    });

    it('respects the remaining slot count', () => {
      const files = [file, new File(['a'], 'b.txt', { type: 'text/plain' })];
      const result = processFileAttachments(files, MAX_FILES - 1);
      expect(result).toHaveLength(1);
    });

    it('calls onOverLimit when more files than remaining slots', () => {
      const files = [
        file,
        new File(['a'], 'b.txt', { type: 'text/plain' }),
        new File(['b'], 'c.txt', { type: 'text/plain' }),
      ];
      const onOverLimit = vi.fn();
      const result = processFileAttachments(files, MAX_FILES - 1, { onOverLimit });
      expect(result).toHaveLength(1);
      expect(onOverLimit).toHaveBeenCalledWith(2, MAX_FILES);
    });
  });
});
