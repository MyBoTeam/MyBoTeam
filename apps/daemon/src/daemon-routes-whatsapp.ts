import { validate } from '@myboteam/agent-core';
import { z } from 'zod';
import type { RouteServices } from './daemon-routes.js';
import { safeHandler } from './daemon-routes-middleware.js';

export function registerWhatsAppRoutes(services: RouteServices): void {
  const { rpc, whatsappService } = services;

  rpc.registerMethod(
    'whatsapp.connect',
    safeHandler(() => whatsappService.connect()),
  );
  rpc.registerMethod(
    'whatsapp.disconnect',
    safeHandler(() => whatsappService.disconnect()),
  );
  rpc.registerMethod(
    'whatsapp.getConfig',
    safeHandler(() => Promise.resolve(whatsappService.getConfig())),
  );
  rpc.registerMethod(
    'whatsapp.resync',
    safeHandler(() => whatsappService.resync()),
  );
  rpc.registerMethod(
    'whatsapp.setEnabled',
    safeHandler((params) => {
      const validated = validate(z.object({ enabled: z.boolean() }), params);
      whatsappService.setEnabled(validated.enabled);
      return Promise.resolve();
    }),
  );
}
