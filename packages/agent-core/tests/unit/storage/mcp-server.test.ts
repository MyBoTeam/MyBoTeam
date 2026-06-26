import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage, NotFoundError } from '../../../src/storage/agent-storage.js';

describe('McpServer CRUD', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => storage.close());

  it('should create an mcp server', () => {
    const s = storage.createMcpServer({
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem'],
    });
    expect(s.id).toBeDefined();
    expect(s.name).toBe('filesystem');
    expect(Array.isArray(s.args)).toBe(true);
    expect(typeof s.env).toBe('object');
  });

  it('should get by id and name', () => {
    const s = storage.createMcpServer({
      name: 'test-server',
      command: 'node',
      args: ['server.js'],
    });
    expect(storage.getMcpServer(s.id)!.name).toBe('test-server');
    expect(storage.getMcpServerByName('test-server')!.id).toBe(s.id);
  });

  it('should get null for non-existent', () => {
    expect(storage.getMcpServer('nonexistent')).toBeNull();
    expect(storage.getMcpServerByName('nonexistent')).toBeNull();
  });

  it('should list all servers', () => {
    storage.createMcpServer({ name: 's1', command: 'cmd1' });
    storage.createMcpServer({ name: 's2', command: 'cmd2' });
    expect(storage.listMcpServers().length).toBe(2);
  });

  it('should update server status', () => {
    const s = storage.createMcpServer({ name: 'upd', command: 'cmd' });
    const updated = storage.updateMcpServer(s.id, { status: 'error' });
    expect(updated.status).toBe('error');
  });

  it('should delete a server', () => {
    const s = storage.createMcpServer({ name: 'del', command: 'cmd' });
    storage.deleteMcpServer(s.id);
    expect(storage.getMcpServer(s.id)).toBeNull();
  });
});

describe('AgentMcpAssignment CRUD', () => {
  let storage: AgentStorage;
  let agentId: string;
  let serverId: string;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
    const agent = storage.createAgent({
      slug: 'mcp-agent',
      provider: 'anthropic',
      model: 'claude',
    });
    agentId = agent.id;
    const server = storage.createMcpServer({ name: 'assigned-server', command: 'cmd' });
    serverId = server.id;
  });

  afterEach(() => storage.close());

  it('should assign a server to an agent', () => {
    const a = storage.assignMcpServer(agentId, serverId);
    expect(a.agent_id).toBe(agentId);
    expect(a.mcp_server_id).toBe(serverId);
    expect(a.assigned_at).toBeDefined();
  });

  it('should list assignments for an agent', () => {
    storage.assignMcpServer(agentId, serverId);
    const list = storage.listAgentMcpAssignments(agentId);
    expect(list.length).toBe(1);
    expect(list[0].mcp_server_id).toBe(serverId);
  });

  it('should list assignments for a server', () => {
    storage.assignMcpServer(agentId, serverId);
    const list = storage.listMcpServerAssignments(serverId);
    expect(list.length).toBe(1);
    expect(list[0].agent_id).toBe(agentId);
  });

  it('should unassign a server', () => {
    storage.assignMcpServer(agentId, serverId);
    storage.unassignMcpServer(agentId, serverId);
    expect(storage.listAgentMcpAssignments(agentId).length).toBe(0);
  });

  it('should cascade delete when agent is deleted', () => {
    storage.assignMcpServer(agentId, serverId);
    storage.deleteAgent(agentId);
    expect(storage.listMcpServerAssignments(serverId).length).toBe(0);
  });
});
