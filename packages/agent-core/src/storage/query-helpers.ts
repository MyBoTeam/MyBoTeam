import type { QueryExecResult } from 'sql.js';

export function rowsFromResult<T>(result: QueryExecResult[]): T[] {
  if (!result.length || !result[0].values.length) {
    return [];
  }
  const { columns, values } = result[0];
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])) as T);
}

export function rowFromResult<T>(result: QueryExecResult[]): T | undefined {
  if (!result.length || !result[0].values.length) {
    return undefined;
  }
  const { columns, values } = result[0];
  return Object.fromEntries(columns.map((col, i) => [col, values[0][i]])) as T;
}

export function valueFromResult<T>(result: QueryExecResult[]): T | undefined {
  if (!result.length || !result[0].values.length) {
    return undefined;
  }
  return result[0].values[0][0] as T;
}
