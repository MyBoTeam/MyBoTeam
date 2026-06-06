import { describe, expect, it } from 'vitest';
import {
  authOpenAiAwaitCompletionSchema,
  fileAttachmentSchema,
  permissionResponseSchema,
  resumeSessionSchema,
  taskConfigSchema,
  validate,
} from '../../../../src/common/schemas/validation.js';

describe('validation schemas', () => {
  describe('fileAttachmentSchema', () => {
    it('should parse valid file attachment', () => {
      const result = fileAttachmentSchema.parse({
        id: 'att-1',
        name: 'file.txt',
        path: '/tmp/file.txt',
        type: 'text',
        size: 100,
      });
      expect(result.id).toBe('att-1');
      expect(result.type).toBe('text');
    });

    it('should allow optional content', () => {
      const result = fileAttachmentSchema.parse({
        id: 'att-1',
        name: 'file.png',
        path: '/tmp/file.png',
        type: 'image',
        size: 1024,
        content: 'base64...',
      });
      expect(result.content).toBe('base64...');
    });

    it('should reject invalid type', () => {
      expect(() =>
        fileAttachmentSchema.parse({
          id: 'att-1',
          name: 'file.txt',
          path: '/tmp/file.txt',
          type: 'video',
          size: 100,
        }),
      ).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => fileAttachmentSchema.parse({ id: 'att-1' })).toThrow();
    });
  });

  describe('taskConfigSchema', () => {
    it('should parse valid task config', () => {
      const result = taskConfigSchema.parse({
        prompt: 'Do something',
      });
      expect(result.prompt).toBe('Do something');
    });

    it('should require prompt', () => {
      expect(() => taskConfigSchema.parse({})).toThrow();
    });

    it('should reject empty prompt', () => {
      expect(() => taskConfigSchema.parse({ prompt: '' })).toThrow();
    });

    it('should parse with all optional fields', () => {
      const result = taskConfigSchema.parse({
        prompt: 'Test',
        taskId: 'task-1',
        workingDirectory: '/tmp',
        allowedTools: ['bash', 'read'],
        systemPromptAppend: 'Be careful',
        outputSchema: { type: 'object' },
        sessionId: 'session-1',
        chrome: true,
        workspaceId: 'ws-1',
        attachments: [{ id: 'a1', name: 'f.txt', path: '/f.txt', type: 'text', size: 10 }],
        modelId: 'claude-3',
        provider: 'anthropic',
        source: 'ui',
      });
      expect(result.source).toBe('ui');
      expect(result.chrome).toBe(true);
    });

    it('should accept valid source values', () => {
      expect(taskConfigSchema.parse({ prompt: 'x', source: 'ui' }).source).toBe('ui');
      expect(taskConfigSchema.parse({ prompt: 'x', source: 'whatsapp' }).source).toBe('whatsapp');
      expect(taskConfigSchema.parse({ prompt: 'x', source: 'scheduler' }).source).toBe('scheduler');
    });

    it('should reject invalid source', () => {
      expect(() => taskConfigSchema.parse({ prompt: 'x', source: 'invalid' })).toThrow();
    });
  });

  describe('permissionResponseSchema', () => {
    it('should parse valid permission response', () => {
      const result = permissionResponseSchema.parse({
        requestId: 'req-1',
        taskId: 'task-1',
        decision: 'allow',
      });
      expect(result.requestId).toBe('req-1');
      expect(result.decision).toBe('allow');
    });

    it('should reject missing required fields', () => {
      expect(() => permissionResponseSchema.parse({ decision: 'allow' })).toThrow();
    });

    it('should accept deny decision with optional fields', () => {
      const result = permissionResponseSchema.parse({
        requestId: 'req-1',
        taskId: 'task-1',
        decision: 'deny',
        message: 'Not allowed',
        selectedOptions: ['opt1'],
        customText: 'nope',
      });
      expect(result.decision).toBe('deny');
      expect(result.customText).toBe('nope');
    });
  });

  describe('authOpenAiAwaitCompletionSchema', () => {
    it('should parse valid schema', () => {
      const result = authOpenAiAwaitCompletionSchema.parse({
        sessionId: 'sess-1',
        timeoutMs: 30000,
      });
      expect(result.sessionId).toBe('sess-1');
      expect(result.timeoutMs).toBe(30000);
    });

    it('should make timeoutMs optional', () => {
      const result = authOpenAiAwaitCompletionSchema.parse({
        sessionId: 'sess-1',
      });
      expect(result.timeoutMs).toBeUndefined();
    });

    it('should reject empty sessionId', () => {
      expect(() => authOpenAiAwaitCompletionSchema.parse({ sessionId: '' })).toThrow();
    });
  });

  describe('resumeSessionSchema', () => {
    it('should parse valid resume session', () => {
      const result = resumeSessionSchema.parse({
        sessionId: 'sess-1',
        prompt: 'Continue',
      });
      expect(result.sessionId).toBe('sess-1');
      expect(result.prompt).toBe('Continue');
    });

    it('should parse with optional fields', () => {
      const result = resumeSessionSchema.parse({
        sessionId: 'sess-1',
        prompt: 'Continue',
        existingTaskId: 'task-1',
        chrome: true,
        workspaceId: 'ws-1',
        attachments: [{ id: 'a1', name: 'f.txt', path: '/f.txt', type: 'text', size: 10 }],
      });
      expect(result.existingTaskId).toBe('task-1');
    });
  });

  describe('validate helper', () => {
    it('should return parsed data for valid payload', () => {
      const result = validate(taskConfigSchema, { prompt: 'hello' });
      expect(result.prompt).toBe('hello');
    });

    it('should throw error for invalid payload', () => {
      expect(() => validate(taskConfigSchema, {})).toThrow('Invalid payload');
    });

    it('should throw with concatenated error messages', () => {
      expect(() => validate(fileAttachmentSchema, { id: 'a1' })).toThrow('Invalid payload');
    });
  });
});
