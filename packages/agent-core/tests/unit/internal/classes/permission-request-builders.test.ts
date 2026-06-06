import { describe, expect, it } from 'vitest';

import {
  buildFilePermissionRequest,
  buildQuestionRequest,
  validateFilePermissionRequest,
  validateQuestionRequest,
} from '../../../../src/internal/classes/permission-request-builders.js';

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
    expect(validateFilePermissionRequest(123)).toEqual({
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

  it('returns invalid when both filePath and filePaths are missing', () => {
    expect(validateFilePermissionRequest({ operation: 'read' })).toEqual({
      valid: false,
      error: 'operation and either filePath or filePaths are required',
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
    const result = validateFilePermissionRequest({
      operation: 'create',
      filePath: '/tmp/test.txt',
    });
    expect(result).toEqual({ valid: true });
  });

  it('returns valid with filePaths array', () => {
    const result = validateFilePermissionRequest({
      operation: 'delete',
      filePaths: ['/tmp/a', '/tmp/b'],
    });
    expect(result).toEqual({ valid: true });
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
    expect(validateQuestionRequest({ question: 'Are you sure?' })).toEqual({ valid: true });
  });
});

describe('buildFilePermissionRequest', () => {
  it('builds a file permission request', () => {
    const result = buildFilePermissionRequest('req-1', 'task-1', {
      operation: 'write',
      filePath: '/tmp/test.txt',
    });

    expect(result.id).toBe('req-1');
    expect(result.taskId).toBe('task-1');
    expect(result.type).toBe('file');
    expect(result.fileOperation).toBe('write');
    expect(result.filePath).toBe('/tmp/test.txt');
    expect(result.createdAt).toBeDefined();
  });

  it('truncates contentPreview to 500 chars', () => {
    const longPreview = 'x'.repeat(1000);
    const result = buildFilePermissionRequest('req-2', 'task-1', {
      operation: 'write',
      filePath: '/tmp/test.txt',
      contentPreview: longPreview,
    });

    expect(result.contentPreview).toHaveLength(500);
  });
});

describe('buildQuestionRequest', () => {
  it('builds a question request', () => {
    const result = buildQuestionRequest('req-1', 'task-1', {
      question: 'Proceed?',
      header: 'Confirm',
      options: [{ label: 'Yes', value: 'yes' }],
      multiSelect: false,
    });

    expect(result.id).toBe('req-1');
    expect(result.taskId).toBe('task-1');
    expect(result.type).toBe('question');
    expect(result.question).toBe('Proceed?');
    expect(result.header).toBe('Confirm');
    expect(result.options).toEqual([{ label: 'Yes', value: 'yes' }]);
    expect(result.multiSelect).toBe(false);
    expect(result.createdAt).toBeDefined();
  });
});
