import type {
  Part as OpenCodeSdkPart,
  PermissionRequest as OpenCodeSdkPermissionRequest,
} from '@opencode-ai/sdk/v2';
import { EventEmitter } from 'events';
import type { PermissionResponse } from '../../common/types/permission.js';
import type { Task, TaskConfig } from '../../common/types/task.js';
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
import { resolveSandboxConfig, resolveSandboxProvider } from './adapter-sandbox.js';
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
} from './adapter-types.js';
import { createLogWatcher } from './OpenCodeLogWatcher.js';
import type {
  TaskInactivityWatchdogSnapshot,
  TaskInactivityWatchdogTimeoutContext,
} from './TaskInactivityWatchdog.js';

export { type AdapterOptions, type OpenCodeAdapterEvents, OpenCodeCliNotFoundError };

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

  get options(): AdapterOptions {
    return this.state.options;
  }
  set options(val: AdapterOptions) {
    this.state.options = val;
  }
  get currentTaskId(): string | null {
    return this.state.currentTaskId;
  }
  set currentTaskId(val: string | null) {
    this.state.currentTaskId = val;
  }
  get currentSessionId(): string | null {
    return this.state.currentSessionId;
  }
  set currentSessionId(val: string | null) {
    this.state.currentSessionId = val;
  }
  get watchdogActivityCounter(): number {
    return this.state.watchdogActivityCounter;
  }
  set watchdogActivityCounter(val: number) {
    this.state.watchdogActivityCounter = val;
  }
  get pendingRequest() {
    return this.state.pendingRequest;
  }
  set pendingRequest(val) {
    this.state.pendingRequest = val;
  }
  get hasCompleted(): boolean {
    return this.state.hasCompleted;
  }
  set hasCompleted(val: boolean) {
    this.state.hasCompleted = val;
  }
  get watchdog() {
    return this.state.watchdog;
  }
  startWatchdog(): void {
    execStartWatchdog(this.state);
  }
  teardown(): void {
    execTeardown(this.state);
  }
  sampleWatchdogState(): TaskInactivityWatchdogSnapshot {
    return execSampleWatchdogState(this.state);
  }
  handleWatchdogHardTimeout(ctx: TaskInactivityWatchdogTimeoutContext): void {
    execHandleWatchdogHardTimeout(this.state, ctx);
  }
  handleMessageUpdated(info: unknown): void {
    execHandleMessageUpdated(this.state, info as never);
  }
  handlePartUpdated(part: OpenCodeSdkPart): void {
    execHandlePartUpdated(this.state, part);
  }
  handlePermissionAsked(request: OpenCodeSdkPermissionRequest): void {
    execHandlePermissionAsked(this.state, request);
  }
}
