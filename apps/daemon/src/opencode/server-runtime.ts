import type { OnBeforeStartContext } from '@myboteam/agent-core';
import { log } from '../logger.js';
import { onBeforeStart } from '../task-config-builder.js';
import {
  SERVER_URL_WAIT_TIMEOUT_MS,
  type ServerManagerDeps,
  type TrackedOpencodeServerHandle,
} from './server-config.js';
import { spawnOpenCodeServer } from './server-lifecycle.js';
import { throwIfStartAborted } from './server-transient.js';

export class OpenCodeTaskRuntime {
  private server: TrackedOpencodeServerHandle | null = null;
  private serverUrl: string | undefined;
  private ready = false;
  private startPromise: Promise<void> | null = null;
  private startAbortController: AbortController | null = null;
  private disposed = false;
  private ctx: OnBeforeStartContext;

  constructor(
    readonly taskId: string,
    private readonly deps: ServerManagerDeps,
  ) {
    this.ctx = { taskId };
  }

  setContext(ctx: OnBeforeStartContext): void {
    this.ctx = { taskId: this.taskId, ...ctx };
  }

  isReady(): boolean {
    return this.ready;
  }

  async waitForServerUrl(): Promise<string | undefined> {
    if (this.ready && this.serverUrl) return this.serverUrl;
    const deadline = Date.now() + SERVER_URL_WAIT_TIMEOUT_MS;
    while (true) {
      if (this.disposed) return undefined;
      if (this.ready && this.serverUrl) return this.serverUrl;
      if (Date.now() > deadline) return undefined;
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  async start(): Promise<void> {
    if (this.disposed) return;
    if (this.ready) return;
    if (this.startPromise) return this.startPromise;
    this.startAbortController = new AbortController();
    const signal = this.startAbortController.signal;
    this.startPromise = this.doStart(signal).finally(() => {
      this.startPromise = null;
    });
    return this.startPromise;
  }

  private async doStart(signal: AbortSignal): Promise<void> {
    const startedAt = performance.now();
    try {
      throwIfStartAborted(signal);
      const { env: runtimeEnv } = await onBeforeStart(this.deps.storage, this.deps, this.ctx);
      throwIfStartAborted(signal);
      const spawnedServer = await spawnOpenCodeServer(runtimeEnv, this.deps, signal, () => {
        if (this.disposed) return;
        this.ready = false;
        this.serverUrl = undefined;
        this.server = null;
      });
      this.server = spawnedServer;
      if (signal.aborted) {
        await this.stop();
        return;
      }
      this.serverUrl = spawnedServer.url;
      this.ready = true;
      log.info(
        `[OpenCode Server] Task runtime ${this.taskId} ready in ${(
          performance.now() - startedAt
        ).toFixed(0)}ms at ${this.serverUrl}`,
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        await this.stop();
        return;
      }
      log.warn(
        `[OpenCode Server] Failed to start task runtime ${this.taskId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.ready = false;
    this.serverUrl = undefined;
    const serverToStop = this.server;
    this.server = null;
    if (!serverToStop) return;
    serverToStop.close();
  }

  abortStart(): void {
    this.startAbortController?.abort();
  }

  async waitForStartToSettle(): Promise<void> {
    if (this.startPromise) await this.startPromise;
  }

  dispose(): void {
    this.disposed = true;
    this.abortStart();
    void this.stop();
  }
}
