import type {
  Part as OpenCodeSdkPart,
  PermissionRequest as OpenCodeSdkPermissionRequest,
} from '@opencode-ai/sdk/v2';
import { EventEmitter } from 'events';
import type { PermissionResponse } from '../../common/types/permission.js';
import { DEFAULT_SANDBOX_CONFIG } from '../../common/types/sandbox.js';
import type { Task, TaskConfig } from '../../common/types/task.js';
import { DisabledSandboxProvider } from '../../sandbox/disabled-provider.js';
import { createCompletionEnforcer, setupLogWatcher } from './adapter-config.js';
import {
  handleMessageUpdated as execHandleMessageUpdated,
  handlePartUpdated as execHandlePartUpdated,
  handleSdkEvent,
} from './adapter-events.js';
import {
  createSessionAndPrompt,
  sendResponse as execSendResponse,
  prepareEnvAndClient,
} from './adapter-execution.js';
import { handlePermissionAsked as execHandlePermissionAsked } from './adapter-permissions.js';
import {
  abortSession,
  handleWatchdogHardTimeout as execHandleWatchdogHardTimeout,
  sampleWatchdogState as execSampleWatchdogState,
  startWatchdog as execStartWatchdog,
  teardown as execTeardown,
  markTaskComplete,
  runEventSubscription,
} from './adapter-session.js';
import { AdapterState } from './adapter-state.js';
import {
  type AdapterOptions,
  type OpenCodeAdapterEvents,
  OpenCodeCliNotFoundError,
  OpenCodeRuntimeUnavailableError,
} from './adapter-types.js';
import { createLogWatcher } from './OpenCodeLogWatcher.js';
import type {
  TaskInactivityWatchdogSnapshot,
  TaskInactivityWatchdogTimeoutContext,
} from './TaskInactivityWatchdog.js';

export {
  type AdapterOptions,
  type OpenCodeAdapterEvents,
  OpenCodeCliNotFoundError,
  OpenCodeRuntimeUnavailableError,
};

export const WINDOWS_CTRL_C_EXIT_CODE = -1073741510;

export class OpenCodeAdapter extends EventEmitter<OpenCodeAdapterEvents> {
  private state: AdapterState;

  constructor(options: AdapterOptions, taskId?: string) {
    super();
    const sandboxProvider = resolveSandboxProvider(options);
    const sandboxConfig = resolveSandboxConfig(options);
    this.state = new AdapterState(options, sandboxProvider, sandboxConfig, this);
    this.state.currentTaskId = taskId ?? null;
    this.state.completionEnforcer = createCompletionEnforcer(
      () => this.state.currentSessionId,
      () => this.state.client,
      (event: string, ...args: unknown[]) => this.state.emit(event, ...args),
      (status, error) => markTaskComplete(this.state, status as 'success' | 'error', error),
    );
    this.state.logWatcher = createLogWatcher();
    setupLogWatcher(
      this.state.logWatcher,
      () => this.state.hasCompleted,
      () => this.state.client,
      (event: string, ...args: unknown[]) => this.state.emit(event, ...args),
      (status, error) => markTaskComplete(this.state, status as 'success' | 'error', error),
      (reason) => abortSession(this.state, reason as 'cancel' | 'interrupt' | 'log-error'),
    );
  }

  async startTask(config: TaskConfig): Promise<Task> {
    await prepareEnvAndClient(this.state, config);

    this.state.eventAbortController = new AbortController();
    this.state.eventStreamPromise = runEventSubscription(
      this.state,
      this.state.eventAbortController.signal,
      (event) => handleSdkEvent(this.state, event),
    );

    const task = await createSessionAndPrompt(this.state, config);

    execStartWatchdog(this.state);

    return task;
  }

  async resumeSession(sessionId: string, prompt: string): Promise<Task> {
    return this.startTask({ prompt, sessionId } as TaskConfig);
  }

  async sendResponse(response: PermissionResponse): Promise<void> {
    return execSendResponse(this.state, response);
  }

  async cancelTask(): Promise<void> {
    this.state.wasInterrupted = true;
    await abortSession(this.state, 'cancel');
    execTeardown(this.state);
  }

  async interruptTask(): Promise<void> {
    this.state.wasInterrupted = true;
    await abortSession(this.state, 'interrupt');
  }

  getSessionId(): string | null {
    return this.state.currentSessionId;
  }

  getTaskId(): string | null {
    return this.state.currentTaskId;
  }

  getModelContext(): { modelId?: string; providerId?: string } {
    const ctx: { modelId?: string; providerId?: string } = {};
    if (this.state.currentModelId) ctx.modelId = this.state.currentModelId;
    if (this.state.currentProviderId) ctx.providerId = this.state.currentProviderId;
    return ctx;
  }

  get running(): boolean {
    return this.state.client !== null && !this.state.hasCompleted && !this.state.isDisposed;
  }

  isAdapterDisposed(): boolean {
    return this.state.isDisposed;
  }

  dispose(): void {
    if (this.state.isDisposed) return;
    this.state.isDisposed = true;
    execTeardown(this.state);
    if (this.state.logWatcher) {
      this.state.logWatcher.stop().catch(() => {});
      this.state.logWatcher.removeAllListeners();
      this.state.logWatcher = null;
    }
    this.removeAllListeners();
  }

  /** @internal */
  get options(): AdapterOptions {
    return this.state.options;
  }
  /** @internal */
  set options(val: AdapterOptions) {
    this.state.options = val;
  }
  /** @internal */
  get currentTaskId(): string | null {
    return this.state.currentTaskId;
  }
  /** @internal */
  set currentTaskId(val: string | null) {
    this.state.currentTaskId = val;
  }
  /** @internal */
  get currentSessionId(): string | null {
    return this.state.currentSessionId;
  }
  /** @internal */
  set currentSessionId(val: string | null) {
    this.state.currentSessionId = val;
  }
  /** @internal */
  get watchdogActivityCounter(): number {
    return this.state.watchdogActivityCounter;
  }
  /** @internal */
  set watchdogActivityCounter(val: number) {
    this.state.watchdogActivityCounter = val;
  }
  /** @internal */
  get pendingRequest() {
    return this.state.pendingRequest;
  }
  /** @internal */
  set pendingRequest(val) {
    this.state.pendingRequest = val;
  }
  /** @internal */
  get hasCompleted(): boolean {
    return this.state.hasCompleted;
  }
  /** @internal */
  set hasCompleted(val: boolean) {
    this.state.hasCompleted = val;
  }
  /** @internal */
  get watchdog() {
    return this.state.watchdog;
  }
  /** @internal */
  startWatchdog(): void {
    execStartWatchdog(this.state);
  }
  /** @internal */
  teardown(): void {
    execTeardown(this.state);
  }
  /** @internal */
  sampleWatchdogState(): TaskInactivityWatchdogSnapshot {
    return execSampleWatchdogState(this.state);
  }
  /** @internal */
  handleWatchdogHardTimeout(ctx: TaskInactivityWatchdogTimeoutContext): void {
    execHandleWatchdogHardTimeout(this.state, ctx);
  }
  /** @internal */
  handleMessageUpdated(info: unknown): void {
    execHandleMessageUpdated(this.state, info as never);
  }
  /** @internal */
  handlePartUpdated(part: OpenCodeSdkPart): void {
    execHandlePartUpdated(this.state, part);
  }
  /** @internal */
  handlePermissionAsked(request: OpenCodeSdkPermissionRequest): void {
    execHandlePermissionAsked(this.state, request);
  }
}

function resolveSandboxProvider(options: AdapterOptions) {
  if (options.sandboxFactory) {
    return options.sandboxFactory().provider;
  }
  if (
    options.sandboxConfig &&
    options.sandboxConfig.mode !== 'disabled' &&
    !options.sandboxProvider
  ) {
    throw new Error(
      `sandboxProvider must be supplied when sandboxConfig.mode is "${options.sandboxConfig.mode}". ` +
        'Omitting it causes the task to run unsandboxed on the host.',
    );
  }
  return options.sandboxProvider ?? new DisabledSandboxProvider();
}

function resolveSandboxConfig(options: AdapterOptions) {
  if (options.sandboxFactory) {
    return options.sandboxFactory().config;
  }
  return options.sandboxConfig ?? DEFAULT_SANDBOX_CONFIG;
}
