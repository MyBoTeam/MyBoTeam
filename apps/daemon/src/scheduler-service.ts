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

  /**
   * Start the scheduler. Fires overdue schedules immediately (catch-up),
   * then aligns to the next minute boundary and ticks every 60 seconds.
   */
  start(): void {
    this.catchUp();

    // Align to the next minute boundary.
    // If we're exactly on a boundary (msUntilNextMinute === 60000), tick immediately.
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

  /** Stop all timers. */
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

  /**
   * Tick: find enabled schedules whose next_run_at <= now, update their
   * last_run_at and next_run_at, then fire their prompts.
   */
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

  /**
   * Fire once for any overdue schedules (e.g. daemon was stopped).
   * Only fires schedules whose next_run_at is in the past.
   */
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

  /** Create a new schedule after validating the cron expression. */
  createSchedule(cron: string, prompt: string, workspaceId?: string): ScheduledTask {
    if (!validateCron(cron)) {
      throw new Error(`Invalid cron expression: ${cron}`);
    }
    // Verify the cron can actually fire within the scan window.
    // Rejects expressions like "0 0 29 2 1" (Feb 29 on Monday) that may
    // be decades away and would be persisted with next_run_at = NULL.
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

  /** List all schedules, optionally filtered by workspace. */
  listSchedules(workspaceId?: string): ScheduledTask[] {
    if (workspaceId) {
      return this.storage.getScheduledTasksByWorkspace(workspaceId);
    }
    return this.storage.getAllScheduledTasks();
  }

  /** Delete a schedule by ID. */
  deleteSchedule(id: string): void {
    this.storage.deleteScheduledTask(id);
  }

  /** Enable or disable a schedule. */
  setEnabled(id: string, enabled: boolean): void {
    if (enabled) {
      // Verify the schedule can fire before enabling
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
