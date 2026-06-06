import { validate } from '@myboteam/agent-core';
import { z } from 'zod';
import type { RouteServices } from './daemon-routes.js';
import { safeHandler } from './daemon-routes-middleware.js';

export function registerModelConfigRoutes(services: RouteServices): void {
  const { rpc, settingsService } = services;

  rpc.registerMethod(
    'settings.getSelectedModel',
    safeHandler(() => Promise.resolve(settingsService.getSelectedModel())),
  );
  rpc.registerMethod(
    'settings.setSelectedModel',
    safeHandler((params) => {
      const v = validate(z.object({ model: z.unknown() }), params);
      settingsService.setSelectedModel(
        v.model as Parameters<typeof settingsService.setSelectedModel>[0],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getOpenAiBaseUrl',
    safeHandler(() => Promise.resolve(settingsService.getOpenAiBaseUrl())),
  );
  rpc.registerMethod(
    'settings.setOpenAiBaseUrl',
    safeHandler((params) => {
      const v = validate(z.object({ baseUrl: z.string() }), params);
      settingsService.setOpenAiBaseUrl(v.baseUrl);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getOllamaConfig',
    safeHandler(() => Promise.resolve(settingsService.getOllamaConfig())),
  );
  rpc.registerMethod(
    'settings.setOllamaConfig',
    safeHandler((params) => {
      const v = validate(z.object({ config: z.unknown().nullable() }), params);
      settingsService.setOllamaConfig(
        v.config as Parameters<typeof settingsService.setOllamaConfig>[0],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getLiteLLMConfig',
    safeHandler(() => Promise.resolve(settingsService.getLiteLLMConfig())),
  );
  rpc.registerMethod(
    'settings.setLiteLLMConfig',
    safeHandler((params) => {
      const v = validate(z.object({ config: z.unknown().nullable() }), params);
      settingsService.setLiteLLMConfig(
        v.config as Parameters<typeof settingsService.setLiteLLMConfig>[0],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getAzureFoundryConfig',
    safeHandler(() => Promise.resolve(settingsService.getAzureFoundryConfig())),
  );
  rpc.registerMethod(
    'settings.setAzureFoundryConfig',
    safeHandler((params) => {
      const v = validate(z.object({ config: z.unknown().nullable() }), params);
      settingsService.setAzureFoundryConfig(
        v.config as Parameters<typeof settingsService.setAzureFoundryConfig>[0],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getLMStudioConfig',
    safeHandler(() => Promise.resolve(settingsService.getLMStudioConfig())),
  );
  rpc.registerMethod(
    'settings.setLMStudioConfig',
    safeHandler((params) => {
      const v = validate(z.object({ config: z.unknown().nullable() }), params);
      settingsService.setLMStudioConfig(
        v.config as Parameters<typeof settingsService.setLMStudioConfig>[0],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getNimConfig',
    safeHandler(() => Promise.resolve(settingsService.getNimConfig())),
  );
  rpc.registerMethod(
    'settings.setNimConfig',
    safeHandler((params) => {
      const v = validate(z.object({ config: z.unknown().nullable() }), params);
      settingsService.setNimConfig(v.config as Parameters<typeof settingsService.setNimConfig>[0]);
      return Promise.resolve();
    }),
  );
}
