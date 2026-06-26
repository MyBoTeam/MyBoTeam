export interface AgentFilters {
  slug?: string;
  status?: string;
}

export interface TaskFilters {
  agent_id?: string;
  status?: string;
}

export interface ConversationFilters {
  agent_id?: string;
}

export interface MessageFilters {
  conversation_id?: string;
}

export interface MemoryEntryFilters {
  agent_id?: string;
  category?: string;
}

export interface McpServerFilters {
  name?: string;
  status?: string;
}

export interface NoteFilters {
  archived?: boolean;
  type?: string;
  pinned?: boolean;
}

export interface ScheduleFilters {
  agent_id?: string;
  status?: string;
}

export interface DocumentVersionFilters {
  file_path?: string;
}
