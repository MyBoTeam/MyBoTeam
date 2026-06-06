import type {
  GwsAccountAddInput,
  GwsAccountStatusChangedPayload,
  SkillsChangedPayload,
} from '@myboteam/agent-core';
import { validate } from '@myboteam/agent-core';
import { z } from 'zod';
import type { RouteServices } from './daemon-routes.js';
import { safeHandler } from './daemon-routes-middleware.js';

export function registerGoogleRoutes(services: RouteServices): void {
  const { rpc, googleAccountService, skillsService } = services;

  // ── Google accounts ──
  rpc.registerMethod(
    'gwsAccount.list',
    safeHandler(() => Promise.resolve(googleAccountService.list())),
  );
  rpc.registerMethod(
    'gwsAccount.add',
    safeHandler((params) => {
      const v = validate(
        z.object({
          input: z.object({
            googleAccountId: z.string().min(1),
            email: z.string().min(1),
            displayName: z.string(),
            pictureUrl: z.string().nullable(),
            label: z.string().min(1),
            connectedAt: z.string().min(1),
            token: z.object({
              accessToken: z.string().min(1),
              refreshToken: z.string().min(1),
              expiresAt: z.number(),
              scopes: z.array(z.string()),
            }),
          }),
        }),
        params,
      );
      googleAccountService.add(v.input as GwsAccountAddInput);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'gwsAccount.remove',
    safeHandler((params) => {
      const v = validate(z.object({ googleAccountId: z.string().min(1) }), params);
      googleAccountService.remove(v.googleAccountId);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'gwsAccount.updateLabel',
    safeHandler((params) => {
      const v = validate(
        z.object({ googleAccountId: z.string().min(1), label: z.string().min(1) }),
        params,
      );
      googleAccountService.updateLabel(v.googleAccountId, v.label);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'gwsAccount.updateToken',
    safeHandler((params) => {
      const v = validate(
        z.object({
          googleAccountId: z.string().min(1),
          token: z.object({
            accessToken: z.string().min(1),
            refreshToken: z.string().min(1),
            expiresAt: z.number(),
            scopes: z.array(z.string()),
          }),
          connectedAt: z.string().min(1),
        }),
        params,
      );
      googleAccountService.updateToken(v.googleAccountId, v.token, v.connectedAt);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'gwsAccount.getToken',
    safeHandler((params) => {
      const v = validate(z.object({ googleAccountId: z.string().min(1) }), params);
      return Promise.resolve(googleAccountService.getToken(v.googleAccountId));
    }),
  );
  rpc.registerMethod(
    'gwsAccount.refreshNow',
    safeHandler(async (params) => {
      const v = validate(z.object({ googleAccountId: z.string().min(1) }), params);
      await googleAccountService.refreshNow(v.googleAccountId);
    }),
  );

  googleAccountService.on('gwsAccount.statusChanged', (payload: GwsAccountStatusChangedPayload) => {
    rpc.notify('gwsAccount.statusChanged', payload);
  });

  // ── Skills ──
  rpc.registerMethod(
    'skills.list',
    safeHandler(() => Promise.resolve(skillsService.list())),
  );
  rpc.registerMethod(
    'skills.listEnabled',
    safeHandler(() => Promise.resolve(skillsService.listEnabled())),
  );
  rpc.registerMethod(
    'skills.setEnabled',
    safeHandler((params) => {
      const v = validate(z.object({ skillId: z.string().min(1), enabled: z.boolean() }), params);
      skillsService.setEnabled(v.skillId, v.enabled);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'skills.getContent',
    safeHandler((params) => {
      const v = validate(z.object({ skillId: z.string().min(1) }), params);
      return Promise.resolve(skillsService.getContent(v.skillId));
    }),
  );
  rpc.registerMethod(
    'skills.addFromPath',
    safeHandler(async (params) => {
      const v = validate(z.object({ sourcePath: z.string().min(1) }), params);
      return await skillsService.addFromPath(v.sourcePath);
    }),
  );
  rpc.registerMethod(
    'skills.delete',
    safeHandler((params) => {
      const v = validate(z.object({ skillId: z.string().min(1) }), params);
      skillsService.delete(v.skillId);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'skills.resync',
    safeHandler(async () => await skillsService.resync()),
  );
  rpc.registerMethod(
    'skills.getUserSkillsPath',
    safeHandler(() => Promise.resolve(skillsService.getUserSkillsPath())),
  );

  skillsService.on('skills.changed', (payload: SkillsChangedPayload) => {
    rpc.notify('skills.changed', payload);
  });
}
