import { validate } from '@myboteam/agent-core';
import { z } from 'zod';
import type { RouteServices } from './daemon-routes.js';
import { safeHandler } from './daemon-routes-middleware.js';

const taskIdSchema = z.object({ taskId: z.string().min(1) });

export function registerMiscRoutes(services: RouteServices): void {
  const { rpc, storageService } = services;
  const storage = storageService.getStorage();

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
