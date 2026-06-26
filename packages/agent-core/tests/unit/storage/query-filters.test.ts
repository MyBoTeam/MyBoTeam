import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage } from '../../../src/storage/agent-storage.js';

describe('Query Filters', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => {
    storage.close();
  });

  it('should filter tasks by agent_id', () => {
    const agent1 = storage.createAgent({ slug: 'agent-a', provider: 'p', model: 'm' });
    const agent2 = storage.createAgent({ slug: 'agent-b', provider: 'p', model: 'm' });
    storage.createTask({ agent_id: agent1.id, title: 'task-a1' });
    storage.createTask({ agent_id: agent1.id, title: 'task-a2' });
    storage.createTask({ agent_id: agent2.id, title: 'task-b1' });

    const tasks = storage.listTasks({ agent_id: agent1.id });
    expect(tasks.length).toBe(2);
    expect(tasks.every((t) => t.agent_id === agent1.id)).toBe(true);
  });

  it('should filter tasks by status', () => {
    const agent = storage.createAgent({ slug: 'status-agent', provider: 'p', model: 'm' });
    storage.createTask({ agent_id: agent.id, title: 'running', status: 'running' });
    storage.createTask({ agent_id: agent.id, title: 'completed', status: 'completed' });
    storage.createTask({ agent_id: agent.id, title: 'pending', status: 'pending' });

    const running = storage.listTasks({ status: 'running' });
    expect(running.length).toBe(1);
    expect(running[0].status).toBe('running');
  });

  it('should filter memory entries by agent_id and category', () => {
    const agent1 = storage.createAgent({ slug: 'mem-a', provider: 'p', model: 'm' });
    const agent2 = storage.createAgent({ slug: 'mem-b', provider: 'p', model: 'm' });
    storage.createMemoryEntry({ agent_id: agent1.id, category: 'preference', content: 'c1' });
    storage.createMemoryEntry({ agent_id: agent1.id, category: 'fact', content: 'f1' });
    storage.createMemoryEntry({ agent_id: agent2.id, category: 'preference', content: 'c2' });

    const agent1Prefs = storage.listMemoryEntries({ agent_id: agent1.id, category: 'preference' });
    expect(agent1Prefs.length).toBe(1);
    expect(agent1Prefs[0].content).toBe('c1');

    const allAgent1 = storage.listMemoryEntries({ agent_id: agent1.id });
    expect(allAgent1.length).toBe(2);
  });

  it('should filter conversations by agent_id', () => {
    const agent1 = storage.createAgent({ slug: 'conv-a', provider: 'p', model: 'm' });
    const agent2 = storage.createAgent({ slug: 'conv-b', provider: 'p', model: 'm' });
    storage.createConversation({ agent_id: agent1.id, title: 'c1' });
    storage.createConversation({ agent_id: agent1.id, title: 'c2' });
    storage.createConversation({ agent_id: agent2.id, title: 'c3' });

    const convs = storage.listConversations({ agent_id: agent1.id });
    expect(convs.length).toBe(2);
  });

  it('should filter messages by conversation_id', () => {
    const agent = storage.createAgent({ slug: 'msg-agent', provider: 'p', model: 'm' });
    const conv1 = storage.createConversation({ agent_id: agent.id, title: 'conv1' });
    const conv2 = storage.createConversation({ agent_id: agent.id, title: 'conv2' });
    storage.createMessage({ conversation_id: conv1.id, role: 'user', content: 'hello' });
    storage.createMessage({ conversation_id: conv1.id, role: 'assistant', content: 'hi' });
    storage.createMessage({ conversation_id: conv2.id, role: 'user', content: 'hey' });

    const msgs = storage.listMessages({ conversation_id: conv1.id });
    expect(msgs.length).toBe(2);
  });

  it('should filter notes by archived', () => {
    const activeNote = storage.createNote({ title: 'active' });
    const archivedNote = storage.createNote({ title: 'archived' });
    storage.updateNote(archivedNote.id, { archived: 1 });

    const active = storage.listNotes({ archived: false });
    expect(active.length).toBe(1);
    expect(active[0].title).toBe('active');

    const archived = storage.listNotes({ archived: true });
    expect(archived.length).toBe(1);
    expect(archived[0].title).toBe('archived');
  });

  it('should filter schedules by agent_id', () => {
    const agent1 = storage.createAgent({ slug: 'sched-a', provider: 'p', model: 'm' });
    const agent2 = storage.createAgent({ slug: 'sched-b', provider: 'p', model: 'm' });
    storage.createSchedule({
      name: 's1',
      type: 'cron',
      expression: '0 * * * *',
      agent_id: agent1.id,
    });
    storage.createSchedule({
      name: 's2',
      type: 'cron',
      expression: '0 * * * *',
      agent_id: agent2.id,
    });

    const scheds = storage.listSchedules({ agent_id: agent1.id });
    expect(scheds.length).toBe(1);
    expect(scheds[0].name).toBe('s1');
  });

  it('should filter document versions by file_path', () => {
    storage.createDocumentVersion({ file_path: '/a.ts', content: 'a', model: 'm', version: 1 });
    storage.createDocumentVersion({ file_path: '/a.ts', content: 'a2', model: 'm', version: 2 });
    storage.createDocumentVersion({ file_path: '/b.ts', content: 'b', model: 'm', version: 1 });

    const aVersions = storage.listDocumentVersions({ file_path: '/a.ts' });
    expect(aVersions.length).toBe(2);
  });
});
