import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage } from '../../../src/storage/agent-storage.js';

describe('Schema Validation', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => {
    storage.close();
  });

  it('should create all 11 required tables', () => {
    const missing = storage.validateSchema();
    expect(missing).toEqual([]);
  });

  it('should have correct column structure for agent table', () => {
    const columns = (storage as any).db.prepare('PRAGMA table_info(agent)').all() as {
      name: string;
    }[];
    const names = columns.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('slug');
    expect(names).toContain('provider');
    expect(names).toContain('model');
    expect(names).toContain('status');
    expect(names).toContain('created_at');
    expect(names).toContain('updated_at');
  });

  it('should have correct column structure for task table', () => {
    const columns = (storage as any).db.prepare('PRAGMA table_info(task)').all() as {
      name: string;
    }[];
    const names = columns.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('agent_id');
    expect(names).toContain('title');
    expect(names).toContain('status');
    expect(names).toContain('created_at');
    expect(names).toContain('updated_at');
  });

  it('should enforce FOREIGN KEY constraints', () => {
    expect(() => {
      storage.createTask({ agent_id: 'nonexistent-agent-id', title: 'orphan task' });
    }).toThrow();
  });

  it('should enforce UNIQUE constraints on agent.slug', () => {
    storage.createAgent({ slug: 'unique-slug', provider: 'p', model: 'm' });
    expect(() => {
      storage.createAgent({ slug: 'unique-slug', provider: 'p', model: 'm' });
    }).toThrow();
  });

  it('should enforce UNIQUE constraints on mcp_server.name', () => {
    storage.createMcpServer({ name: 'unique-name', command: 'cmd' });
    expect(() => {
      storage.createMcpServer({ name: 'unique-name', command: 'cmd' });
    }).toThrow();
  });

  it('should enforce CHECK constraints on task.status', () => {
    const agent = storage.createAgent({ slug: 'chk-agent', provider: 'p', model: 'm' });
    expect(() => {
      storage.createTask({ agent_id: agent.id, title: 'bad status', status: 'invalid_status' });
    }).toThrow();
  });

  it('should enforce CHECK constraints on agent.status', () => {
    expect(() => {
      storage.createAgent({
        slug: 'bad-status',
        provider: 'p',
        model: 'm',
        status: 'invalid_status',
      });
    }).toThrow();
  });

  it('should create indexes', () => {
    const indexes = (storage as any).db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
      .all() as { name: string }[];
    expect(indexes.length).toBeGreaterThan(0);
  });

  it('should enable WAL mode', () => {
    expect(storage.verifyWalMode()).toBe(true);
  });
});
