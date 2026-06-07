import type { Task } from '@myboteam/agent-core/common';
import { describe, expect, it } from 'vitest';
import { extractDomains, FAVORITABLE_STATUSES, STATUS_COLORS } from '@/utils/task-utils';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    prompt: '',
    status: 'completed',
    messages: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('task-utils', () => {
  describe('FAVORITABLE_STATUSES', () => {
    it('includes completed and interrupted', () => {
      expect(FAVORITABLE_STATUSES).toContain('completed');
      expect(FAVORITABLE_STATUSES).toContain('interrupted');
      expect(FAVORITABLE_STATUSES).toHaveLength(2);
    });
  });

  describe('STATUS_COLORS', () => {
    it('has entries for all expected statuses', () => {
      const expected = [
        'running',
        'completed',
        'failed',
        'cancelled',
        'interrupted',
        'pending',
        'waiting_permission',
        'queued',
      ];
      for (const status of expected) {
        expect(STATUS_COLORS[status]).toBeDefined();
      }
    });
  });

  describe('extractDomains()', () => {
    it('extracts domain from task prompt', () => {
      const task = makeTask({ prompt: 'Navigate to https://example.com/page' });
      expect(extractDomains(task)).toEqual(['example.com']);
    });

    it('extracts domain from messages', () => {
      const task = makeTask({
        prompt: 'test',
        messages: [
          {
            id: 'm1',
            type: 'assistant',
            content: 'I went to https://github.com/foo',
            timestamp: '',
          },
        ],
      });
      expect(extractDomains(task)).toContain('github.com');
    });

    it('extracts domain from toolInput', () => {
      const task = makeTask({
        prompt: 'test',
        messages: [
          {
            id: 'm1',
            type: 'tool',
            content: 'result',
            toolInput: 'https://docs.python.org/3/',
            timestamp: '',
          },
        ],
      });
      expect(extractDomains(task)).toEqual(['docs.python.org']);
    });

    it('parses JSON toolInput', () => {
      const task = makeTask({
        prompt: 'test',
        messages: [
          {
            id: 'm1',
            type: 'tool',
            content: 'result',
            toolInput: { url: 'https://www.wikipedia.org/wiki/Hello' },
            timestamp: '',
          },
        ],
      });
      expect(extractDomains(task)).toEqual(['wikipedia.org']);
    });

    it('returns empty array when no URLs are present', () => {
      const task = makeTask({ prompt: 'Hello world', messages: [] });
      expect(extractDomains(task)).toEqual([]);
    });

    it('returns up to 3 domains max', () => {
      const task = makeTask({
        prompt: '',
        messages: [
          {
            id: 'm1',
            type: 'user',
            content: 'Check https://a.com, https://b.com, https://c.com, https://d.com',
            timestamp: '',
          },
        ],
      });
      const domains = extractDomains(task);
      expect(domains).toHaveLength(3);
    });

    it('deduplicates domains', () => {
      const task = makeTask({
        prompt: 'Visit https://example.com and then https://example.com again',
      });
      expect(extractDomains(task)).toEqual(['example.com']);
    });

    it('rejects domains with short TLD (< 2 chars)', () => {
      const task = makeTask({
        prompt: 'Go to https://x.gy/abc',
      });
      expect(extractDomains(task)).toEqual(['x.gy']);
    });

    it('handles URLs without www prefix', () => {
      const task = makeTask({ prompt: 'Visit https://example.com' });
      expect(extractDomains(task)).toEqual(['example.com']);
    });

    it('handles http URLs', () => {
      const task = makeTask({ prompt: 'Visit http://example.com' });
      expect(extractDomains(task)).toEqual(['example.com']);
    });

    it('handles https URLs with subdomains', () => {
      const task = makeTask({ prompt: 'Visit https://sub.domain.example.com' });
      expect(extractDomains(task)).toEqual(['sub.domain.example.com']);
    });

    it('rejects URLs with short TLD in prompt', () => {
      const task = makeTask({ prompt: 'Visit https://x.g/abc' });
      expect(extractDomains(task)).toEqual([]);
    });

    it('rejects URLs with short TLD in messages', () => {
      const task = makeTask({
        prompt: 'test',
        messages: [
          {
            id: 'm1',
            type: 'assistant',
            content: 'Check https://a.b/foo',
            timestamp: '',
          },
        ],
      });
      expect(extractDomains(task)).toEqual([]);
    });

    it('rejects URLs with short TLD in toolInput', () => {
      const task = makeTask({
        prompt: 'test',
        messages: [
          {
            id: 'm1',
            type: 'tool',
            content: 'result',
            toolInput: 'https://c.d/bar',
            timestamp: '',
          },
        ],
      });
      expect(extractDomains(task)).toEqual([]);
    });

    it('rejects URLs with short TLD in JSON toolInput', () => {
      const task = makeTask({
        prompt: 'test',
        messages: [
          {
            id: 'm1',
            type: 'tool',
            content: 'result',
            toolInput: { url: 'https://e.f/baz' },
            timestamp: '',
          },
        ],
      });
      expect(extractDomains(task)).toEqual([]);
    });
  });
});
