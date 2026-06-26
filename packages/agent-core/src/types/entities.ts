export interface Agent {
  id: string;
  slug: string;
  provider: string;
  model: string;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  agent_id: string;
  title: string;
  status: 'pending' | 'running' | 'partial' | 'completed' | 'failed' | 'max_retries';
  verification_status: 'pending' | 'passed' | 'failed' | null;
  continuation_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskTodo {
  id: string;
  task_id: string;
  description: string;
  is_completed: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  agent_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface MemoryEntry {
  id: string;
  agent_id: string;
  category: 'preference' | 'fact' | 'pattern' | 'instruction';
  content: string;
  confidence: number;
  source: 'conversation' | 'manual' | 'extraction';
  created_at: string;
  updated_at: string;
}

export interface McpServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
}

export interface AgentMcpAssignment {
  agent_id: string;
  mcp_server_id: string;
  assigned_at: string;
}

export interface Note {
  id: string;
  title: string;
  type: 'text' | 'checklist';
  content: string;
  pinned: number;
  archived: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  name: string;
  type: 'at' | 'every' | 'cron';
  expression: string;
  status: 'active' | 'paused' | 'completed';
  agent_id: string;
  task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  file_path: string;
  content: string;
  model: string;
  version: number;
  created_at: string;
}
