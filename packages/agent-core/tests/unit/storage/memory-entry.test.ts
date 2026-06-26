import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage, NotFoundError } from '../../../src/storage/agent-storage.js';

describe('MemoryEntry CRUD', () => {
  let storage: AgentStorage;
  let agentId: string;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
    const agent = storage.createAgent({
      slug: 'mem-agent',
      provider: 'anthropic',
      model: 'claude',
    });
    agentId = agent.id;
  });

  afterEach(() => storage.close());

  it('should create a memory entry', () => {
    const m = storage.createMemoryEntry({
      agent_id: agentId,
      category: 'fact',
      content: 'user likes blue',
    });
    expect(m.id).toBeDefined();
    expect(m.category).toBe('fact');
    expect(m.confidence).toBe(1.0);
    expect(m.source).toBe('manual');
  });

  it('should create with custom confidence and source', () => {
    const m = storage.createMemoryEntry({
      agent_id: agentId,
      category: 'pattern',
      content: 'pattern detected',
      confidence: 0.8,
      source: 'conversation',
    });
    expect(m.confidence).toBe(0.8);
    expect(m.source).toBe('conversation');
  });

  it('should get by id', () => {
    const m = storage.createMemoryEntry({ agent_id: agentId, category: 'fact', content: 'test' });
    expect(storage.getMemoryEntry(m.id)!.id).toBe(m.id);
  });

  it('should list with filters', () => {
    storage.createMemoryEntry({ agent_id: agentId, category: 'fact', content: 'f1' });
    storage.createMemoryEntry({ agent_id: agentId, category: 'preference', content: 'p1' });
    storage.createMemoryEntry({ agent_id: agentId, category: 'fact', content: 'f2' });
    expect(storage.listMemoryEntries({ category: 'fact' }).length).toBe(2);
    expect(storage.listMemoryEntries({ agent_id: agentId, category: 'preference' }).length).toBe(1);
  });

  it('should update content', () => {
    const m = storage.createMemoryEntry({ agent_id: agentId, category: 'fact', content: 'old' });
    const updated = storage.updateMemoryEntry(m.id, { content: 'new' });
    expect(updated.content).toBe('new');
  });

  it('should delete an entry', () => {
    const m = storage.createMemoryEntry({ agent_id: agentId, category: 'fact', content: 'del' });
    storage.deleteMemoryEntry(m.id);
    expect(storage.getMemoryEntry(m.id)).toBeNull();
  });

  it('should throw on delete non-existent', () => {
    expect(() => storage.deleteMemoryEntry('nonexistent')).toThrow(NotFoundError);
  });
});
