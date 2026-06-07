export interface TaskContext {
  taskId: string;
  sessionId: string;
  taskType: string;
}

export type TaskErrorCategory =
  | 'auth_error'
  | 'rate_limit'
  | 'network_error'
  | 'tool_error'
  | 'timeout'
  | 'user_interrupted'
  | 'context_overflow'
  | 'provider_config'
  | 'unknown';
