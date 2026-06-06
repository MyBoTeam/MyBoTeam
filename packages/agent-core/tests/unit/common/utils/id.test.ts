import { describe, expect, it } from 'vitest';
import {
  createFilePermissionRequestId,
  createMessageId,
  createQuestionRequestId,
  createTaskId,
  isFilePermissionRequest,
  isQuestionRequest,
} from '../../../../src/common/utils/id.js';

describe('createTaskId', () => {
  it('returns a string starting with task_', () => {
    expect(createTaskId()).toMatch(/^task_/);
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 10 }, () => createTaskId()));
    expect(ids.size).toBe(10);
  });
});

describe('createMessageId', () => {
  it('returns a string starting with msg_', () => {
    expect(createMessageId()).toMatch(/^msg_/);
  });
});

describe('createFilePermissionRequestId', () => {
  it('returns a string starting with filereq_', () => {
    expect(createFilePermissionRequestId()).toMatch(/^filereq_/);
  });
});

describe('createQuestionRequestId', () => {
  it('returns a string starting with questionreq_', () => {
    expect(createQuestionRequestId()).toMatch(/^questionreq_/);
  });
});

describe('isFilePermissionRequest', () => {
  it('returns true for requests with filereq_ prefix', () => {
    expect(isFilePermissionRequest('filereq_abc123')).toBe(true);
  });

  it('returns false for other request IDs', () => {
    expect(isFilePermissionRequest('questionreq_abc')).toBe(false);
    expect(isFilePermissionRequest('task_abc')).toBe(false);
  });
});

describe('isQuestionRequest', () => {
  it('returns true for requests with questionreq_ prefix', () => {
    expect(isQuestionRequest('questionreq_abc123')).toBe(true);
  });

  it('returns false for other request IDs', () => {
    expect(isQuestionRequest('filereq_abc')).toBe(false);
    expect(isQuestionRequest('task_abc')).toBe(false);
  });
});
