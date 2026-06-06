import type { QueryExecResult } from 'sql.js';
import { describe, expect, it } from 'vitest';
import {
  rowFromResult,
  rowsFromResult,
  valueFromResult,
} from '../../../src/storage/query-helpers.js';

describe('rowsFromResult', () => {
  it('returns empty array for empty result', () => {
    const result: QueryExecResult[] = [];
    expect(rowsFromResult(result)).toEqual([]);
  });

  it('returns empty array when values are empty', () => {
    const result: QueryExecResult[] = [{ columns: ['id', 'name'], values: [] }];
    expect(rowsFromResult(result)).toEqual([]);
  });

  it('maps rows to typed objects', () => {
    const result: QueryExecResult[] = [
      {
        columns: ['id', 'name', 'active'],
        values: [
          [1, 'Alice', 1],
          [2, 'Bob', 0],
        ],
      },
    ];
    const rows = rowsFromResult<{ id: number; name: string; active: number }>(result);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ id: 1, name: 'Alice', active: 1 });
    expect(rows[1]).toEqual({ id: 2, name: 'Bob', active: 0 });
  });

  it('handles null values', () => {
    const result: QueryExecResult[] = [
      {
        columns: ['id', 'email', 'label'],
        values: [[1, null, 'test']],
      },
    ];
    const rows = rowsFromResult<{ id: number; email: null; label: string }>(result);
    expect(rows[0].email).toBeNull();
  });
});

describe('rowFromResult', () => {
  it('returns undefined for empty result', () => {
    const result: QueryExecResult[] = [];
    expect(rowFromResult(result)).toBeUndefined();
  });

  it('returns undefined when values are empty', () => {
    const result: QueryExecResult[] = [{ columns: ['id'], values: [] }];
    expect(rowFromResult(result)).toBeUndefined();
  });

  it('returns the first row as typed object', () => {
    const result: QueryExecResult[] = [
      {
        columns: ['id', 'name'],
        values: [[42, 'Answer']],
      },
    ];
    expect(rowFromResult<{ id: number; name: string }>(result)).toEqual({ id: 42, name: 'Answer' });
  });
});

describe('valueFromResult', () => {
  it('returns undefined for empty result', () => {
    const result: QueryExecResult[] = [];
    expect(valueFromResult(result)).toBeUndefined();
  });

  it('returns the first column of the first row', () => {
    const result: QueryExecResult[] = [
      {
        columns: ['count'],
        values: [[99]],
      },
    ];
    expect(valueFromResult<number>(result)).toBe(99);
  });

  it('returns null when value is null', () => {
    const result: QueryExecResult[] = [
      {
        columns: ['val'],
        values: [[null]],
      },
    ];
    expect(valueFromResult(result)).toBeNull();
  });

  it('returns string values', () => {
    const result: QueryExecResult[] = [
      {
        columns: ['name'],
        values: [['Alice']],
      },
    ];
    expect(valueFromResult<string>(result)).toBe('Alice');
  });
});
