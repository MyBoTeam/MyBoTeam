import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage } from '../../../src/storage/agent-storage.js';

describe('Edge Cases: Invalid Paths', () => {
  it('should throw DatabaseError for truly invalid paths', () => {
    expect(
      () =>
        new AgentStorage({
          mode: 'production',
          dataDir: '/nonexistent/deep/path/that/does/not/exist',
        }),
    ).toThrow();
  });

  it('should initialize in a temp directory', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'myboteam-test-'));
    const storage = new AgentStorage({ mode: 'production', dataDir: tmpDir });
    expect(existsSync(tmpDir)).toBe(true);
    expect(storage.getDbPath()).toContain(tmpDir);
    storage.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('Edge Cases: Duplicate Data', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => storage.close());

  it('should reject duplicate agent slugs', () => {
    storage.createAgent({ slug: 'unique', provider: 'p1', model: 'm1' });
    expect(() => {
      storage.createAgent({ slug: 'unique', provider: 'p2', model: 'm2' });
    }).toThrow();
  });

  it('should reject duplicate mcp server names', () => {
    storage.createMcpServer({ name: 'filesystem', command: 'node' });
    expect(() => {
      storage.createMcpServer({ name: 'filesystem', command: 'python' });
    }).toThrow();
  });

  it('should handle INSERT OR IGNORE for duplicate assignments', () => {
    const agent = storage.createAgent({ slug: 'dup-agent', provider: 'p1', model: 'm1' });
    const server = storage.createMcpServer({ name: 'dup-server', command: 'node' });
    storage.assignMcpServer(agent.id, server.id);
    expect(() => storage.assignMcpServer(agent.id, server.id)).not.toThrow();
  });

  it('should reject invalid conversation_id FK', () => {
    expect(() => {
      storage.createMessage({ conversation_id: 'nonexistent', role: 'user', content: 'hi' });
    }).toThrow();
  });
});

describe('Edge Cases: Validation Errors', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => storage.close());

  it('should reject invalid task status', () => {
    const agent = storage.createAgent({ slug: 'val-agent', provider: 'p1', model: 'm1' });
    expect(() => {
      (storage as any).db
        .prepare(
          `INSERT INTO task (id, agent_id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run('x', agent.id, 'x', 'bogus', '2026-01-01', '2026-01-01');
    }).toThrow();
  });

  it('should reject invalid agent status', () => {
    expect(() => {
      (storage as any).db
        .prepare(
          `INSERT INTO agent (id, slug, provider, model, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run('x', 'x', 'x', 'x', 'bogus', '2026-01-01', '2026-01-01');
    }).toThrow();
  });

  it('should reject invalid message role', () => {
    const agent = storage.createAgent({ slug: 'role-test', provider: 'p1', model: 'm1' });
    const conv = storage.createConversation({ agent_id: agent.id, title: 'test' });
    expect(() => {
      (storage as any).db
        .prepare(
          `INSERT INTO message (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`,
        )
        .run('x', conv.id, 'admin', 'content', '2026-01-01');
    }).toThrow();
  });
});

describe('Edge Cases: Empty and Null States', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => storage.close());

  it('should return empty arrays for empty tables', () => {
    expect(storage.listAgents()).toEqual([]);
    expect(storage.listTasks()).toEqual([]);
    expect(storage.listConversations()).toEqual([]);
    expect(storage.listMcpServers()).toEqual([]);
    expect(storage.listNotes()).toEqual([]);
    expect(storage.listSchedules()).toEqual([]);
  });

  it('should return null for non-existent entities', () => {
    expect(storage.getAgent('nonexistent')).toBeNull();
    expect(storage.getTask('nonexistent')).toBeNull();
    expect(storage.getTaskTodo('nonexistent')).toBeNull();
    expect(storage.getConversation('nonexistent')).toBeNull();
    expect(storage.getMessage('nonexistent')).toBeNull();
    expect(storage.getMemoryEntry('nonexistent')).toBeNull();
    expect(storage.getMcpServer('nonexistent')).toBeNull();
    expect(storage.getNote('nonexistent')).toBeNull();
    expect(storage.getSchedule('nonexistent')).toBeNull();
    expect(storage.getDocumentVersion('nonexistent')).toBeNull();
  });

  it('should handle partial updates gracefully', () => {
    const agent = storage.createAgent({ slug: 'partial', provider: 'p1', model: 'm1' });
    const updated = storage.updateAgent(agent.id, {});
    expect(updated.slug).toBe('partial');
  });
});

describe('Edge Cases: CASCADE Deletions', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => storage.close());

  it('should cascade delete task_todos when task is deleted', () => {
    const agent = storage.createAgent({ slug: 'cascade-agent', provider: 'p1', model: 'm1' });
    const task = storage.createTask({ agent_id: agent.id, title: 't1' });
    storage.createTaskTodo({ task_id: task.id, description: 'todo1' });
    storage.createTaskTodo({ task_id: task.id, description: 'todo2' });
    storage.deleteTask(task.id);
    expect(storage.getTask(task.id)).toBeNull();
    expect(storage.listTaskTodos(task.id)).toEqual([]);
  });

  it('should cascade delete messages when conversation is deleted', () => {
    const agent = storage.createAgent({ slug: 'cascade-conv', provider: 'p1', model: 'm1' });
    const conv = storage.createConversation({ agent_id: agent.id, title: 'c1' });
    storage.createMessage({ conversation_id: conv.id, role: 'user', content: 'm1' });
    storage.createMessage({ conversation_id: conv.id, role: 'assistant', content: 'm2' });
    storage.deleteConversation(conv.id);
    expect(storage.listMessages({ conversation_id: conv.id })).toEqual([]);
  });

  it('should cascade delete assignments when agent is deleted', () => {
    const agent = storage.createAgent({ slug: 'cascade-asgn', provider: 'p1', model: 'm1' });
    const server = storage.createMcpServer({ name: 'cascade-server', command: 'node' });
    storage.assignMcpServer(agent.id, server.id);
    storage.deleteAgent(agent.id);
    expect(storage.listAgentMcpAssignments(agent.id)).toEqual([]);
  });
});

describe('Edge Cases: Type Coercion', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => storage.close());

  it('should coerce numeric continuation_count', () => {
    const agent = storage.createAgent({ slug: 'coerce', provider: 'p1', model: 'm1' });
    const task = storage.createTask({ agent_id: agent.id, title: 't1' });
    expect(task.continuation_count).toBe(0);
    storage.updateTask(task.id, { continuation_count: 5 as any });
    const updated = storage.getTask(task.id);
    expect(updated?.continuation_count).toBe(5);
  });

  it('should coerce pinned/archived INTEGER fields', () => {
    const note = storage.createNote({ title: 'bool-test', pinned: 1 });
    expect(note.pinned).toBe(1);
    expect(note.archived).toBe(0);
  });
});
