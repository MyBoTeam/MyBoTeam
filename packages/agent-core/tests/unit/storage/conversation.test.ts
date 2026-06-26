import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage, NotFoundError } from '../../../src/storage/agent-storage.js';

describe('Conversation CRUD', () => {
  let storage: AgentStorage;
  let agentId: string;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
    const agent = storage.createAgent({
      slug: 'conv-agent',
      provider: 'anthropic',
      model: 'claude',
    });
    agentId = agent.id;
  });

  afterEach(() => storage.close());

  it('should create a conversation', () => {
    const c = storage.createConversation({ agent_id: agentId, title: 'chat1' });
    expect(c.id).toBeDefined();
    expect(c.title).toBe('chat1');
  });

  it('should get a conversation by id', () => {
    const created = storage.createConversation({ agent_id: agentId, title: 'get-me' });
    expect(storage.getConversation(created.id)!.id).toBe(created.id);
  });

  it('should return null for non-existent conversation', () => {
    expect(storage.getConversation('nonexistent')).toBeNull();
  });

  it('should list all conversations', () => {
    storage.createConversation({ agent_id: agentId, title: 'c1' });
    storage.createConversation({ agent_id: agentId, title: 'c2' });
    expect(storage.listConversations().length).toBe(2);
  });

  it('should list conversations by agent', () => {
    storage.createConversation({ agent_id: agentId, title: 'c1' });
    expect(storage.listConversations({ agent_id: agentId }).length).toBe(1);
  });

  it('should update conversation title', () => {
    const c = storage.createConversation({ agent_id: agentId, title: 'old' });
    const updated = storage.updateConversation(c.id, { title: 'new' });
    expect(updated.title).toBe('new');
  });

  it('should delete a conversation', () => {
    const c = storage.createConversation({ agent_id: agentId, title: 'del' });
    storage.deleteConversation(c.id);
    expect(storage.getConversation(c.id)).toBeNull();
  });

  it('should throw on delete non-existent', () => {
    expect(() => storage.deleteConversation('nonexistent')).toThrow(NotFoundError);
  });
});

describe('Message CRUD', () => {
  let storage: AgentStorage;
  let convId: string;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
    const agent = storage.createAgent({
      slug: 'msg-agent',
      provider: 'anthropic',
      model: 'claude',
    });
    const conv = storage.createConversation({ agent_id: agent.id, title: 'msg-chat' });
    convId = conv.id;
  });

  afterEach(() => storage.close());

  it('should create a message', () => {
    const m = storage.createMessage({ conversation_id: convId, role: 'user', content: 'hello' });
    expect(m.id).toBeDefined();
    expect(m.role).toBe('user');
    expect(m.content).toBe('hello');
  });

  it('should get a message by id', () => {
    const m = storage.createMessage({ conversation_id: convId, role: 'assistant', content: 'hi' });
    expect(storage.getMessage(m.id)!.id).toBe(m.id);
  });

  it('should list messages ordered by creation', () => {
    storage.createMessage({ conversation_id: convId, role: 'user', content: 'first' });
    storage.createMessage({ conversation_id: convId, role: 'assistant', content: 'second' });
    const msgs = storage.listMessages({ conversation_id: convId });
    expect(msgs.length).toBe(2);
    expect(msgs[0].content).toBe('first');
  });

  it('should delete a message', () => {
    const m = storage.createMessage({ conversation_id: convId, role: 'user', content: 'del' });
    storage.deleteMessage(m.id);
    expect(storage.getMessage(m.id)).toBeNull();
  });

  it('should cascade delete messages when conversation is deleted', () => {
    storage.createMessage({ conversation_id: convId, role: 'user', content: 'gone' });
    storage.deleteConversation(convId);
    expect(storage.listMessages({ conversation_id: convId })).toEqual([]);
  });
});
