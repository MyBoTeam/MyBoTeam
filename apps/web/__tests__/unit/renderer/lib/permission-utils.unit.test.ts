import { describe, expect, it } from 'vitest';
import {
  getDisplayFilePaths,
  getOperationBadgeClasses,
  isDeleteOperation,
} from '@/components/execution/permission-utils';

describe('getOperationBadgeClasses', () => {
  it('returns red for delete', () => {
    expect(getOperationBadgeClasses('delete')).toContain('red');
  });

  it('returns orange for overwrite', () => {
    expect(getOperationBadgeClasses('overwrite')).toContain('orange');
  });

  it('returns yellow for modify', () => {
    expect(getOperationBadgeClasses('modify')).toContain('yellow');
  });

  it('returns green for create', () => {
    expect(getOperationBadgeClasses('create')).toContain('green');
  });

  it('returns blue for rename', () => {
    expect(getOperationBadgeClasses('rename')).toContain('blue');
  });

  it('returns blue for move', () => {
    expect(getOperationBadgeClasses('move')).toContain('blue');
  });

  it('returns gray for unknown operations', () => {
    expect(getOperationBadgeClasses('unknown')).toContain('gray');
  });

  it('returns gray when operation is undefined', () => {
    expect(getOperationBadgeClasses(undefined)).toContain('gray');
  });
});

describe('isDeleteOperation', () => {
  it('returns true for file type with delete operation', () => {
    expect(isDeleteOperation({ type: 'file', fileOperation: 'delete' })).toBe(true);
  });

  it('returns false for non-file type', () => {
    expect(isDeleteOperation({ type: 'command', fileOperation: 'delete' })).toBe(false);
  });

  it('returns false for file type with non-delete operation', () => {
    expect(isDeleteOperation({ type: 'file', fileOperation: 'write' })).toBe(false);
  });

  it('returns false when fileOperation is undefined', () => {
    expect(isDeleteOperation({ type: 'file' })).toBe(false);
  });
});

describe('getDisplayFilePaths', () => {
  it('returns filePaths array when present', () => {
    expect(getDisplayFilePaths({ filePaths: ['a.txt', 'b.txt'] })).toEqual(['a.txt', 'b.txt']);
  });

  it('returns single filePath as array when filePaths is empty', () => {
    expect(getDisplayFilePaths({ filePath: 'doc.md' })).toEqual(['doc.md']);
  });

  it('returns empty array when neither is present', () => {
    expect(getDisplayFilePaths({})).toEqual([]);
  });

  it('prefers filePaths over filePath', () => {
    expect(getDisplayFilePaths({ filePath: 'old.txt', filePaths: ['new.txt'] })).toEqual([
      'new.txt',
    ]);
  });
});
