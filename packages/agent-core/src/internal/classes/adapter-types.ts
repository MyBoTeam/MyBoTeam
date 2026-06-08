import type { BrowserFramePayload } from '../../common/types/browser-view.js';
import type { OpenCodeMessage } from '../../common/types/opencode.js';
import type { PermissionRequest } from '../../common/types/permission.js';
import type { SandboxConfig, SandboxProvider } from '../../common/types/sandbox.js';
import type { TaskResult } from '../../common/types/task.js';
import type { TodoItem } from '../../common/types/todo.js';
import type { OnBeforeStartContext, OnBeforeStartResult } from '../../types/task-manager.js';

export class OpenCodeCliNotFoundError extends Error {
  constructor() {
    super(
      'OpenCode runtime is not available. The bundled runtime may be missing or corrupted. Please reinstall the application.',
    );
    this.name = 'OpenCodeCliNotFoundError';
  }
}

export interface AdapterOptions {
  platform: NodeJS.Platform;
  isPackaged: boolean;
  tempPath: string;
  getServerUrl?: (taskId: string, ctx?: OnBeforeStartContext) => Promise<string | undefined>;
  onBeforeStart?: (
    ctx: OnBeforeStartContext,
  ) => Promise<NodeJS.ProcessEnv | OnBeforeStartResult | void>;
  getModelDisplayName?: (modelId: string) => string;
  sandboxFactory?: () => { provider: SandboxProvider; config: SandboxConfig };
  sandboxProvider?: SandboxProvider;
  sandboxConfig?: SandboxConfig;
  setProxyTaskId?: (taskId: string | undefined) => void;
}

export interface OpenCodeAdapterEvents {
  message: [OpenCodeMessage];
  'tool-use': [string, unknown];
  'tool-result': [string];
  'permission-request': [PermissionRequest];
  progress: [{ stage: string; message?: string; modelName?: string }];
  complete: [TaskResult];
  error: [Error];
  debug: [{ type: string; message: string; data?: unknown }];
  'todo:update': [TodoItem[]];
  'auth-error': [{ providerId: string; message: string }];
  'browser-frame': [BrowserFramePayload];
  reasoning: [string];
  'tool-call-complete': [
    {
      toolName: string;
      toolInput: unknown;
      toolOutput: string;
      sessionId?: string;
    },
  ];
  'step-finish': [
    {
      reason: string;
      model?: string;
      tokens?: {
        input: number;
        output: number;
        reasoning: number;
        cache?: { read: number; write: number };
      };
      cost?: number;
    },
  ];
}

export interface PendingRequest {
  kind: 'permission' | 'question';
  requestId: string;
  sdkRequestId: string;
  sessionId: string;
}
