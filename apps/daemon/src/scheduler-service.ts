import type { ScheduledTask, StorageAPI } from '@myboteam/agent-core';
import { log } from './logger.js';
import { computeNextRunAt, validateCron } from './scheduler-types.js';

export class SchedulerService {
  private storage: StorageAPI;
  private onTaskFire: (prompt: string, workspaceId?: string) => void;
  private alignTimeout: ReturnType<typeof setTimeout> | null = null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  constructor(storage: StorageAPI, onTaskFire: (prompt: string, workspaceId?: string) => void) {
    this.storage = storage;
    this.onTaskFire = onTaskFire;
  }

  start(): void {
    this.catchUp();

    const now = Date.now();
    const remainder = now % 60_000;
    const msUntilNextMinute = remainder === 0 ? 0 : 60_000 - remainder;

    if (msUntilNextMinute === 0) {
      this.tick();
      this.tickInterval = setInterval(() => this.tick(), 60_000);
    } else {
      this.alignTimeout = setTimeout(() => {
        this.tick();
        this.tickInterval = setInterval(() => this.tick(), 60_000);
      }, msUntilNextMinute);
    }
  }

  stop(): void {
    if (this.alignTimeout) {
      clearTimeout(this.alignTimeout);
      this.alignTimeout = null;
    }
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  tick(): void {
    const now = new Date();
    const nowIso = now.toISOString();

    const enabled = this.storage.getEnabledScheduledTasks();
    const due = enabled.filter((t) => t.nextRunAt && t.nextRunAt <= nowIso);

    for (const task of due) {
      const next = computeNextRunAt(task.cron, now);
      if (!next) {
        log.warn(`[Scheduler] Could not compute next run for schedule ${task.id} — skipping`);
        continue;
      }
      this.storage.updateScheduledTaskLastRun(task.id, nowIso, next);
      log.info(`[Scheduler] Firing schedule ${task.id}: "${task.prompt.slice(0, 80)}"`);
      try {
        this.onTaskFire(task.prompt, task.workspaceId);
      } catch (err) {
        log.error(`[Scheduler] Error firing task ${task.id}:`, err);
      }
    }
  }

  catchUp(): void {
    const now = new Date();
    const nowIso = now.toISOString();

    const enabled = this.storage.getEnabledScheduledTasks();
    const overdue = enabled.filter((t) => t.nextRunAt && t.nextRunAt <= nowIso);

    for (const task of overdue) {
      const next = computeNextRunAt(task.cron, now);
      if (!next) {
        log.warn(
          `[Scheduler] Could not compute next run for overdue schedule ${task.id} — skipping`,
        );
        continue;
      }
      this.storage.updateScheduledTaskLastRun(task.id, nowIso, next);
      log.info(`[Scheduler] Catch-up firing schedule ${task.id}: "${task.prompt.slice(0, 80)}"`);
      try {
        this.onTaskFire(task.prompt, task.workspaceId);
      } catch (err) {
        log.error(`[Scheduler] Error during catch-up for task ${task.id}:`, err);
      }
    }
  }

  createSchedule(cron: string, prompt: string, workspaceId?: string): ScheduledTask {
    if (!validateCron(cron)) {
      throw new Error(`Invalid cron expression: ${cron}`);
    }

    const nextRun = computeNextRunAt(cron, new Date());
    if (!nextRun) {
      throw new Error(
        `Schedule "${cron}" has no matching date within the next 4 years. ` +
          'This can happen with very specific day-of-month + day-of-week combinations. ' +
          'Try a less restrictive expression.',
      );
    }
    return this.storage.createScheduledTask(cron, prompt, workspaceId);
  }

  listSchedules(workspaceId?: string): ScheduledTask[] {
    if (workspaceId) {
      return this.storage.getScheduledTasksByWorkspace(workspaceId);
    }
    return this.storage.getAllScheduledTasks();
  }

  deleteSchedule(id: string): void {
    this.storage.deleteScheduledTask(id);
  }

  setEnabled(id: string, enabled: boolean): void {
    if (enabled) {
      const task = this.storage.getScheduledTaskById(id);
      if (task) {
        const nextRun = computeNextRunAt(task.cron, new Date());
        if (!nextRun) {
          throw new Error(
            `Cannot enable schedule: "${task.cron}" has no matching date within the next 4 years.`,
          );
        }
      }
    }
    this.storage.setScheduledTaskEnabled(id, enabled);
  }
}
