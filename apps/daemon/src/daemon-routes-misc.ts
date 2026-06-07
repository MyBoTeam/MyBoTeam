import { type StorageDeps, validate } from '@myboteam/agent-core';
import { z } from 'zod';
import type { RouteServices } from './daemon-routes.js';
import { safeHandler } from './daemon-routes-middleware.js';

const taskIdSchema = z.object({ taskId: z.string().min(1) });

export function registerMiscRoutes(services: RouteServices): void {
  const { rpc, myboteamRuntime, storageService } = services;
  const storage = storageService.getStorage();

  const myboteamStorageDeps: StorageDeps = {
    readKey: (key) => storage.get(key),
    writeKey: (key, value) => storage.set(key, value),
    readGaClientId: () => null,
  };
  rpc.registerMethod(
    'myboteam-ai.connect',
    safeHandler(async () => {
      const result = await myboteamRuntime.connect(myboteamStorageDeps);
      return { deviceFingerprint: result.deviceFingerprint, usage: result.usage };
    }),
  );
  rpc.registerMethod(
    'myboteam-ai.get-usage',
    safeHandler(async () => myboteamRuntime.getUsage()),
  );
  rpc.registerMethod(
    'myboteam-ai.disconnect',
    safeHandler(async () => {
      myboteamRuntime.disconnect();
      return Promise.resolve();
    }),
  );

  myboteamRuntime.onUsageUpdate((usage) => {
    rpc.notify('myboteam-ai.usage-update', usage);
  });

  rpc.registerMethod(
    'favorites.list',
    safeHandler(() => Promise.resolve(storage.getFavorites())),
  );
  rpc.registerMethod(
    'favorites.add',
    safeHandler((params) => {
      const v = validate(
        z.object({
          taskId: z.string().min(1),
          prompt: z.string(),
          summary: z.string().optional(),
        }),
        params,
      );
      storage.addFavorite(v.taskId, v.prompt, v.summary);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'favorites.remove',
    safeHandler((params) => {
      const v = validate(taskIdSchema, params);
      storage.removeFavorite(v.taskId);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'favorites.isFavorite',
    safeHandler((params) => {
      const v = validate(taskIdSchema, params);
      return Promise.resolve(storage.isFavorite(v.taskId));
    }),
  );

  rpc.registerMethod(
    'logs.getTasksForBugReport',
    safeHandler(() => Promise.resolve(storage.getTasks())),
  );
}
