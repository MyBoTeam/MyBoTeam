import { afterEach, describe, expect, it, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  exec: vi.fn(),
  run: vi.fn(),
  getRowsModified: vi.fn(),
}));

vi.mock('../../../../src/storage/database.js', () => ({
  getDatabase: vi.fn(() => mockDb),
  flushDatabase: vi.fn(),
  withTransaction: vi.fn((_db, fn: () => void) => fn()),
}));

import {
  clearTodosForTask,
  getTodosForTask,
  saveTodosForTask,
} from '../../../../src/storage/repositories/task-todos.js';

function qResult<T extends Record<string, unknown>>(rows: T | T[]): any[] {
  const arr = Array.isArray(rows) ? rows : [rows];
  if (arr.length === 0) return [];
  const columns = Object.keys(arr[0]);
  const values = arr.map((r) => columns.map((c) => r[c]));
  return [{ columns, values }];
}

describe('task-todos repository', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getTodosForTask', () => {
    it('should query todos ordered by sort_order', () => {
      mockDb.exec.mockReturnValueOnce(
        qResult([
          {
            id: 1,
            task_id: 'task-1',
            todo_id: 'todo-1',
            content: 'Do something',
            status: 'pending',
            priority: 'medium',
            sort_order: 0,
          },
          {
            id: 2,
            task_id: 'task-1',
            todo_id: 'todo-2',
            content: 'Do more',
            status: 'completed',
            priority: 'high',
            sort_order: 1,
          },
        ]),
      );

      const result = getTodosForTask('task-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'todo-1',
        content: 'Do something',
        status: 'pending',
        priority: 'medium',
      });
      expect(result[1]).toEqual({
        id: 'todo-2',
        content: 'Do more',
        status: 'completed',
        priority: 'high',
      });
    });

    it('should return empty array when no todos exist', () => {
      mockDb.exec.mockReturnValueOnce(qResult([]));
      const result = getTodosForTask('empty-task');
      expect(result).toEqual([]);
    });
  });

  describe('saveTodosForTask', () => {
    it('should delete existing todos and insert new ones in a transaction', () => {
      const todos = [
        { id: 'todo-1', content: 'First', status: 'pending' as const, priority: 'high' as const },
        { id: 'todo-2', content: 'Second', status: 'completed' as const, priority: 'low' as const },
      ];

      saveTodosForTask('task-1', todos);

      expect(mockDb.run).toHaveBeenNthCalledWith(1, 'DELETE FROM task_todos WHERE task_id = ?', [
        'task-1',
      ]);
      expect(mockDb.run).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO task_todos'),
        ['task-1', 'todo-1', 'First', 'pending', 'high', 0],
      );
      expect(mockDb.run).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT INTO task_todos'),
        ['task-1', 'todo-2', 'Second', 'completed', 'low', 1],
      );
    });

    it('should handle empty todos array', () => {
      saveTodosForTask('task-1', []);
      expect(mockDb.run).toHaveBeenCalledTimes(1);
      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM task_todos WHERE task_id = ?', [
        'task-1',
      ]);
    });
  });

  describe('clearTodosForTask', () => {
    it('should delete all todos for a task', () => {
      clearTodosForTask('task-1');
      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM task_todos WHERE task_id = ?', [
        'task-1',
      ]);
    });
  });
});
