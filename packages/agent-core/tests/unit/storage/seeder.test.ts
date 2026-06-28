import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage } from '../../../src/storage/agent-storage.js';

describe('Seeder', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => {
    storage.close();
  });

  describe('seedProductionData', () => {
    it('should seed secretary agent with anthropic provider', () => {
      storage.seedProductionData();
      const secretary = storage.getAgentBySlug('secretary');
      expect(secretary).not.toBeNull();
      expect(secretary?.provider).toBe('anthropic');
      expect(secretary?.model).toBe('claude-sonnet-4-20250514');
    });

    it('should seed accountant agent with openai provider', () => {
      storage.seedProductionData();
      const accountant = storage.getAgentBySlug('accountant');
      expect(accountant).not.toBeNull();
      expect(accountant?.provider).toBe('openai');
      expect(accountant?.model).toBe('gpt-4o');
    });

    it('should create exactly 2 agents', () => {
      storage.seedProductionData();
      const agents = storage.listAgents();
      expect(agents.length).toBe(2);
    });

    it('should be idempotent — calling twice does not duplicate', () => {
      storage.seedProductionData();
      storage.seedProductionData();
      expect(storage.listAgents().length).toBe(2);
    });

    it('should not overwrite existing agents with same slug', () => {
      storage.createAgent({ slug: 'secretary', provider: 'custom', model: 'custom-model' });
      storage.seedProductionData();
      const secretary = storage.getAgentBySlug('secretary');
      expect(secretary?.provider).toBe('custom');
    });
  });

  describe('seedTest', () => {
    it('should seed dev agents', () => {
      storage.seedProductionData(); // seedTest calls seedDevAgents which also seeds secretary/accountant
      const agents = storage.listAgents();
      expect(agents.length).toBeGreaterThanOrEqual(2);
    });

    it('should be idempotent', () => {
      storage.seedProductionData();
      storage.seedProductionData();
      expect(storage.listAgents().length).toBe(2);
    });
  });
});
