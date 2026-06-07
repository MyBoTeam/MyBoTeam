import { validate } from '@myboteam/agent-core';
import { z } from 'zod';
import type { RouteServices } from './daemon-routes.js';
import { safeHandler } from './daemon-routes-middleware.js';

export function registerWorkspaceRoutes(services: RouteServices): void {
  const { rpc, workspaceService } = services;

  const workspaceIdParam = z.object({ workspaceId: z.string().min(1) });

  rpc.registerMethod(
    'workspace.list',
    safeHandler(() => Promise.resolve(workspaceService.list())),
  );
  rpc.registerMethod(
    'workspace.get',
    safeHandler((params) => {
      const v = validate(workspaceIdParam, params);
      return Promise.resolve(workspaceService.get(v.workspaceId));
    }),
  );
  rpc.registerMethod(
    'workspace.getActive',
    safeHandler(() => Promise.resolve(workspaceService.getActive())),
  );
  rpc.registerMethod(
    'workspace.setActive',
    safeHandler((params) => {
      const v = validate(workspaceIdParam, params);
      return Promise.resolve(workspaceService.setActive(v.workspaceId));
    }),
  );
  rpc.registerMethod(
    'workspace.create',
    safeHandler((params) => {
      const v = validate(z.object({ input: z.unknown() }), params);
      return Promise.resolve(
        workspaceService.create(v.input as Parameters<typeof workspaceService.create>[0]),
      );
    }),
  );
  rpc.registerMethod(
    'workspace.update',
    safeHandler((params) => {
      const v = validate(z.object({ workspaceId: z.string().min(1), input: z.unknown() }), params);
      return Promise.resolve(
        workspaceService.update(
          v.workspaceId,
          v.input as Parameters<typeof workspaceService.update>[1],
        ),
      );
    }),
  );
  rpc.registerMethod(
    'workspace.delete',
    safeHandler((params) => {
      const v = validate(workspaceIdParam, params);
      return Promise.resolve(workspaceService.delete(v.workspaceId));
    }),
  );

  // ── Knowledge notes ──
  const noteKeyParam = z.object({
    noteId: z.string().min(1),
    workspaceId: z.string().min(1),
  });

  rpc.registerMethod(
    'knowledgeNote.list',
    safeHandler((params) => {
      const v = validate(workspaceIdParam, params);
      return Promise.resolve(workspaceService.listKnowledgeNotes(v.workspaceId));
    }),
  );
  rpc.registerMethod(
    'knowledgeNote.get',
    safeHandler((params) => {
      const v = validate(noteKeyParam, params);
      return Promise.resolve(workspaceService.getKnowledgeNote(v.noteId, v.workspaceId));
    }),
  );
  rpc.registerMethod(
    'knowledgeNote.create',
    safeHandler((params) => {
      const v = validate(z.object({ input: z.unknown() }), params);
      return Promise.resolve(
        workspaceService.createKnowledgeNote(
          v.input as Parameters<typeof workspaceService.createKnowledgeNote>[0],
        ),
      );
    }),
  );
  rpc.registerMethod(
    'knowledgeNote.update',
    safeHandler((params) => {
      const v = validate(
        z.object({
          noteId: z.string().min(1),
          workspaceId: z.string().min(1),
          input: z.unknown(),
        }),
        params,
      );
      return Promise.resolve(
        workspaceService.updateKnowledgeNote(
          v.noteId,
          v.workspaceId,
          v.input as Parameters<typeof workspaceService.updateKnowledgeNote>[2],
        ),
      );
    }),
  );
  rpc.registerMethod(
    'knowledgeNote.delete',
    safeHandler((params) => {
      const v = validate(noteKeyParam, params);
      workspaceService.deleteKnowledgeNote(v.noteId, v.workspaceId);
      return Promise.resolve();
    }),
  );

  workspaceService.on('workspace.changed', (payload) => {
    rpc.notify('workspace.changed', payload);
  });
}
