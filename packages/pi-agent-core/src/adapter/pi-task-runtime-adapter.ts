import { EventEmitter } from 'node:events';

import { resolvePiModel } from '../models/pi-model-resolver.js';
import { resolvePiTerminalState } from './pi-terminal-state.js';
import type { PermissionResponse, Task, TaskConfig } from './task-runtime-types.js';

export interface PiPromptAgent {
  prompt(input: string): Promise<unknown>;
  abort?(): Promise<unknown> | unknown;
  interrupt?(): Promise<unknown> | unknown;
}

export type PiAgentFactory = (config: TaskConfig) => Promise<PiPromptAgent> | PiPromptAgent;

export interface PiTaskRuntimeAdapterOptions {
  taskId: string;
  createAgent?: PiAgentFactory;
}

type PiRuntimeAdapterEvents = {
  complete: [Task['result']];
  error: [Error];
};

type PiRuntimeAdapterListener<EventName extends keyof PiRuntimeAdapterEvents> = (
  ...args: PiRuntimeAdapterEvents[EventName]
) => void;

export class PiTaskRuntimeAdapter {
  private readonly emitter = new EventEmitter();
  private readonly taskId: string;
  private readonly createAgent: PiAgentFactory;
  private agent: PiPromptAgent | null = null;
  private sessionId: string | null = null;
  public running = false;

  constructor(options: PiTaskRuntimeAdapterOptions) {
    this.taskId = options.taskId;
    this.createAgent = options.createAgent ?? createVendoredPiAgent;
  }

  async startTask(config: TaskConfig): Promise<Task> {
    this.running = true;
    this.sessionId = config.sessionId ?? this.taskId;
    const startedAt = new Date().toISOString();
    const modelResolution = resolvePiModel(
      config.provider || config.modelId
        ? { provider: config.provider ?? 'unknown', model: config.modelId ?? '' }
        : null,
    );

    try {
      if (modelResolution.status === 'approved-exclusion') {
        throw new Error(modelResolution.reason);
      }
      this.agent = await this.createAgent(config);
      await this.agent.prompt(config.prompt);
      const terminal = resolvePiTerminalState({ reason: 'success', sessionId: this.sessionId });
      this.emit('complete', terminal.result);
      return createTask(
        config,
        this.taskId,
        this.sessionId,
        startedAt,
        'completed',
        terminal.result,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const terminal = resolvePiTerminalState({
        reason: this.agent ? 'failure' : 'startup-failure',
        sessionId: this.sessionId,
        error: message,
      });
      if (terminal.error) {
        this.emit('error', terminal.error);
      }
      return createTask(config, this.taskId, this.sessionId, startedAt, 'failed', terminal.result);
    } finally {
      this.running = false;
    }
  }

  async sendResponse(_response: PermissionResponse): Promise<void> {}

  async cancelTask(): Promise<void> {
    await this.agent?.abort?.();
    this.running = false;
  }

  async interruptTask(): Promise<void> {
    await this.agent?.interrupt?.();
    this.running = false;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getTaskId(): string | null {
    return this.taskId;
  }

  dispose(): void {
    this.emitter.removeAllListeners();
    this.running = false;
  }

  on<EventName extends keyof PiRuntimeAdapterEvents>(
    event: EventName,
    listener: PiRuntimeAdapterListener<EventName>,
  ): unknown {
    return this.emitter.on(event, listener);
  }

  off<EventName extends keyof PiRuntimeAdapterEvents>(
    event: EventName,
    listener: PiRuntimeAdapterListener<EventName>,
  ): unknown {
    return this.emitter.off(event, listener);
  }

  private emit<EventName extends keyof PiRuntimeAdapterEvents>(
    event: EventName,
    ...args: PiRuntimeAdapterEvents[EventName]
  ): void {
    this.emitter.emit(event, ...args);
  }
}

async function createVendoredPiAgent(config: TaskConfig): Promise<PiPromptAgent> {
  const moduleName = '@myboteam/pi-vendor';
  const vendor = (await import(moduleName)) as {
    piAgentCore?: { Agent?: new (options?: unknown) => PiPromptAgent };
  };
  const Agent = vendor.piAgentCore?.Agent;
  if (!Agent) {
    throw new Error('Pi vendored Agent is not available');
  }
  return new Agent({
    sessionId: config.sessionId,
    initialState: { systemPrompt: config.systemPromptAppend ?? '' },
  });
}

function createTask(
  config: TaskConfig,
  taskId: string,
  sessionId: string | null,
  startedAt: string,
  status: Task['status'],
  result: Task['result'],
): Task {
  const completedAt = new Date().toISOString();
  return {
    id: taskId,
    prompt: config.prompt,
    status,
    sessionId: sessionId ?? undefined,
    messages: [],
    createdAt: startedAt,
    startedAt,
    completedAt,
    result,
    workspaceId: config.workspaceId,
  };
}
