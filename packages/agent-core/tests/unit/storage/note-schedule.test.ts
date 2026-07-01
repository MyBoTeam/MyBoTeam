import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage } from '../../../src/storage/agent-storage.js';

describe('Note CRUD', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => storage.close());

  it('should create a text note', () => {
    const n = storage.createNote({ title: 'my note', content: 'hello world' });
    expect(n.id).toBeDefined();
    expect(n.title).toBe('my note');
    expect(n.type).toBe('text');
    expect(n.pinned).toBe(0);
    expect(n.archived).toBe(0);
  });

  it('should create a checklist note', () => {
    const n = storage.createNote({ title: 'todos', type: 'checklist' });
    expect(n.type).toBe('checklist');
  });

  it('should create a pinned note', () => {
    const n = storage.createNote({ title: 'important', pinned: 1 });
    expect(n.pinned).toBe(1);
  });

  it('should get by id', () => {
    const n = storage.createNote({ title: 'get-me' });
    expect(storage.getNote(n.id)?.id).toBe(n.id);
  });

  it('should list with archived filter', () => {
    storage.createNote({ title: 'active1' });
    const archived = storage.createNote({ title: 'archived1' });
    storage.updateNote(archived.id, { archived: 1 });
    expect(storage.listNotes({ archived: false }).length).toBe(1);
    expect(storage.listNotes({ archived: true }).length).toBe(1);
  });

  it('should update note fields', () => {
    const n = storage.createNote({ title: 'old' });
    const updated = storage.updateNote(n.id, { title: 'new', content: 'updated content' });
    expect(updated.title).toBe('new');
    expect(updated.content).toBe('updated content');
  });

  it('should delete a note', () => {
    const n = storage.createNote({ title: 'del' });
    storage.deleteNote(n.id);
    expect(storage.getNote(n.id)).toBeNull();
  });
});

describe('Schedule CRUD', () => {
  let storage: AgentStorage;
  let agentId: string;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
    const agent = storage.createAgent({
      slug: 'sched-agent',
      provider: 'anthropic',
      model: 'claude',
    });
    agentId = agent.id;
  });

  afterEach(() => storage.close());

  it('should create a cron schedule', () => {
    const s = storage.createSchedule({
      name: 'daily',
      type: 'cron',
      expression: '0 9 * * *',
      agent_id: agentId,
    });
    expect(s.id).toBeDefined();
    expect(s.status).toBe('active');
  });

  it('should create an at schedule', () => {
    const s = storage.createSchedule({
      name: 'once',
      type: 'at',
      expression: '2026-07-01T09:00:00Z',
      agent_id: agentId,
    });
    expect(s.type).toBe('at');
  });

  it('should get by id', () => {
    const s = storage.createSchedule({
      name: 'get-me',
      type: 'every',
      expression: '1h',
      agent_id: agentId,
    });
    expect(storage.getSchedule(s.id)?.id).toBe(s.id);
  });

  it('should list all or by agent', () => {
    storage.createSchedule({ name: 's1', type: 'every', expression: '1h', agent_id: agentId });
    expect(storage.listSchedules().length).toBe(1);
    expect(storage.listSchedules({ agent_id: agentId }).length).toBe(1);
  });

  it('should update status', () => {
    const s = storage.createSchedule({
      name: 'upd',
      type: 'every',
      expression: '1h',
      agent_id: agentId,
    });
    const updated = storage.updateSchedule(s.id, { status: 'paused' });
    expect(updated.status).toBe('paused');
  });

  it('should delete a schedule', () => {
    const s = storage.createSchedule({
      name: 'del',
      type: 'every',
      expression: '1h',
      agent_id: agentId,
    });
    storage.deleteSchedule(s.id);
    expect(storage.getSchedule(s.id)).toBeNull();
  });
});
