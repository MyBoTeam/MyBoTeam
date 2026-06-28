import type {
  Agent,
  AgentMcpAssignment,
  Conversation,
  ConversationFilters,
  DocumentVersion,
  DocumentVersionFilters,
  McpServer,
  MemoryEntry,
  MemoryEntryFilters,
  Message,
  MessageFilters,
  Note,
  NoteFilters,
  Schedule,
  ScheduleFilters,
  Task,
  TaskFilters,
  TaskTodo,
} from '@myboteam/types';
import type Database from 'better-sqlite3';
import * as agentCrud from './crud/agent.js';
import * as conversationCrud from './crud/conversation.js';
import * as documentVersionCrud from './crud/document-version.js';
import * as mcpCrud from './crud/mcp.js';
import * as memoryCrud from './crud/memory.js';
import * as noteCrud from './crud/note.js';
import * as scheduleCrud from './crud/schedule.js';
import * as taskCrud from './crud/task.js';
import { closeDatabase, initializeDatabase, verifyWalMode } from './database.js';
import { DatabaseError, NotFoundError, ValidationError } from './errors.js';
import { createChildLogger, logOperation } from './logger.js';
import { migrations } from './migrations/index.js';
import { runMigrations } from './runner.js';
import { seedProduction } from './seeder.js';

export interface AgentStorageConfig {
  dataDir?: string;
  mode?: 'production' | 'development' | 'test';
}

export type {
  Agent,
  AgentMcpAssignment,
  Conversation,
  ConversationFilters,
  DocumentVersion,
  DocumentVersionFilters,
  McpServer,
  MemoryEntry,
  MemoryEntryFilters,
  Message,
  MessageFilters,
  Note,
  NoteFilters,
  Schedule,
  ScheduleFilters,
  Task,
  TaskFilters,
  TaskTodo,
};
export { DatabaseError, NotFoundError, ValidationError };

export class AgentStorage {
  private db: Database.Database;
  private config: AgentStorageConfig;
  private log: ReturnType<typeof createChildLogger>;

  constructor(config: AgentStorageConfig = {}) {
    this.config = { mode: 'production', ...config };
    this.db = initializeDatabase({ dataDir: this.config.dataDir, mode: this.config.mode! });
    this.log = createChildLogger({ module: 'agent-storage' });
    logOperation(
      this.log,
      'constructor',
      () => {
        runMigrations(this.db, migrations, this.log);
        if (this.config.mode !== 'test') {
          seedProduction(this.db, this.log);
        }
      },
      { mode: this.config.mode },
    );
  }

  getDbPath(): string {
    if (this.config.mode === 'test') return ':memory:';
    return (this.db as any).name ?? 'unknown';
  }

  verifyWalMode(): boolean {
    return logOperation(this.log, 'verifyWalMode', () => {
      if (this.config.mode === 'test') return true;
      return verifyWalMode(this.db);
    });
  }

  validateSchema(): string[] {
    return logOperation(this.log, 'validateSchema', () => {
      const expected = [
        'agent',
        'task',
        'task_todo',
        'conversation',
        'message',
        'memory_entry',
        'mcp_server',
        'agent_mcp_assignment',
        'note',
        'schedule',
        'document_version',
      ];
      const existing = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_migrations' AND name NOT LIKE 'sqlite_%'",
        )
        .all() as { name: string }[];
      const set = new Set(existing.map((r) => r.name));
      return expected.filter((t) => !set.has(t));
    });
  }

  createAgent(data: { slug: string; provider: string; model: string; status?: string }): Agent {
    return agentCrud.createAgent(this.db, this.log, data);
  }
  getAgent(id: string): Agent | null {
    return agentCrud.getAgent(this.db, this.log, id);
  }
  getAgentBySlug(slug: string): Agent | null {
    return agentCrud.getAgentBySlug(this.db, this.log, slug);
  }
  listAgents(): Agent[] {
    return agentCrud.listAgents(this.db, this.log);
  }
  updateAgent(id: string, data: Partial<Omit<Agent, 'id' | 'created_at'>>): Agent {
    return agentCrud.updateAgent(this.db, this.log, id, data);
  }
  deleteAgent(id: string): void {
    agentCrud.deleteAgent(this.db, this.log, id);
  }

  createTask(data: { agent_id: string; title: string; status?: string }): Task {
    return taskCrud.createTask(this.db, this.log, data);
  }
  getTask(id: string): Task | null {
    return taskCrud.getTask(this.db, this.log, id);
  }
  listTasks(filters?: TaskFilters): Task[] {
    return taskCrud.listTasks(this.db, this.log, filters);
  }
  listTasksByAgent(agentId: string): Task[] {
    return taskCrud.listTasksByAgent(this.db, this.log, agentId);
  }
  updateTask(id: string, data: Partial<Omit<Task, 'id' | 'created_at'>>): Task {
    return taskCrud.updateTask(this.db, this.log, id, data);
  }
  deleteTask(id: string): void {
    taskCrud.deleteTask(this.db, this.log, id);
  }

  createTaskTodo(data: { task_id: string; description: string }): TaskTodo {
    return taskCrud.createTaskTodo(this.db, this.log, data);
  }
  getTaskTodo(id: string): TaskTodo | null {
    return taskCrud.getTaskTodo(this.db, this.log, id);
  }
  listTaskTodos(taskId: string): TaskTodo[] {
    return taskCrud.listTaskTodos(this.db, this.log, taskId);
  }
  updateTaskTodo(id: string, data: { is_completed?: number }): TaskTodo {
    return taskCrud.updateTaskTodo(this.db, this.log, id, data);
  }
  deleteTaskTodo(id: string): void {
    taskCrud.deleteTaskTodo(this.db, this.log, id);
  }

  createConversation(data: { agent_id: string; title: string }): Conversation {
    return conversationCrud.createConversation(this.db, this.log, data);
  }
  getConversation(id: string): Conversation | null {
    return conversationCrud.getConversation(this.db, this.log, id);
  }
  listConversations(filters?: ConversationFilters): Conversation[] {
    return conversationCrud.listConversations(this.db, this.log, filters);
  }
  updateConversation(id: string, data: { title?: string }): Conversation {
    return conversationCrud.updateConversation(this.db, this.log, id, data);
  }
  deleteConversation(id: string): void {
    conversationCrud.deleteConversation(this.db, this.log, id);
  }

  createMessage(data: { conversation_id: string; role: string; content: string }): Message {
    return conversationCrud.createMessage(this.db, this.log, data);
  }
  getMessage(id: string): Message | null {
    return conversationCrud.getMessage(this.db, this.log, id);
  }
  listMessages(filters: MessageFilters): Message[] {
    return conversationCrud.listMessages(this.db, this.log, filters);
  }
  deleteMessage(id: string): void {
    conversationCrud.deleteMessage(this.db, this.log, id);
  }

  createMemoryEntry(data: {
    agent_id: string;
    category: string;
    content: string;
    confidence?: number;
    source?: string;
  }): MemoryEntry {
    return memoryCrud.createMemoryEntry(this.db, this.log, data);
  }
  getMemoryEntry(id: string): MemoryEntry | null {
    return memoryCrud.getMemoryEntry(this.db, this.log, id);
  }
  listMemoryEntries(filters?: MemoryEntryFilters): MemoryEntry[] {
    return memoryCrud.listMemoryEntries(this.db, this.log, filters);
  }
  updateMemoryEntry(
    id: string,
    data: { content?: string; confidence?: number; category?: string },
  ): MemoryEntry {
    return memoryCrud.updateMemoryEntry(this.db, this.log, id, data);
  }
  deleteMemoryEntry(id: string): void {
    memoryCrud.deleteMemoryEntry(this.db, this.log, id);
  }

  createMcpServer(data: {
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
    status?: string;
  }): McpServer {
    return mcpCrud.createMcpServer(this.db, this.log, data);
  }
  getMcpServer(id: string): McpServer | null {
    return mcpCrud.getMcpServer(this.db, this.log, id);
  }
  getMcpServerByName(name: string): McpServer | null {
    return mcpCrud.getMcpServerByName(this.db, this.log, name);
  }
  listMcpServers(): McpServer[] {
    return mcpCrud.listMcpServers(this.db, this.log);
  }
  updateMcpServer(
    id: string,
    data: { name?: string; command?: string; status?: string },
  ): McpServer {
    return mcpCrud.updateMcpServer(this.db, this.log, id, data);
  }
  deleteMcpServer(id: string): void {
    mcpCrud.deleteMcpServer(this.db, this.log, id);
  }

  assignMcpServer(agentId: string, mcpServerId: string): AgentMcpAssignment {
    return mcpCrud.assignMcpServer(this.db, this.log, agentId, mcpServerId);
  }
  unassignMcpServer(agentId: string, mcpServerId: string): void {
    mcpCrud.unassignMcpServer(this.db, this.log, agentId, mcpServerId);
  }
  listAgentMcpAssignments(agentId: string): AgentMcpAssignment[] {
    return mcpCrud.listAgentMcpAssignments(this.db, this.log, agentId);
  }
  listMcpServerAssignments(mcpServerId: string): AgentMcpAssignment[] {
    return mcpCrud.listMcpServerAssignments(this.db, this.log, mcpServerId);
  }

  createNote(data: { title: string; type?: string; content?: string; pinned?: number }): Note {
    return noteCrud.createNote(this.db, this.log, data);
  }
  getNote(id: string): Note | null {
    return noteCrud.getNote(this.db, this.log, id);
  }
  listNotes(filters?: NoteFilters): Note[] {
    return noteCrud.listNotes(this.db, this.log, filters);
  }
  updateNote(
    id: string,
    data: { title?: string; content?: string; pinned?: number; archived?: number },
  ): Note {
    return noteCrud.updateNote(this.db, this.log, id, data);
  }
  deleteNote(id: string): void {
    noteCrud.deleteNote(this.db, this.log, id);
  }

  createSchedule(data: {
    name: string;
    type: string;
    expression: string;
    agent_id: string;
    task_id?: string;
    status?: string;
  }): Schedule {
    return scheduleCrud.createSchedule(this.db, this.log, data);
  }
  getSchedule(id: string): Schedule | null {
    return scheduleCrud.getSchedule(this.db, this.log, id);
  }
  listSchedules(filters?: ScheduleFilters): Schedule[] {
    return scheduleCrud.listSchedules(this.db, this.log, filters);
  }
  updateSchedule(
    id: string,
    data: { name?: string; expression?: string; status?: string },
  ): Schedule {
    return scheduleCrud.updateSchedule(this.db, this.log, id, data);
  }
  deleteSchedule(id: string): void {
    scheduleCrud.deleteSchedule(this.db, this.log, id);
  }

  createDocumentVersion(data: {
    file_path: string;
    content: string;
    model: string;
    version: number;
  }): DocumentVersion {
    return documentVersionCrud.createDocumentVersion(this.db, this.log, data);
  }
  getDocumentVersion(id: string): DocumentVersion | null {
    return documentVersionCrud.getDocumentVersion(this.db, this.log, id);
  }
  listDocumentVersions(filters: DocumentVersionFilters): DocumentVersion[] {
    return documentVersionCrud.listDocumentVersions(this.db, this.log, filters);
  }
  deleteDocumentVersion(id: string): void {
    documentVersionCrud.deleteDocumentVersion(this.db, this.log, id);
  }

  /** Seeds production data: secretary (anthropic) and accountant (openai) agents. Idempotent — skips if agents already exist. */
  seedProductionData(): void {
    seedProduction(this.db, this.log);
  }

  close(): void {
    closeDatabase(this.db);
  }
}
