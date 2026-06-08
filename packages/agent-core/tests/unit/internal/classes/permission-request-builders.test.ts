import { describe, expect, it } from 'vitest';

import {
  buildFilePermissionRequest,
  buildQuestionRequest,
} from '../../../../src/internal/classes/permission-request-builders.js';

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
