import type { SettingsChangePayload } from '@myboteam/agent-core';
import { validate } from '@myboteam/agent-core';
import { z } from 'zod';
import type { RouteServices } from './daemon-routes.js';
import { safeHandler } from './daemon-routes-middleware.js';

export function registerSettingsRoutes(services: RouteServices): void {
  const { rpc, settingsService } = services;

  rpc.registerMethod(
    'settings.getAll',
    safeHandler(() => Promise.resolve(settingsService.getAll())),
  );
  rpc.registerMethod(
    'settings.setTheme',
    safeHandler((params) => {
      const v = validate(z.object({ theme: z.enum(['system', 'light', 'dark']) }), params);
      settingsService.setTheme(v.theme);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.setThemeColor',
    safeHandler((params) => {
      const v = validate(
        z.object({ themeColor: z.enum(['mint', 'blue', 'lemon', 'peach', 'lavender', 'neutral']) }),
        params,
      );
      settingsService.setThemeColor(v.themeColor);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.setLanguage',
    safeHandler((params) => {
      const v = validate(
        z.object({ language: z.enum(['auto', 'en', 'zh-CN', 'ru', 'fr']) }),
        params,
      );
      settingsService.setLanguage(v.language);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.setDebugMode',
    safeHandler((params) => {
      const v = validate(z.object({ enabled: z.boolean() }), params);
      settingsService.setDebugMode(v.enabled);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.setNotificationsEnabled',
    safeHandler((params) => {
      const v = validate(z.object({ enabled: z.boolean() }), params);
      settingsService.setNotificationsEnabled(v.enabled);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getNotificationsEnabled',
    safeHandler(() => Promise.resolve(settingsService.getNotificationsEnabled())),
  );
  rpc.registerMethod(
    'settings.setCloseBehavior',
    safeHandler((params) => {
      const v = validate(z.object({ behavior: z.enum(['keep-daemon', 'stop-daemon']) }), params);
      settingsService.setCloseBehavior(v.behavior);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getCloseBehavior',
    safeHandler(() => Promise.resolve(settingsService.getCloseBehavior())),
  );
  rpc.registerMethod(
    'settings.setSandboxConfig',
    safeHandler((params) => {
      const v = validate(z.object({ config: z.unknown() }), params);
      settingsService.setSandboxConfig(
        v.config as Parameters<typeof settingsService.setSandboxConfig>[0],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getSandboxConfig',
    safeHandler(() => Promise.resolve(settingsService.getSandboxConfig())),
  );
  rpc.registerMethod(
    'settings.setCloudBrowserConfig',
    safeHandler((params) => {
      const v = validate(z.object({ config: z.unknown().nullable() }), params);
      settingsService.setCloudBrowserConfig(
        v.config as Parameters<typeof settingsService.setCloudBrowserConfig>[0],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getCloudBrowserConfig',
    safeHandler(() => Promise.resolve(settingsService.getCloudBrowserConfig())),
  );
  rpc.registerMethod(
    'settings.setMessagingConfig',
    safeHandler((params) => {
      const v = validate(z.object({ config: z.unknown().nullable() }), params);
      settingsService.setMessagingConfig(
        v.config as Parameters<typeof settingsService.setMessagingConfig>[0],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'settings.getMessagingConfig',
    safeHandler(() => Promise.resolve(settingsService.getMessagingConfig())),
  );
  rpc.registerMethod(
    'settings.setOnboardingComplete',
    safeHandler((params) => {
      const v = validate(z.object({ complete: z.boolean() }), params);
      settingsService.setOnboardingComplete(v.complete);
      return Promise.resolve();
    }),
  );

  settingsService.on('settings.changed', (payload: SettingsChangePayload) => {
    rpc.notify('settings.changed', payload);
  });
}
