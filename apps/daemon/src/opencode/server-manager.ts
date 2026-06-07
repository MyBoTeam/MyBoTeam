import type { OnBeforeStartContext } from '@myboteam/agent-core';
import { log } from '../logger.js';
import { type ServerManagerDeps, TASK_RUNTIME_IDLE_CLEANUP_MS } from './server-config.js';
import { OpenCodeTaskRuntime } from './server-runtime.js';

export class OpenCodeServerManager {
  private runtimes = new Map<string, OpenCodeTaskRuntime>();
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private disposed = false;

  constructor(private readonly deps: ServerManagerDeps) {}

  isReady(taskId: string): boolean {
    return this.runtimes.get(taskId)?.isReady() ?? false;
  }

  async ensureTaskRuntime(taskId: string, ctx?: OnBeforeStartContext): Promise<void> {
    if (!taskId || this.disposed) return;
    this.clearCleanupTimer(taskId);
    const runtime = this.getOrCreateRuntime(taskId);
    if (ctx) {
      runtime.setContext(ctx);
    }
    await runtime.start();
  }

  async waitForServerUrl(taskId: string): Promise<string | undefined> {
    if (!taskId || this.disposed) return undefined;
    this.clearCleanupTimer(taskId);
    return this.runtimes.get(taskId)?.waitForServerUrl();
  }

  scheduleTaskRuntimeCleanup(taskId: string, delayMs = TASK_RUNTIME_IDLE_CLEANUP_MS): void {
    if (!taskId || this.disposed || !this.runtimes.has(taskId)) return;
    this.clearCleanupTimer(taskId);
    const timer = setTimeout(() => {
      this.cleanupTimers.delete(taskId);
      void this.destroyTaskRuntime(taskId).catch((error) => {
        log.warn(
          `[OpenCode Server] Failed to clean up task runtime ${taskId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    }, delayMs);
    this.cleanupTimers.set(taskId, timer);
  }

  async destroyTaskRuntime(taskId: string): Promise<void> {
    const runtime = this.runtimes.get(taskId);
    if (!runtime) return;
    this.clearCleanupTimer(taskId);
    this.runtimes.delete(taskId);
    runtime.abortStart();
    await runtime.stop();
    await runtime.waitForStartToSettle();
  }

  async destroyAllTaskRuntimes(): Promise<void> {
    const taskIds = [...this.runtimes.keys()];
    await Promise.all(taskIds.map((taskId) => this.destroyTaskRuntime(taskId)));
  }

  async invalidate(): Promise<void> {
    if (this.disposed) return;
    log.info('[OpenCode Server] Invalidating all task runtimes...');
    await this.destroyAllTaskRuntimes();
  }

  dispose(): void {
    this.disposed = true;
    for (const timer of this.cleanupTimers.values()) clearTimeout(timer);
    this.cleanupTimers.clear();
    for (const runtime of this.runtimes.values()) runtime.dispose();
    this.runtimes.clear();
  }

  getServerUrlResolver(): (taskId: string) => Promise<string | undefined> {
    return async (taskId: string) => this.waitForServerUrl(taskId);
  }

  private getOrCreateRuntime(taskId: string): OpenCodeTaskRuntime {
    this.clearCleanupTimer(taskId);
    const existing = this.runtimes.get(taskId);
    if (existing) return existing;
    const runtime = new OpenCodeTaskRuntime(taskId, this.deps);
    this.runtimes.set(taskId, runtime);
    return runtime;
  }

  private clearCleanupTimer(taskId: string): void {
    const timer = this.cleanupTimers.get(taskId);
    if (!timer) return;
    clearTimeout(timer);
    this.cleanupTimers.delete(taskId);
  }
}
