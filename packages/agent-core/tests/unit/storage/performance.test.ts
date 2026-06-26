/**
 * Performance benchmarks for AgentStorage
 *
 * SC-001: Database initialization <500ms
 * SC-002: Individual CRUD operations <100ms
 */

import { describe, expect, it } from 'vitest';
import { AgentStorage } from '../../../src/storage/agent-storage';

describe('Performance Benchmarks', () => {
  describe('SC-001: Database initialization', () => {
    it('should initialize in <500ms', () => {
      const start = performance.now();
      const storage = new AgentStorage({ mode: 'test' });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
      storage.close();
    });

    it('should initialize with WAL mode in <500ms', () => {
      const start = performance.now();
      const storage = new AgentStorage({ mode: 'test' });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
      storage.close();
    });
  });

  describe('SC-002: CRUD operations', () => {
    let storage: AgentStorage;

    beforeEach(() => {
      storage = new AgentStorage({ mode: 'test' });
    });

    afterEach(() => {
      storage.close();
    });

    it('should create agent in <100ms', () => {
      const start = performance.now();
      storage.createAgent({
        slug: 'perf-agent',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should create task in <100ms', () => {
      const agent = storage.createAgent({
        slug: 'perf-agent',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });

      const start = performance.now();
      storage.createTask({
        agent_id: agent.id,
        title: 'Performance test task',
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should create note in <100ms', () => {
      const agent = storage.createAgent({
        slug: 'perf-agent',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });

      const start = performance.now();
      storage.createNote({
        title: 'Performance test note',
        type: 'checklist',
        content: 'Performance test content',
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should create conversation in <100ms', () => {
      const agent = storage.createAgent({
        slug: 'perf-agent',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });

      const start = performance.now();
      storage.createConversation({
        agent_id: agent.id,
        title: 'Performance test conversation',
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should create memory entry in <100ms', () => {
      const agent = storage.createAgent({
        slug: 'perf-agent',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });

      const start = performance.now();
      storage.createMemoryEntry({
        agent_id: agent.id,
        category: 'preference',
        content: 'Performance test memory',
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should create mcp_server in <100ms', () => {
      const start = performance.now();
      storage.createMcpServer({
        name: 'perf-mcp',
        command: 'node',
        args: ['server.js'],
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should create schedule in <100ms', () => {
      const agent = storage.createAgent({
        slug: 'perf-agent',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });

      const start = performance.now();
      storage.createSchedule({
        name: 'perf-schedule',
        type: 'cron',
        expression: '0 9 * * *',
        agent_id: agent.id,
        status: 'active',
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should create document_version in <100ms', () => {
      const agent = storage.createAgent({
        slug: 'perf-agent',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });

      const start = performance.now();
      storage.createDocumentVersion({
        file_path: '/docs/perf.md',
        content: 'Performance test content',
        model: 'gpt-4',
        version: 1,
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should update agent in <100ms', () => {
      const agent = storage.createAgent({
        slug: 'perf-agent',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });

      const start = performance.now();
      storage.updateAgent(agent.id, { status: 'inactive' });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should update task in <100ms', () => {
      const agent = storage.createAgent({
        slug: 'perf-agent',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });
      const task = storage.createTask({
        agent_id: agent.id,
        title: 'Performance test task',
      });

      const start = performance.now();
      storage.updateTask(task.id, { status: 'running' });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should list agents in <100ms', () => {
      storage.createAgent({
        slug: 'perf-agent-1',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });
      storage.createAgent({
        slug: 'perf-agent-2',
        provider: 'openai',
        model: 'gpt-4',
        status: 'active',
      });

      const start = performance.now();
      storage.listAgents();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should list tasks in <100ms', () => {
      const agent = storage.createAgent({
        slug: 'perf-agent',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'active',
      });

      for (let i = 0; i < 100; i++) {
        storage.createTask({
          agent_id: agent.id,
          title: `Task ${i}`,
        });
      }

      const start = performance.now();
      storage.listTasks({ agent_id: agent.id });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
