import { afterEach, describe, expect, it, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  exec: vi.fn(),
  run: vi.fn(),
  getRowsModified: vi.fn(),
}));

vi.mock('../../../../src/storage/database.js', () => ({
  getDatabase: vi.fn(() => mockDb),
  flushDatabase: vi.fn(),
}));

import {
  createScheduledTask,
  deleteScheduledTask,
  getAllScheduledTasks,
  getEnabledScheduledTasks,
  getScheduledTaskById,
  getScheduledTasksByWorkspace,
  setScheduledTaskEnabled,
  updateScheduledTaskLastRun,
} from '../../../../src/storage/repositories/scheduled-tasks.js';

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    cron: '0 9 * * 1-5',
    prompt: 'Daily standup summary',
    workspace_id: null,
    is_enabled: 1,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    last_run_at: null,
    next_run_at: '2024-01-02T09:00:00.000Z',
    ...overrides,
  };
}

function qResult<T extends Record<string, unknown>>(rows: T | T[]): any[] {
  const arr = Array.isArray(rows) ? rows : [rows];
  if (arr.length === 0) return [];
  const columns = Object.keys(arr[0]);
  const values = arr.map((r) => columns.map((c) => r[c]));
  return [{ columns, values }];
}

describe('scheduled-tasks repository', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllScheduledTasks', () => {
    it('returns all tasks ordered by created_at', () => {
      mockDb.exec.mockReturnValueOnce(qResult([makeRow()]));
      const result = getAllScheduledTasks();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-1');
      expect(result[0].enabled).toBe(true);
    });
  });

  describe('getEnabledScheduledTasks', () => {
    it('returns only enabled tasks', () => {
      mockDb.exec.mockReturnValueOnce(qResult([makeRow()]));
      const result = getEnabledScheduledTasks();
      expect(result).toHaveLength(1);
    });
  });

  describe('getScheduledTasksByWorkspace', () => {
    it('returns tasks for workspace', () => {
      mockDb.exec.mockReturnValueOnce(qResult([makeRow({ workspace_id: 'ws-1' })]));
      const result = getScheduledTasksByWorkspace('ws-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getScheduledTaskById', () => {
    it('returns task when found', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow()));
      const result = getScheduledTaskById('task-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('task-1');
    });

    it('returns null when not found', () => {
      mockDb.exec.mockReturnValueOnce(qResult([]));
      expect(getScheduledTaskById('nonexistent')).toBeNull();
    });
  });

  describe('createScheduledTask', () => {
    it('creates and returns a new task', () => {
      const result = createScheduledTask('0 9 * * 1-5', 'Daily report', 'ws-1');
      expect(result.cron).toBe('0 9 * * 1-5');
      expect(result.prompt).toBe('Daily report');
      expect(result.workspaceId).toBe('ws-1');
      expect(result.enabled).toBe(true);
      expect(mockDb.run).toHaveBeenCalled();
      const args = mockDb.run.mock.calls[0][1];
      expect(args[0]).toBeTypeOf('string');
      expect(args[1]).toBe('0 9 * * 1-5');
      expect(args[2]).toBe('Daily report');
      expect(args[3]).toBe('ws-1');
    });

    it('creates with null workspaceId when not provided', () => {
      createScheduledTask('0 9 * * 1-5', 'Daily report');
      const args = mockDb.run.mock.calls[0][1];
      expect(args[3]).toBeNull();
    });

    it('throws when cron has no matching date', () => {
      expect(() => createScheduledTask('99 99 * * *', 'Bad cron')).toThrow('Cannot schedule');
    });
  });

  describe('deleteScheduledTask', () => {
    it('deletes task by id', () => {
      deleteScheduledTask('task-1');
      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM scheduled_tasks WHERE id = ?', [
        'task-1',
      ]);
    });
  });

  describe('setScheduledTaskEnabled', () => {
    it('enables a task and recomputes next_run_at', () => {
      mockDb.exec.mockReturnValueOnce(qResult({ cron: '0 9 * * 1-5' }));
      setScheduledTaskEnabled('task-1', true);
      expect(mockDb.run).toHaveBeenCalled();
      const args = mockDb.run.mock.calls[0][1];
      expect(args[0]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(args[1]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(args[2]).toBe('task-1');
    });

    it('disables a task', () => {
      setScheduledTaskEnabled('task-1', false);
      expect(mockDb.run).toHaveBeenCalled();
      const args = mockDb.run.mock.calls[0][1];
      expect(args[0]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(args[1]).toBe('task-1');
    });

    it('throws when enabling a task with unresolvable cron', () => {
      mockDb.exec.mockReturnValueOnce(qResult({ cron: '0 0 30 2 *' }));
      expect(() => setScheduledTaskEnabled('task-1', true)).toThrow('Cannot enable schedule');
    });
  });

  describe('updateScheduledTaskLastRun', () => {
    it('updates last_run_at and next_run_at', () => {
      updateScheduledTaskLastRun('task-1', '2024-01-02T09:00:00.000Z', '2024-01-03T09:00:00.000Z');
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE scheduled_tasks'), [
        '2024-01-02T09:00:00.000Z',
        '2024-01-03T09:00:00.000Z',
        expect.any(String),
        'task-1',
      ]);
    });
  });
});
