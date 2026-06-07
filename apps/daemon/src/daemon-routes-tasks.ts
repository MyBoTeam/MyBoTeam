import {
  permissionResponseSchema,
  resumeSessionSchema,
  taskConfigSchema,
  validate,
} from '@myboteam/agent-core';
import { z } from 'zod';
import type { RouteServices } from './daemon-routes.js';
import { safeHandler } from './daemon-routes-middleware.js';

const taskIdSchema = z.object({ taskId: z.string().min(1) });
const taskStartSchema = taskConfigSchema;

export function registerTaskRoutes(services: RouteServices): void {
  const { rpc, taskService, schedulerService, storageService } = services;
  const storage = storageService.getStorage();

  // ── Task CRUD ──
  rpc.registerMethod(
    'task.start',
    safeHandler((params) => {
      const validated = validate(taskStartSchema, params);
      return taskService.startTask(validated);
    }),
  );
  rpc.registerMethod(
    'task.stop',
    safeHandler((params) => {
      const validated = validate(taskIdSchema, params);
      return taskService.stopTask(validated);
    }),
  );
  rpc.registerMethod(
    'task.list',
    safeHandler((params) => {
      const raw =
        params && typeof params === 'object' && 'workspaceId' in params
          ? (params as { workspaceId?: unknown }).workspaceId
          : undefined;
      const workspaceId = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : undefined;
      const includeUnassigned =
        params && typeof params === 'object' && 'includeUnassigned' in params
          ? (params as { includeUnassigned?: unknown }).includeUnassigned === true
          : false;
      return Promise.resolve(taskService.listTasks(workspaceId, includeUnassigned));
    }),
  );
  rpc.registerMethod(
    'task.status',
    safeHandler((params) => {
      const validated = validate(taskIdSchema, params);
      return Promise.resolve(taskService.getTaskStatus(validated));
    }),
  );
  rpc.registerMethod(
    'task.interrupt',
    safeHandler((params) => {
      const validated = validate(taskIdSchema, params);
      return taskService.interruptTask(validated);
    }),
  );
  rpc.registerMethod(
    'task.get',
    safeHandler((params) => {
      const validated = validate(taskIdSchema, params);
      return Promise.resolve(storage.getTask(validated.taskId) || null);
    }),
  );
  rpc.registerMethod(
    'task.delete',
    safeHandler(async (params) => {
      const validated = validate(taskIdSchema, params);
      if (taskService.hasActiveTask(validated.taskId)) {
        await taskService.stopTask({ taskId: validated.taskId });
      }
      storage.deleteTask(validated.taskId);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'task.clearHistory',
    safeHandler(() => {
      if (taskService.getActiveTaskCount() > 0) {
        throw new Error('Cannot clear history while tasks are active or queued');
      }
      storage.clearHistory();
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'task.getTodos',
    safeHandler((params) => {
      const validated = validate(taskIdSchema, params);
      return Promise.resolve(storage.getTodosForTask(validated.taskId));
    }),
  );
  rpc.registerMethod(
    'task.cancel',
    safeHandler((params) => {
      const validated = validate(taskIdSchema, params);
      return taskService.stopTask(validated);
    }),
  );
  rpc.registerMethod(
    'task.getActiveCount',
    safeHandler(() => Promise.resolve(taskService.getActiveTaskCount())),
  );

  // ── Permission ──
  rpc.registerMethod(
    'permission.respond',
    safeHandler(async (params) => {
      const validated = validate(permissionResponseSchema, params);
      const { taskId, requestId, decision, selectedOptions, customText } = validated;
      if (!taskService.hasActiveTask(taskId)) {
        throw new Error(
          `permission.respond: no active task with id=${taskId}. The task may have completed, been cancelled, or never existed.`,
        );
      }
      await taskService.sendResponse(taskId, {
        requestId,
        taskId,
        decision,
        ...(selectedOptions ? { selectedOptions } : {}),
        ...(customText ? { customText } : {}),
      });
    }),
  );

  // ── Session ──
  rpc.registerMethod(
    'session.resume',
    safeHandler((params) => {
      const validated = validate(resumeSessionSchema, params);
      return taskService.resumeSession(validated);
    }),
  );

  // ── Health ──
  rpc.registerMethod(
    'health.check',
    safeHandler(() => Promise.resolve(services.healthService.getStatus())),
  );

  // ── Scheduler ──
  rpc.registerMethod(
    'task.schedule',
    safeHandler((params) => {
      const validated = validate(
        z.object({
          cron: z.string().min(1),
          prompt: z.string().min(1),
          workspaceId: z.string().optional(),
        }),
        params,
      );
      return Promise.resolve(
        schedulerService.createSchedule(validated.cron, validated.prompt, validated.workspaceId),
      );
    }),
  );
  rpc.registerMethod(
    'task.listScheduled',
    safeHandler((params) => {
      const workspaceId =
        params && typeof params === 'object' && 'workspaceId' in params
          ? (params as { workspaceId?: string }).workspaceId
          : undefined;
      return Promise.resolve(schedulerService.listSchedules(workspaceId));
    }),
  );
  rpc.registerMethod(
    'task.cancelScheduled',
    safeHandler((params) => {
      const validated = validate(z.object({ scheduleId: z.string().min(1) }), params);
      schedulerService.deleteSchedule(validated.scheduleId);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'task.setScheduleEnabled',
    safeHandler((params) => {
      const validated = validate(
        z.object({ scheduleId: z.string().min(1), enabled: z.boolean() }),
        params,
      );
      schedulerService.setEnabled(validated.scheduleId, validated.enabled);
      return Promise.resolve();
    }),
  );
}
