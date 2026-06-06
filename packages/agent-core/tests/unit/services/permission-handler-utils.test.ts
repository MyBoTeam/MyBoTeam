import { describe, expect, it } from 'vitest';

import {
  buildFilePermissionRequest,
  buildQuestionRequest,
  validateFilePermissionRequest,
  validateQuestionRequest,
} from '../../../src/services/permission-handler-utils.js';

describe('validateFilePermissionRequest', () => {
  it('returns invalid for non-object data', () => {
    expect(validateFilePermissionRequest(null)).toEqual({
      valid: false,
      error: 'Invalid request data',
    });
    expect(validateFilePermissionRequest(42)).toEqual({
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
    expect(validateFilePermissionRequest({ operation: 'bad', filePath: '/tmp/test' })).toEqual({
      valid: false,
      error: expect.stringContaining('Invalid operation'),
    });
  });

  it('returns valid with filePath', () => {
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
  it('returns invalid for non-object', () => {
    expect(validateQuestionRequest(null)).toEqual({ valid: false, error: 'Invalid request data' });
  });

  it('returns invalid when question missing', () => {
    expect(validateQuestionRequest({})).toEqual({ valid: false, error: 'question is required' });
  });

  it('returns valid with question', () => {
    expect(validateQuestionRequest({ question: 'OK?' })).toEqual({ valid: true });
  });
});

describe('buildFilePermissionRequest', () => {
  it('builds a file permission request', () => {
    const r = buildFilePermissionRequest('r1', 't1', { operation: 'modify', filePath: '/f' });
    expect(r.id).toBe('r1');
    expect(r.taskId).toBe('t1');
    expect(r.type).toBe('file');
    expect(r.fileOperation).toBe('modify');
    expect(r.filePath).toBe('/f');
  });
});

describe('buildQuestionRequest', () => {
  it('builds a question request', () => {
    const r = buildQuestionRequest('r1', 't1', { question: 'OK?', options: [] });
    expect(r.id).toBe('r1');
    expect(r.taskId).toBe('t1');
    expect(r.type).toBe('question');
    expect(r.question).toBe('OK?');
  });
});
