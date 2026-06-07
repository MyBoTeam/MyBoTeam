import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildFilePermissionRequest,
  buildQuestionRequest,
  createPendingPermissionRequest,
  createPendingQuestionRequest,
  validateFilePermissionRequest,
  validateQuestionRequest,
} from '../../../../src/internal/classes/permission-request-state.js';

describe('validateFilePermissionRequest', () => {
  it('returns invalid for non-object data', () => {
    expect(validateFilePermissionRequest(null)).toEqual({
      valid: false,
      error: 'Invalid request data',
    });
    expect(validateFilePermissionRequest('string')).toEqual({
      valid: false,
      error: 'Invalid request data',
    });
  });

  it('returns invalid when operation is missing', () => {
    expect(validateFilePermissionRequest({ filePath: '/tmp/test' })).toEqual({
      valid: false,
      error: 'operation is required',
    });
  });

  it('returns invalid for invalid operation type', () => {
    expect(
      validateFilePermissionRequest({ operation: 'invalid-op', filePath: '/tmp/test' }),
    ).toEqual({
      valid: false,
      error: expect.stringContaining('Invalid operation'),
    });
  });

  it('returns valid for valid file create request', () => {
    expect(
      validateFilePermissionRequest({ operation: 'create', filePath: '/tmp/test.txt' }),
    ).toEqual({ valid: true });
  });

  it('returns valid with filePaths array', () => {
    expect(validateFilePermissionRequest({ operation: 'delete', filePaths: ['/tmp/a'] })).toEqual({
      valid: true,
    });
  });
});

describe('validateQuestionRequest', () => {
  it('returns invalid for non-object data', () => {
    expect(validateQuestionRequest(null)).toEqual({ valid: false, error: 'Invalid request data' });
  });

  it('returns invalid when question is missing', () => {
    expect(validateQuestionRequest({})).toEqual({ valid: false, error: 'question is required' });
  });

  it('returns valid when question is present', () => {
    expect(validateQuestionRequest({ question: 'Proceed?' })).toEqual({ valid: true });
  });
});

describe('buildFilePermissionRequest', () => {
  it('builds a file permission request', () => {
    const result = buildFilePermissionRequest('req-1', 'task-1', {
      operation: 'create',
      filePath: '/tmp/test.txt',
    });
    expect(result.id).toBe('req-1');
    expect(result.taskId).toBe('task-1');
    expect(result.type).toBe('file');
    expect(result.fileOperation).toBe('create');
    expect(result.filePath).toBe('/tmp/test.txt');
    expect(result.createdAt).toBeDefined();
  });

  it('truncates contentPreview to 500 chars', () => {
    const result = buildFilePermissionRequest('req-2', 'task-1', {
      operation: 'modify',
      filePath: '/tmp/test.txt',
      contentPreview: 'x'.repeat(1000),
    });
    expect(result.contentPreview).toHaveLength(500);
  });
});

describe('buildQuestionRequest', () => {
  it('builds a question request', () => {
    const result = buildQuestionRequest('req-1', 'task-1', {
      question: 'Proceed?',
      options: [{ label: 'Yes', value: 'yes' }],
    });
    expect(result.id).toBe('req-1');
    expect(result.taskId).toBe('task-1');
    expect(result.type).toBe('question');
    expect(result.question).toBe('Proceed?');
  });
});

describe('createPendingPermissionRequest', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a pending permission request with timeout', async () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();

    const { requestId, pending, promise } = createPendingPermissionRequest(5000, onTimeout);

    expect(requestId).toBeTypeOf('string');
    expect(requestId).toMatch(/^filereq_/);
    expect(typeof pending.resolve).toBe('function');
    expect(typeof pending.reject).toBe('function');

    pending.resolve(true);
    const result = await promise;
    expect(result).toBe(true);

    vi.useRealTimers();
  });

  it('rejects on timeout', async () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();

    const { requestId, promise } = createPendingPermissionRequest(5000, onTimeout);

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow('Permission request timed out');
    expect(onTimeout).toHaveBeenCalledWith(requestId);

    vi.useRealTimers();
  });
});

describe('createPendingQuestionRequest', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a pending question request with timeout', async () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();

    const { requestId, pending, promise } = createPendingQuestionRequest(5000, onTimeout);

    expect(requestId).toBeTypeOf('string');
    expect(requestId).toMatch(/^questionreq_/);

    pending.resolve({ selectedOptions: ['yes'] });
    const result = await promise;
    expect(result.selectedOptions).toEqual(['yes']);

    vi.useRealTimers();
  });

  it('rejects on timeout', async () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();

    const { requestId, promise } = createPendingQuestionRequest(5000, onTimeout);

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow('Question request timed out');
    expect(onTimeout).toHaveBeenCalledWith(requestId);

    vi.useRealTimers();
  });
});
