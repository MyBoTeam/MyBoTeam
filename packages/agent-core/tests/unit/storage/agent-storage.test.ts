import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AgentStorage,
  NotFoundError,
  ValidationError,
} from '../../../src/storage/agent-storage.js';

describe('AgentStorage Schema Validation', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => {
    storage.close();
  });

  it('should create all 11 tables', () => {
    const missing = storage.validateSchema();
    expect(missing).toEqual([]);
  });

  it('should initialize idempotently', () => {
    const missing1 = storage.validateSchema();
    expect(missing1).toEqual([]);
  });

  it('should set WAL pragma for file databases', () => {
    expect(storage.verifyWalMode()).toBe(true);
  });
});

describe('Agent CRUD', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => {
    storage.close();
  });

  it('should create an agent with generated UUID and slug', () => {
    const agent = storage.createAgent({
      slug: 'secretary',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    });

    expect(agent.id).toBeDefined();
    expect(agent.slug).toBe('secretary');
    expect(agent.provider).toBe('anthropic');
    expect(agent.model).toBe('claude-sonnet-4-20250514');
    expect(agent.status).toBe('active');
    expect(agent.created_at).toBeDefined();
    expect(agent.updated_at).toBeDefined();
  });

  it('should get an agent by UUID', () => {
    const created = storage.createAgent({
      slug: 'accountant',
      provider: 'openai',
      model: 'gpt-4',
    });

    const retrieved = storage.getAgent(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.slug).toBe('accountant');
  });

  it('should get an agent by slug', () => {
    storage.createAgent({
      slug: 'secretary',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    });
    const retrieved = storage.getAgentBySlug('secretary');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.slug).toBe('secretary');
  });

  it('should return null for non-existent agent', () => {
    const retrieved = storage.getAgent('nonexistent');
    expect(retrieved).toBeNull();
  });

  it('should list all agents', () => {
    storage.createAgent({ slug: 'a1', provider: 'p1', model: 'm1' });
    storage.createAgent({ slug: 'a2', provider: 'p2', model: 'm2' });
    const agents = storage.listAgents();
    expect(agents.length).toBe(2);
  });

  it('should update an agent model', () => {
    const agent = storage.createAgent({ slug: 'test', provider: 'anthropic', model: 'old-model' });
    const updated = storage.updateAgent(agent.id, { model: 'new-model' });
    expect(updated.model).toBe('new-model');
    expect(updated.updated_at).toBeDefined();
    expect(updated.id).toBe(agent.id);
  });

  it('should throw NotFoundError when updating non-existent agent', () => {
    expect(() => storage.updateAgent('nonexistent', { model: 'test' })).toThrow(NotFoundError);
  });

  it('should delete an agent', () => {
    const agent = storage.createAgent({ slug: 'delete-me', provider: 'p1', model: 'm1' });
    storage.deleteAgent(agent.id);
    expect(storage.getAgent(agent.id)).toBeNull();
  });

  it('should throw NotFoundError when deleting non-existent agent', () => {
    expect(() => storage.deleteAgent('nonexistent')).toThrow(NotFoundError);
  });

  it('should throw ValidationError when deleting agent with active tasks', () => {
    const agent = storage.createAgent({ slug: 'busy', provider: 'p1', model: 'm1' });
    storage.createTask({ agent_id: agent.id, title: 'active task', status: 'running' });
    expect(() => storage.deleteAgent(agent.id)).toThrow(ValidationError);
  });

  it('should allow deleting agent with completed tasks', () => {
    const agent = storage.createAgent({ slug: 'done', provider: 'p1', model: 'm1' });
    storage.createTask({ agent_id: agent.id, title: 'completed task', status: 'completed' });
    expect(() => storage.deleteAgent(agent.id)).not.toThrow();
  });
});
