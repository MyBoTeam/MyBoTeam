import { describe, expect, it } from 'vitest';
import type { TaskMessage } from '../../../../src/common/types/task.js';
import {
  mergeTaskMessage,
  upsertTaskMessages,
} from '../../../../src/common/utils/task-message-merge.js';

describe('task-message-merge', () => {
  describe('mergeTaskMessage', () => {
    it('should keep existing timestamp when incoming has a different timestamp', () => {
      const existing: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'hello' }],
        timestamp: 1000,
      };
      const incoming: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'world' }],
        timestamp: 2000,
      };
      const result = mergeTaskMessage(existing, incoming);
      expect(result.timestamp).toBe(1000);
    });

    it('should take incoming tool fields when present', () => {
      const existing: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'thinking' }],
        timestamp: 1000,
      };
      const incoming: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'thinking' }],
        timestamp: 2000,
        toolName: 'bash',
        toolInput: 'ls',
        toolStatus: 'running',
      };
      const result = mergeTaskMessage(existing, incoming);
      expect(result.toolName).toBe('bash');
      expect(result.toolInput).toBe('ls');
      expect(result.toolStatus).toBe('running');
    });

    it('should keep existing tool fields when incoming does not have them', () => {
      const existing: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'thinking' }],
        timestamp: 1000,
        toolName: 'bash',
        toolInput: 'ls',
        toolStatus: 'completed',
      };
      const incoming: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'done' }],
        timestamp: 2000,
      };
      const result = mergeTaskMessage(existing, incoming);
      expect(result.toolName).toBe('bash');
      expect(result.toolStatus).toBe('completed');
    });

    it('should update tool status when incoming has a newer status', () => {
      const existing: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'thinking' }],
        timestamp: 1000,
        toolName: 'bash',
        toolInput: 'ls',
        toolStatus: 'running',
      };
      const incoming: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'done' }],
        timestamp: 2000,
        toolStatus: 'completed',
      };
      const result = mergeTaskMessage(existing, incoming);
      expect(result.toolStatus).toBe('completed');
      expect(result.toolName).toBe('bash');
    });

    it('should take incoming model metadata when present', () => {
      const existing: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'hello' }],
        timestamp: 1000,
      };
      const incoming: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'hello' }],
        timestamp: 2000,
        modelId: 'claude-3',
        providerId: 'anthropic',
      };
      const result = mergeTaskMessage(existing, incoming);
      expect(result.modelId).toBe('claude-3');
      expect(result.providerId).toBe('anthropic');
    });

    it('should keep existing model metadata when incoming does not have it', () => {
      const existing: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'hello' }],
        timestamp: 1000,
        modelId: 'claude-3',
        providerId: 'anthropic',
      };
      const incoming: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'world' }],
        timestamp: 2000,
      };
      const result = mergeTaskMessage(existing, incoming);
      expect(result.modelId).toBe('claude-3');
      expect(result.providerId).toBe('anthropic');
    });

    it('should update model metadata when incoming provides it', () => {
      const existing: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'hello' }],
        timestamp: 1000,
        modelId: 'claude-3',
      };
      const incoming: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'hello' }],
        timestamp: 2000,
        modelId: 'claude-4',
        providerId: 'anthropic',
      };
      const result = mergeTaskMessage(existing, incoming);
      expect(result.modelId).toBe('claude-4');
      expect(result.providerId).toBe('anthropic');
    });

    it('should take incoming attachments when present', () => {
      const existing: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'hello' }],
        timestamp: 1000,
      };
      const incoming: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'hello' }],
        timestamp: 2000,
        attachments: [
          { id: 'att-1', name: 'file.txt', path: '/tmp/file.txt', type: 'text', size: 100 },
        ],
      };
      const result = mergeTaskMessage(existing, incoming);
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments?.[0]?.id).toBe('att-1');
    });

    it('should keep existing attachments when incoming does not provide them', () => {
      const existing: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'hello' }],
        timestamp: 1000,
        attachments: [
          { id: 'att-1', name: 'file.txt', path: '/tmp/file.txt', type: 'text', size: 100 },
        ],
      };
      const incoming: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'world' }],
        timestamp: 2000,
      };
      const result = mergeTaskMessage(existing, incoming);
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments?.[0]?.id).toBe('att-1');
    });

    it('should spread-override other fields from incoming', () => {
      const existing: TaskMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'hello' }],
        timestamp: 1000,
      };
      const incoming: TaskMessage = {
        id: 'msg-1',
        role: 'user' as TaskMessage['role'],
        content: [{ type: 'text', text: 'world' }],
        timestamp: 2000,
      };
      const result = mergeTaskMessage(existing, incoming);
      expect(result.role).toBe('user');
      expect(result.content).toEqual([{ type: 'text', text: 'world' }]);
    });
  });

  describe('upsertTaskMessages', () => {
    it('should return existing messages when incoming is empty', () => {
      const existing: TaskMessage[] = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'hi' }], timestamp: 1000 },
      ];
      const result = upsertTaskMessages(existing, []);
      expect(result).toHaveLength(1);
      expect(result).toBe(existing);
    });

    it('should append new messages with new IDs', () => {
      const existing: TaskMessage[] = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'hi' }], timestamp: 1000 },
      ];
      const incoming: TaskMessage[] = [
        {
          id: 'msg-2',
          role: 'assistant',
          content: [{ type: 'text', text: 'hello' }],
          timestamp: 2000,
        },
      ];
      const result = upsertTaskMessages(existing, incoming);
      expect(result).toHaveLength(2);
      expect(result[1]?.id).toBe('msg-2');
    });

    it('should merge messages with matching IDs', () => {
      const existing: TaskMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: [{ type: 'text', text: 'thinking' }],
          timestamp: 1000,
          toolStatus: 'running',
          toolName: 'bash',
        },
      ];
      const incoming: TaskMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: [{ type: 'text', text: 'done' }],
          timestamp: 2000,
          toolStatus: 'completed',
        },
      ];
      const result = upsertTaskMessages(existing, incoming);
      expect(result).toHaveLength(1);
      expect(result[0]?.toolStatus).toBe('completed');
      expect(result[0]?.toolName).toBe('bash');
      expect(result[0]?.timestamp).toBe(1000);
    });

    it('should handle multiple incoming messages with mixed new and existing IDs', () => {
      const existing: TaskMessage[] = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'hi' }], timestamp: 1000 },
        {
          id: 'msg-2',
          role: 'assistant',
          content: [{ type: 'text', text: 'thinking' }],
          timestamp: 2000,
          toolStatus: 'running',
        },
      ];
      const incoming: TaskMessage[] = [
        {
          id: 'msg-2',
          role: 'assistant',
          content: [{ type: 'text', text: 'done' }],
          timestamp: 3000,
          toolStatus: 'completed',
        },
        {
          id: 'msg-3',
          role: 'assistant',
          content: [{ type: 'text', text: 'result' }],
          timestamp: 4000,
        },
      ];
      const result = upsertTaskMessages(existing, incoming);
      expect(result).toHaveLength(3);
      expect(result[1]?.toolStatus).toBe('completed');
      expect(result[2]?.id).toBe('msg-3');
    });

    it('should preserve ordering of existing messages', () => {
      const existing: TaskMessage[] = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'first' }], timestamp: 1000 },
        {
          id: 'msg-2',
          role: 'assistant',
          content: [{ type: 'text', text: 'second' }],
          timestamp: 2000,
        },
        { id: 'msg-3', role: 'user', content: [{ type: 'text', text: 'third' }], timestamp: 3000 },
      ];
      const incoming: TaskMessage[] = [
        {
          id: 'msg-2',
          role: 'assistant',
          content: [{ type: 'text', text: 'updated' }],
          timestamp: 4000,
        },
      ];
      const result = upsertTaskMessages(existing, incoming);
      expect(result).toHaveLength(3);
      expect(result[0]?.id).toBe('msg-1');
      expect(result[1]?.id).toBe('msg-2');
      expect(result[2]?.id).toBe('msg-3');
    });

    it('should handle messages without IDs', () => {
      const existing: TaskMessage[] = [
        { role: 'user', content: [{ type: 'text', text: 'hi' }], timestamp: 1000 } as TaskMessage,
      ];
      const incoming: TaskMessage[] = [
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'hello' }],
          timestamp: 2000,
        } as TaskMessage,
      ];
      const result = upsertTaskMessages(existing, incoming);
      expect(result).toHaveLength(2);
    });
  });
});
