export interface TaskProgressEvent {
  stage: string;
  message?: string;
  isFirstTask?: boolean;
  modelName?: string;
}

export interface OnBeforeStartContext {
  taskId?: string;
  workspaceId?: string;
}

export interface OnBeforeStartResult {
  env?: NodeJS.ProcessEnv;
  workspaceInstructions?: string;
}
