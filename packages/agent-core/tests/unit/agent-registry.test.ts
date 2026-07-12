import type { AgentStatus } from '@myboteam/types';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentRegistry } from '../../src/agent-registry.js';

const validConfig = {
  name: 'test-agent',
  model: 'gpt-4',
  provider: 'openai',
  role: 'worker',
  description: 'A test agent',
  secrets: ['secret1'],
  skills: ['skill1'],
  mcps: ['mcp1'],
};

describe('AgentRegistry', () => {
  let db: Database.Database;
  let registry: AgentRegistry;

  beforeEach(() => {
    db = new Database(':memory:');
    registry = new AgentRegistry(db);
    registry.ensureTable();
  });

  afterEach(() => {
    db.close();
  });

  describe('register()', () => {
    it('should create and return a config with auto-generated UUID', () => {
      const result = registry.register(validConfig);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.name).toBe(validConfig.name);
      expect(result.model).toBe(validConfig.model);
      expect(result.provider).toBe(validConfig.provider);
      expect(result.role).toBe(validConfig.role);
      expect(result.description).toBe(validConfig.description);
      expect(result.secrets).toEqual(validConfig.secrets);
      expect(result.skills).toEqual(validConfig.skills);
      expect(result.mcps).toEqual(validConfig.mcps);
    });

    it('should reject duplicate names', () => {
      registry.register(validConfig);

      expect(() => {
        registry.register({ ...validConfig, name: validConfig.name });
      }).toThrow();
    });

    it('should enforce capacity limit (20 agents)', () => {
      for (let i = 0; i < 20; i++) {
        registry.register({ ...validConfig, name: `agent-${i}` });
      }

      expect(() => {
        registry.register({ ...validConfig, name: 'agent-20' });
      }).toThrow();
    });

    it('should reject config with invalid fields', () => {
      expect(() => {
        registry.register({ ...validConfig, name: '' });
      }).toThrow();
    });

    it('should accept config with optional fields undefined', () => {
      const config = { name: 'minimal', model: 'gpt-4', provider: 'openai' };
      const result = registry.register(config);

      expect(result).toBeDefined();
      expect(result.name).toBe('minimal');
    });
  });

  describe('list()', () => {
    it('should return all registered configs', () => {
      registry.register({ ...validConfig, name: 'agent-a' });
      registry.register({ ...validConfig, name: 'agent-b' });

      const result = registry.list();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('agent-a');
      expect(result[1].name).toBe('agent-b');
    });

    it('should return empty array when no agents registered', () => {
      const result = registry.list();
      expect(result).toHaveLength(0);
    });
  });

  describe('getById()', () => {
    it('should return correct config by ID', () => {
      const created = registry.register(validConfig);
      const retrieved = registry.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(validConfig.name);
    });

    it('should return null for non-existent ID', () => {
      const result = registry.getById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('update()', () => {
    it('should modify specified fields', () => {
      const created = registry.register(validConfig);

      const updated = registry.update(created.id, {
        name: 'updated-agent',
        description: 'Updated description',
      });

      expect(updated.name).toBe('updated-agent');
      expect(updated.description).toBe('Updated description');
      expect(updated.model).toBe(validConfig.model);
    });

    it('should throw for non-existent ID', () => {
      expect(() => {
        registry.update('non-existent-id', { name: 'new-name' });
      }).toThrow();
    });

    it('should reject invalid model (empty string)', () => {
      const created = registry.register(validConfig);

      expect(() => {
        registry.update(created.id, { model: '' });
      }).toThrow();
    });

    it('should preserve original config after failed update', () => {
      const created = registry.register(validConfig);

      try {
        registry.update(created.id, { model: '' });
      } catch {
        // expected
      }

      const retrieved = registry.getById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.model).toBe(validConfig.model);
      expect(retrieved?.name).toBe(validConfig.name);
    });

    it('should apply valid update correctly', () => {
      const created = registry.register(validConfig);

      const updated = registry.update(created.id, {
        model: 'claude-3-opus',
        provider: 'anthropic',
      });

      expect(updated.model).toBe('claude-3-opus');
      expect(updated.provider).toBe('anthropic');
      expect(updated.name).toBe(validConfig.name);
    });

    it('should preserve unchanged fields after partial update', () => {
      const created = registry.register(validConfig);

      const updated = registry.update(created.id, { description: 'Only description changed' });

      expect(updated.description).toBe('Only description changed');
      expect(updated.name).toBe(validConfig.name);
      expect(updated.model).toBe(validConfig.model);
      expect(updated.provider).toBe(validConfig.provider);
      expect(updated.role).toBe(validConfig.role);
      expect(updated.secrets).toEqual(validConfig.secrets);
      expect(updated.skills).toEqual(validConfig.skills);
      expect(updated.mcps).toEqual(validConfig.mcps);
    });
  });

  describe('delete()', () => {
    it('should remove config', () => {
      const created = registry.register(validConfig);

      registry.delete(created.id);

      const result = registry.getById(created.id);
      expect(result).toBeNull();
    });

    it('should throw for non-existent ID', () => {
      expect(() => {
        registry.delete('non-existent-id');
      }).toThrow();
    });

    it('should allow re-registration after deletion', () => {
      const created = registry.register(validConfig);
      registry.delete(created.id);

      const newConfig = registry.register(validConfig);
      expect(newConfig).toBeDefined();
      expect(newConfig.id).not.toBe(created.id);
    });
  });

  describe('status transitions', () => {
    it('should start with idle status', () => {
      const created = registry.register(validConfig);

      expect(registry.getStatus(created.id)).toBe('idle');
    });

    it.each([
      ['idle', 'materialized'],
      ['materialized', 'starting'],
      ['starting', 'running'],
      ['running', 'stopped'],
      ['running', 'error'],
      ['error', 'idle'],
    ] as const)('should allow %s → %s', (from, to) => {
      const created = registry.register(validConfig);

      // Hardcoded paths to each state
      const paths: Record<string, AgentStatus[]> = {
        idle: [],
        materialized: ['materialized'],
        starting: ['materialized', 'starting'],
        running: ['materialized', 'starting', 'running'],
        stopped: ['materialized', 'starting', 'running', 'stopped'],
        error: ['materialized', 'starting', 'running', 'error'],
      };

      // Apply path to reach 'from'
      const agentId = created.id;
      for (const status of paths[from]) {
        registry.setStatus(agentId, status);
      }
      expect(registry.getStatus(agentId)).toBe(from);

      // Now perform the transition under test
      registry.setStatus(agentId, to);
      expect(registry.getStatus(agentId)).toBe(to);
    });

    it.each([
      ['idle', 'running'],
      ['idle', 'stopped'],
      ['idle', 'error'],
      ['idle', 'starting'],
      ['materialized', 'idle'],
      ['materialized', 'running'],
      ['materialized', 'stopped'],
      ['materialized', 'error'],
      ['starting', 'idle'],
      ['starting', 'materialized'],
      ['starting', 'stopped'],
      ['starting', 'error'],
      ['running', 'idle'],
      ['running', 'materialized'],
      ['running', 'starting'],
      ['stopped', 'idle'],
      ['stopped', 'materialized'],
      ['stopped', 'starting'],
      ['stopped', 'running'],
      ['stopped', 'error'],
      ['error', 'materialized'],
      ['error', 'starting'],
      ['error', 'running'],
      ['error', 'stopped'],
    ] as const)('should reject %s → %s', (from, to) => {
      const created = registry.register(validConfig);

      // Hardcoded paths to each state
      const paths: Record<string, AgentStatus[]> = {
        idle: [],
        materialized: ['materialized'],
        starting: ['materialized', 'starting'],
        running: ['materialized', 'starting', 'running'],
        stopped: ['materialized', 'starting', 'running', 'stopped'],
        error: ['materialized', 'starting', 'running', 'error'],
      };

      // Apply path to reach 'from'
      const agentId = created.id;
      for (const status of paths[from]) {
        registry.setStatus(agentId, status);
      }
      expect(registry.getStatus(agentId)).toBe(from);

      // Attempt invalid transition
      expect(() => {
        registry.setStatus(agentId, to);
      }).toThrow();
    });

    it('should update status in SQLite after valid transition', () => {
      const created = registry.register(validConfig);

      registry.setStatus(created.id, 'materialized');

      const row = db.prepare('SELECT status FROM agent_registry WHERE id = ?').get(created.id) as {
        status: string;
      };
      expect(row.status).toBe('materialized');
    });

    it('should preserve original status on invalid transition', () => {
      const created = registry.register(validConfig);

      registry.setStatus(created.id, 'materialized');
      expect(() => {
        registry.setStatus(created.id, 'running');
      }).toThrow();

      expect(registry.getStatus(created.id)).toBe('materialized');
    });

    it('should throw when setting status on non-existent agent', () => {
      expect(() => {
        registry.setStatus('non-existent-id', 'running');
      }).toThrow();
    });

    it('should throw for invalid status value', () => {
      const created = registry.register(validConfig);

      expect(() => {
        registry.setStatus(created.id, 'invalid-status' as AgentStatus);
      }).toThrow();
    });
  });
});
