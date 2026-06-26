import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage, NotFoundError } from '../../../src/storage/agent-storage.js';

describe('DocumentVersion CRUD', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => storage.close());

  it('should create a document version', () => {
    const d = storage.createDocumentVersion({
      file_path: '/docs/readme.md',
      content: '# v1',
      model: 'claude',
      version: 1,
    });
    expect(d.id).toBeDefined();
    expect(d.file_path).toBe('/docs/readme.md');
    expect(d.version).toBe(1);
  });

  it('should get by id', () => {
    const d = storage.createDocumentVersion({
      file_path: '/docs/test.md',
      content: 'test',
      model: 'gpt-4',
      version: 1,
    });
    expect(storage.getDocumentVersion(d.id)!.id).toBe(d.id);
  });

  it('should list versions by file path descending', () => {
    storage.createDocumentVersion({
      file_path: '/docs/v.md',
      content: 'v1',
      model: 'm1',
      version: 1,
    });
    storage.createDocumentVersion({
      file_path: '/docs/v.md',
      content: 'v2',
      model: 'm1',
      version: 2,
    });
    const versions = storage.listDocumentVersions({ file_path: '/docs/v.md' });
    expect(versions.length).toBe(2);
    expect(versions[0].version).toBe(2);
    expect(versions[1].version).toBe(1);
  });

  it('should delete a version', () => {
    const d = storage.createDocumentVersion({
      file_path: '/docs/del.md',
      content: 'del',
      model: 'm1',
      version: 1,
    });
    storage.deleteDocumentVersion(d.id);
    expect(storage.getDocumentVersion(d.id)).toBeNull();
  });

  it('should enforce unique file_path + version', () => {
    storage.createDocumentVersion({
      file_path: '/docs/u.md',
      content: 'v1',
      model: 'm1',
      version: 1,
    });
    expect(() => {
      storage.createDocumentVersion({
        file_path: '/docs/u.md',
        content: 'v1-dup',
        model: 'm1',
        version: 1,
      });
    }).toThrow();
  });
});

describe('Seed Data', () => {
  it('should seed production agents idempotently', () => {
    const storage = new AgentStorage({ mode: 'test' });
    storage.seedProductionData();
    const agents = storage.listAgents();
    expect(agents.length).toBe(2);
    expect(agents.find((a) => a.slug === 'secretary')).toBeDefined();
    expect(agents.find((a) => a.slug === 'accountant')).toBeDefined();
    storage.close();
  });

  it('should be idempotent on re-seed', () => {
    const storage = new AgentStorage({ mode: 'test' });
    storage.seedProductionData();
    storage.seedProductionData();
    expect(storage.listAgents().length).toBe(2);
    storage.close();
  });

  it('should not seed in test mode', () => {
    const storage = new AgentStorage({ mode: 'test' });
    expect(storage.listAgents().length).toBe(0);
    storage.close();
  });

  it('should create secretary with anthropic provider', () => {
    const storage = new AgentStorage({ mode: 'test' });
    storage.seedProductionData();
    const secretary = storage.getAgentBySlug('secretary');
    expect(secretary!.provider).toBe('anthropic');
    expect(secretary!.model).toBe('claude-sonnet-4-20250514');
    storage.close();
  });

  it('should create accountant with openai provider', () => {
    const storage = new AgentStorage({ mode: 'test' });
    storage.seedProductionData();
    const accountant = storage.getAgentBySlug('accountant');
    expect(accountant!.provider).toBe('openai');
    expect(accountant!.model).toBe('gpt-4o');
    storage.close();
  });
});
