import { validate } from '@myboteam/agent-core';
import { z } from 'zod';
import type { RouteServices } from './daemon-routes.js';
import { safeHandler } from './daemon-routes-middleware.js';

const providerIdSchema = z
  .string()
  .min(1)
  .describe('ProviderId — any value of the ProviderId type literal');

export function registerProviderRoutes(services: RouteServices): void {
  const { rpc, settingsService } = services;

  rpc.registerMethod(
    'provider.getSettings',
    safeHandler(() => Promise.resolve(settingsService.getProviderSettings())),
  );
  rpc.registerMethod(
    'provider.setActive',
    safeHandler((params) => {
      const v = validate(z.object({ providerId: providerIdSchema.nullable() }), params);
      settingsService.setActiveProvider(
        v.providerId as Parameters<typeof settingsService.setActiveProvider>[0],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'provider.setConnected',
    safeHandler((params) => {
      const v = validate(z.object({ providerId: providerIdSchema, provider: z.unknown() }), params);
      settingsService.setConnectedProvider(
        v.providerId as Parameters<typeof settingsService.setConnectedProvider>[0],
        v.provider as Parameters<typeof settingsService.setConnectedProvider>[1],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'provider.removeConnected',
    safeHandler((params) => {
      const v = validate(z.object({ providerId: providerIdSchema }), params);
      settingsService.removeConnectedProvider(
        v.providerId as Parameters<typeof settingsService.removeConnectedProvider>[0],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'provider.updateModel',
    safeHandler((params) => {
      const v = validate(
        z.object({ providerId: providerIdSchema, modelId: z.string().nullable() }),
        params,
      );
      settingsService.updateProviderModel(
        v.providerId as Parameters<typeof settingsService.updateProviderModel>[0],
        v.modelId,
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'provider.setDebugMode',
    safeHandler((params) => {
      const v = validate(z.object({ enabled: z.boolean() }), params);
      settingsService.setProviderDebugMode(v.enabled);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'provider.getDebugMode',
    safeHandler(() => Promise.resolve(settingsService.getProviderDebugMode())),
  );
  rpc.registerMethod(
    'provider.getHuggingFaceLocalConfig',
    safeHandler(() => Promise.resolve(settingsService.getHuggingFaceLocalConfig())),
  );
  rpc.registerMethod(
    'provider.setHuggingFaceLocalConfig',
    safeHandler((params) => {
      const v = validate(z.object({ config: z.unknown().nullable() }), params);
      settingsService.setHuggingFaceLocalConfig(
        v.config as Parameters<typeof settingsService.setHuggingFaceLocalConfig>[0],
      );
      return Promise.resolve();
    }),
  );
}
