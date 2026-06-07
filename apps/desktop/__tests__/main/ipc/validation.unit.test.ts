import { describe, expect, it, vi } from 'vitest';

vi.mock('undici', () => ({
  ProxyAgent: class ProxyAgent {},
  Agent: class Agent {},
  fetch: vi.fn(),
  setGlobalDispatcher: vi.fn(),
  getGlobalDispatcher: vi.fn(),
}));

import { z } from 'zod';
import {
  normalizeIpcError,
  permissionResponseSchema,
  resumeSessionSchema,
  taskConfigSchema,
  validate,
} from '../../../src/main/ipc/validation';

describe('validation.ts', () => {
  describe('validate()', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      age: z.number().positive('Age must be positive'),
    });

    describe('when given valid payloads', () => {
      it('should return the parsed data for valid input', () => {
        const payload = { name: 'Alice', age: 30 };

        const result = validate(testSchema, payload);

        expect(result).toEqual({ name: 'Alice', age: 30 });
      });

      it('should handle schema with optional fields', () => {
        const schemaWithOptional = z.object({
          required: z.string(),
          optional: z.string().optional(),
        });
        const payload = { required: 'value' };

        const result = validate(schemaWithOptional, payload);

        expect(result).toEqual({ required: 'value' });
      });

      it('should handle schema with default values', () => {
        const schemaWithDefault = z.object({
          value: z.string().default('default'),
        });
        const payload = {};

        const result = validate(schemaWithDefault, payload);

        expect(result).toEqual({ value: 'default' });
      });
    });

    describe('when given invalid payloads', () => {
      it('should throw an error for missing required fields', () => {
        const payload = { age: 30 };

        expect(() => validate(testSchema, payload)).toThrow('Invalid payload: Invalid input');
      });

      it('should throw an error for wrong types', () => {
        const payload = { name: 'Alice', age: 'thirty' };

        expect(() => validate(testSchema, payload)).toThrow('Invalid payload:');
      });

      it('should throw an error for validation constraints', () => {
        const payload = { name: 'Alice', age: -5 };

        expect(() => validate(testSchema, payload)).toThrow(
          'Invalid payload: Age must be positive',
        );
      });

      it('should concatenate multiple error messages with semicolons', () => {
        const payload = { name: '', age: -5 };

        expect(() => validate(testSchema, payload)).toThrow('Invalid payload:');
        try {
          validate(testSchema, payload);
        } catch (error) {
          expect((error as Error).message).toContain(';');
        }
      });

      it('should throw for null payload', () => {
        expect(() => validate(testSchema, null)).toThrow('Invalid payload:');
      });

      it('should throw for undefined payload', () => {
        expect(() => validate(testSchema, undefined)).toThrow('Invalid payload:');
      });
    });
  });

  describe('normalizeIpcError()', () => {
    it('should return the same Error instance if given an Error', () => {
      const error = new Error('Original error');

      const result = normalizeIpcError(error);

      expect(result).toBe(error);
      expect(result.message).toBe('Original error');
    });

    it('should wrap a string in an Error', () => {
      const error = 'String error message';

      const result = normalizeIpcError(error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('String error message');
    });

    it('should return "Unknown IPC error" for null', () => {
      const result = normalizeIpcError(null);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Unknown IPC error');
    });

    it('should return "Unknown IPC error" for undefined', () => {
      const result = normalizeIpcError(undefined);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Unknown IPC error');
    });

    it('should return "Unknown IPC error" for objects', () => {
      const error = { message: 'Object error', code: 123 };

      const result = normalizeIpcError(error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Unknown IPC error');
    });

    it('should return "Unknown IPC error" for numbers', () => {
      const result = normalizeIpcError(42);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Unknown IPC error');
    });

    it('should return "Unknown IPC error" for boolean', () => {
      const result = normalizeIpcError(false);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Unknown IPC error');
    });

    it('should preserve Error subclass types', () => {
      class CustomError extends Error {
        code: number;
        constructor(message: string, code: number) {
          super(message);
          this.code = code;
        }
      }
      const error = new CustomError('Custom error', 500);

      const result = normalizeIpcError(error);

      expect(result).toBe(error);
      expect(result).toBeInstanceOf(CustomError);
      expect((result as CustomError).code).toBe(500);
    });
  });

  describe('taskConfigSchema', () => {
    describe('valid payloads', () => {
      it('should accept minimal valid config with prompt only', () => {
        const config = { prompt: 'Do something' };

        const result = taskConfigSchema.safeParse(config);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.prompt).toBe('Do something');
        }
      });

      it('should accept full config with all optional fields', () => {
        const config = {
          prompt: 'Create a file',
          taskId: 'task_123',
          workingDirectory: '/home/user',
          allowedTools: ['read', 'write'],
          systemPromptAppend: 'Be concise',
          outputSchema: { type: 'object' },
          sessionId: 'session_abc',
          chrome: true,
        };

        const result = taskConfigSchema.safeParse(config);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(config);
        }
      });

      it('should accept empty arrays for allowedTools', () => {
        const config = { prompt: 'Test', allowedTools: [] };

        const result = taskConfigSchema.safeParse(config);

        expect(result.success).toBe(true);
      });

      it('should accept chrome as false', () => {
        const config = { prompt: 'Test', chrome: false };

        const result = taskConfigSchema.safeParse(config);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.chrome).toBe(false);
        }
      });
    });

    describe('invalid payloads', () => {
      it('should reject empty prompt', () => {
        const config = { prompt: '' };

        const result = taskConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Prompt is required');
        }
      });

      it('should reject missing prompt', () => {
        const config = {};

        const result = taskConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
      });

      it('should accept prompt with only whitespace (min(1) allows whitespace)', () => {
        const config = { prompt: '   ' };

        const result = taskConfigSchema.safeParse(config);

        // Note: z.string().min(1) only checks length, not trimmed content

        expect(result.success).toBe(true);
      });

      it('should reject non-string prompt', () => {
        const config = { prompt: 123 };

        const result = taskConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
      });

      it('should reject non-array allowedTools', () => {
        const config = { prompt: 'Test', allowedTools: 'read,write' };

        const result = taskConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
      });

      it('should reject non-boolean chrome', () => {
        const config = { prompt: 'Test', chrome: 'yes' };

        const result = taskConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('permissionResponseSchema', () => {
    describe('valid payloads', () => {
      it('should accept minimal allow response', () => {
        const response = {
          requestId: 'req_123',
          taskId: 'task_456',
          decision: 'allow',
        };

        const result = permissionResponseSchema.safeParse(response);

        expect(result.success).toBe(true);
      });

      it('should accept minimal deny response', () => {
        const response = {
          requestId: 'req_123',
          taskId: 'task_456',
          decision: 'deny',
        };

        const result = permissionResponseSchema.safeParse(response);

        expect(result.success).toBe(true);
      });

      it('should accept response with message', () => {
        const response = {
          requestId: 'req_123',
          taskId: 'task_456',
          decision: 'allow',
          message: 'User approved',
        };

        const result = permissionResponseSchema.safeParse(response);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.message).toBe('User approved');
        }
      });

      it('should accept response with selectedOptions', () => {
        const response = {
          requestId: 'req_123',
          taskId: 'task_456',
          decision: 'allow',
          selectedOptions: ['option1', 'option2'],
        };

        const result = permissionResponseSchema.safeParse(response);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.selectedOptions).toEqual(['option1', 'option2']);
        }
      });
    });

    describe('invalid payloads', () => {
      it('should reject empty requestId', () => {
        const response = {
          requestId: '',
          taskId: 'task_456',
          decision: 'allow',
        };

        const result = permissionResponseSchema.safeParse(response);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Request ID is required');
        }
      });

      it('should reject empty taskId', () => {
        const response = {
          requestId: 'req_123',
          taskId: '',
          decision: 'allow',
        };

        const result = permissionResponseSchema.safeParse(response);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Task ID is required');
        }
      });

      it('should reject invalid decision', () => {
        const response = {
          requestId: 'req_123',
          taskId: 'task_456',
          decision: 'maybe',
        };

        const result = permissionResponseSchema.safeParse(response);

        expect(result.success).toBe(false);
      });

      it('should reject missing decision', () => {
        const response = {
          requestId: 'req_123',
          taskId: 'task_456',
        };

        const result = permissionResponseSchema.safeParse(response);

        expect(result.success).toBe(false);
      });

      it('should reject non-array selectedOptions', () => {
        const response = {
          requestId: 'req_123',
          taskId: 'task_456',
          decision: 'allow',
          selectedOptions: 'option1,option2',
        };

        const result = permissionResponseSchema.safeParse(response);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('resumeSessionSchema', () => {
    describe('valid payloads', () => {
      it('should accept minimal resume config', () => {
        const config = {
          sessionId: 'session_abc',
          prompt: 'Continue the task',
        };

        const result = resumeSessionSchema.safeParse(config);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(config);
        }
      });

      it('should accept resume config with existingTaskId', () => {
        const config = {
          sessionId: 'session_abc',
          prompt: 'Continue the task',
          existingTaskId: 'task_123',
        };

        const result = resumeSessionSchema.safeParse(config);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.existingTaskId).toBe('task_123');
        }
      });

      it('should accept resume config with chrome flag', () => {
        const config = {
          sessionId: 'session_abc',
          prompt: 'Continue the task',
          chrome: true,
        };

        const result = resumeSessionSchema.safeParse(config);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.chrome).toBe(true);
        }
      });
    });

    describe('invalid payloads', () => {
      it('should reject empty sessionId', () => {
        const config = {
          sessionId: '',
          prompt: 'Continue',
        };

        const result = resumeSessionSchema.safeParse(config);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Session ID is required');
        }
      });

      it('should reject empty prompt', () => {
        const config = {
          sessionId: 'session_abc',
          prompt: '',
        };

        const result = resumeSessionSchema.safeParse(config);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Prompt is required');
        }
      });

      it('should reject missing sessionId', () => {
        const config = {
          prompt: 'Continue',
        };

        const result = resumeSessionSchema.safeParse(config);

        expect(result.success).toBe(false);
      });

      it('should reject missing prompt', () => {
        const config = {
          sessionId: 'session_abc',
        };

        const result = resumeSessionSchema.safeParse(config);

        expect(result.success).toBe(false);
      });
    });
  });
});
