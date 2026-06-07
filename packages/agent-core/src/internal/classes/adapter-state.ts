import type { OpencodeClient, Part } from '@opencode-ai/sdk/v2';
import type { EventEmitter } from 'events';
import type { BrowserFramePayload } from '../../common/types/browser-view.js';
import type { SandboxConfig, SandboxProvider } from '../../common/types/sandbox.js';
import type { TaskResult } from '../../common/types/task.js';
import type { TodoItem } from '../../common/types/todo.js';
import type { CompletionEnforcer } from '../../opencode/completion/index.js';
import type { AdapterOptions, OpenCodeAdapterEvents, PendingRequest } from './adapter-types.js';
import type { OpenCodeLogWatcher } from './OpenCodeLogWatcher.js';
import type { TaskInactivityWatchdog } from './TaskInactivityWatchdog.js';

export class AdapterState {
  options: AdapterOptions;
  sandboxProvider: SandboxProvider;
  sandboxConfig: SandboxConfig;
  client: OpencodeClient | null = null;
  logWatcher: OpenCodeLogWatcher | null = null;
  completionEnforcer: CompletionEnforcer | null = null;
  currentSessionId: string | null = null;
  currentTaskId: string | null = null;
  currentModelId: string | null = null;
  currentProviderId: string | null = null;
  lastWorkingDirectory: string | undefined;
  eventAbortController: AbortController | null = null;
  eventStreamPromise: Promise<void> | null = null;
  hasCompleted = false;
  isDisposed = false;
  wasInterrupted = false;
  externalEnv: NodeJS.ProcessEnv | undefined;
  workspaceInstructions: string | undefined;
  pendingRequest: PendingRequest | null = null;
  browserFrameSeen = new Set<string>();
  messageRoles = new Map<string, 'user' | 'assistant' | string>();
  pendingTextParts = new Map<string, Part[]>();
  countedToolCallIds = new Set<string>();
  awaitingIdle = false;
  sawAssistantProgress = false;
  watchdogActivityCounter = 0;
  watchdog: TaskInactivityWatchdog | null = null;
  private emitter: EventEmitter<OpenCodeAdapterEvents>;

  constructor(
    options: AdapterOptions,
    sandboxProvider: SandboxProvider,
    sandboxConfig: SandboxConfig,
    emitter: EventEmitter<OpenCodeAdapterEvents>,
  ) {
    this.options = options;
    this.sandboxProvider = sandboxProvider;
    this.sandboxConfig = sandboxConfig;
    this.emitter = emitter;
  }

  emit(event: string, ...args: unknown[]): boolean {
    return (this.emitter.emit as (event: string, ...args: unknown[]) => boolean)(event, ...args);
  }
}
