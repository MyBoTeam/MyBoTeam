import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage } from '../../../src/storage/agent-storage.js';

describe('AgentStorage Contract', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => {
    storage.close();
  });

  it('should have all CRUD methods for agent', () => {
    expect(typeof storage.createAgent).toBe('function');
    expect(typeof storage.getAgent).toBe('function');
    expect(typeof storage.getAgentBySlug).toBe('function');
    expect(typeof storage.listAgents).toBe('function');
    expect(typeof storage.updateAgent).toBe('function');
    expect(typeof storage.deleteAgent).toBe('function');
  });

  it('should have all CRUD methods for task', () => {
    expect(typeof storage.createTask).toBe('function');
    expect(typeof storage.getTask).toBe('function');
    expect(typeof storage.listTasks).toBe('function');
    expect(typeof storage.listTasksByAgent).toBe('function');
    expect(typeof storage.updateTask).toBe('function');
    expect(typeof storage.deleteTask).toBe('function');
  });

  it('should have all CRUD methods for task_todo', () => {
    expect(typeof storage.createTaskTodo).toBe('function');
    expect(typeof storage.getTaskTodo).toBe('function');
    expect(typeof storage.listTaskTodos).toBe('function');
    expect(typeof storage.updateTaskTodo).toBe('function');
    expect(typeof storage.deleteTaskTodo).toBe('function');
  });

  it('should have all CRUD methods for conversation', () => {
    expect(typeof storage.createConversation).toBe('function');
    expect(typeof storage.getConversation).toBe('function');
    expect(typeof storage.listConversations).toBe('function');
    expect(typeof storage.updateConversation).toBe('function');
    expect(typeof storage.deleteConversation).toBe('function');
  });

  it('should have all CRUD methods for message', () => {
    expect(typeof storage.createMessage).toBe('function');
    expect(typeof storage.getMessage).toBe('function');
    expect(typeof storage.listMessages).toBe('function');
    expect(typeof storage.deleteMessage).toBe('function');
  });

  it('should have all CRUD methods for memory_entry', () => {
    expect(typeof storage.createMemoryEntry).toBe('function');
    expect(typeof storage.getMemoryEntry).toBe('function');
    expect(typeof storage.listMemoryEntries).toBe('function');
    expect(typeof storage.updateMemoryEntry).toBe('function');
    expect(typeof storage.deleteMemoryEntry).toBe('function');
  });

  it('should have all CRUD methods for mcp_server', () => {
    expect(typeof storage.createMcpServer).toBe('function');
    expect(typeof storage.getMcpServer).toBe('function');
    expect(typeof storage.getMcpServerByName).toBe('function');
    expect(typeof storage.listMcpServers).toBe('function');
    expect(typeof storage.updateMcpServer).toBe('function');
    expect(typeof storage.deleteMcpServer).toBe('function');
  });

  it('should have all CRUD methods for note', () => {
    expect(typeof storage.createNote).toBe('function');
    expect(typeof storage.getNote).toBe('function');
    expect(typeof storage.listNotes).toBe('function');
    expect(typeof storage.updateNote).toBe('function');
    expect(typeof storage.deleteNote).toBe('function');
  });

  it('should have all CRUD methods for schedule', () => {
    expect(typeof storage.createSchedule).toBe('function');
    expect(typeof storage.getSchedule).toBe('function');
    expect(typeof storage.listSchedules).toBe('function');
    expect(typeof storage.updateSchedule).toBe('function');
    expect(typeof storage.deleteSchedule).toBe('function');
  });

  it('should have all CRUD methods for document_version', () => {
    expect(typeof storage.createDocumentVersion).toBe('function');
    expect(typeof storage.getDocumentVersion).toBe('function');
    expect(typeof storage.listDocumentVersions).toBe('function');
    expect(typeof storage.deleteDocumentVersion).toBe('function');
  });

  it('should have lifecycle methods', () => {
    expect(typeof storage.close).toBe('function');
    expect(typeof storage.verifyWalMode).toBe('function');
    expect(typeof storage.validateSchema).toBe('function');
    expect(typeof storage.getDbPath).toBe('function');
  });
});
