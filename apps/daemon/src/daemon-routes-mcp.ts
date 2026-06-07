import { validate } from '@myboteam/agent-core';
import { z } from 'zod';
import type { RouteServices } from './daemon-routes.js';
import { safeHandler } from './daemon-routes-middleware.js';

export function registerMcpRoutes(services: RouteServices): void {
  const { rpc, connectorService, secretsService } = services;

  // ── Secrets ──
  rpc.registerMethod(
    'secrets.storeApiKey',
    safeHandler((params) => {
      const v = validate(
        z.object({ provider: z.string().min(1), apiKey: z.string().min(1) }),
        params,
      );
      secretsService.storeApiKey(v.provider, v.apiKey);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'secrets.getApiKey',
    safeHandler((params) => {
      const v = validate(z.object({ provider: z.string().min(1) }), params);
      return Promise.resolve(secretsService.getApiKey(v.provider));
    }),
  );
  rpc.registerMethod(
    'secrets.deleteApiKey',
    safeHandler((params) => {
      const v = validate(z.object({ provider: z.string().min(1) }), params);
      return Promise.resolve(secretsService.deleteApiKey(v.provider));
    }),
  );
  rpc.registerMethod(
    'secrets.getAllApiKeys',
    safeHandler(() => secretsService.getAllApiKeys()),
  );
  rpc.registerMethod(
    'secrets.hasAnyApiKey',
    safeHandler(() => secretsService.hasAnyApiKey()),
  );
  rpc.registerMethod(
    'secrets.storeBedrockCredentials',
    safeHandler((params) => {
      const v = validate(z.object({ credentials: z.string().min(1) }), params);
      secretsService.storeBedrockCredentials(v.credentials);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'secrets.getBedrockCredentials',
    safeHandler(() => Promise.resolve(secretsService.getBedrockCredentials())),
  );
  rpc.registerMethod(
    'secrets.clear',
    safeHandler(() => {
      secretsService.clear();
      return Promise.resolve();
    }),
  );

  // ── Connectors ──
  rpc.registerMethod(
    'connectors.list',
    safeHandler(() => Promise.resolve(connectorService.list())),
  );
  rpc.registerMethod(
    'connectors.getEnabled',
    safeHandler(() => Promise.resolve(connectorService.getEnabled())),
  );
  rpc.registerMethod(
    'connectors.getById',
    safeHandler((params) => {
      const v = validate(z.object({ id: z.string().min(1) }), params);
      return Promise.resolve(connectorService.getById(v.id));
    }),
  );
  rpc.registerMethod(
    'connectors.upsert',
    safeHandler((params) => {
      const v = validate(z.object({ connector: z.unknown() }), params);
      connectorService.upsert(v.connector as Parameters<typeof connectorService.upsert>[0]);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'connectors.setEnabled',
    safeHandler((params) => {
      const v = validate(z.object({ id: z.string().min(1), enabled: z.boolean() }), params);
      connectorService.setEnabled(v.id, v.enabled);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'connectors.setStatus',
    safeHandler((params) => {
      const v = validate(z.object({ id: z.string().min(1), status: z.unknown() }), params);
      connectorService.setStatus(
        v.id,
        v.status as Parameters<typeof connectorService.setStatus>[1],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'connectors.delete',
    safeHandler((params) => {
      const v = validate(z.object({ id: z.string().min(1) }), params);
      connectorService.delete(v.id);
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'connectors.storeTokens',
    safeHandler((params) => {
      const v = validate(z.object({ connectorId: z.string().min(1), tokens: z.unknown() }), params);
      connectorService.storeTokens(
        v.connectorId,
        v.tokens as Parameters<typeof connectorService.storeTokens>[1],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'connectors.getTokens',
    safeHandler((params) => {
      const v = validate(z.object({ connectorId: z.string().min(1) }), params);
      return Promise.resolve(connectorService.getTokens(v.connectorId));
    }),
  );
  rpc.registerMethod(
    'connectors.deleteTokens',
    safeHandler((params) => {
      const v = validate(z.object({ connectorId: z.string().min(1) }), params);
      connectorService.deleteTokens(v.connectorId);
      return Promise.resolve();
    }),
  );

  // ── Connector auth entries ──
  const connectorKeyParam = z.object({ connectorKey: z.string().min(1) });
  rpc.registerMethod(
    'connectors.authEntry.read',
    safeHandler((params) => {
      const v = validate(connectorKeyParam, params);
      return Promise.resolve(connectorService.readAuthEntry(v.connectorKey));
    }),
  );
  rpc.registerMethod(
    'connectors.authEntry.write',
    safeHandler((params) => {
      const v = validate(z.object({ connectorKey: z.string().min(1), entry: z.unknown() }), params);
      connectorService.writeAuthEntry(
        v.connectorKey,
        v.entry as Parameters<typeof connectorService.writeAuthEntry>[1],
      );
      return Promise.resolve();
    }),
  );
  rpc.registerMethod(
    'connectors.authEntry.delete',
    safeHandler((params) => {
      const v = validate(connectorKeyParam, params);
      connectorService.deleteAuthEntry(v.connectorKey);
      return Promise.resolve();
    }),
  );
}
