import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';
import type { RelayContext, RelayOptions, RelayServer } from './relay-protocol.js';
import { sendToExtension } from './relay-transport.js';
import { createExtensionWsHandler } from './relay-ws-extension.js';
import { createPlaywrightWsHandler } from './relay-ws-playwright.js';

export async function serveRelay(options: RelayOptions = {}): Promise<RelayServer> {
  const port = options.port ?? 9224;
  const host = options.host ?? '127.0.0.1';

  const ctx: RelayContext = {
    connectedTargets: new Map(),
    namedPages: new Map(),
    playwrightClients: new Map(),
    extensionWs: { current: null },
    extensionPendingRequests: new Map(),
    extensionMessageId: { current: 0 },
    log: (...args: unknown[]) => console.log('[relay]', ...args),
  };

  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  app.get('/', (c) => {
    return c.json({
      wsEndpoint: `ws://${host}:${port}/cdp`,
      extensionConnected: ctx.extensionWs.current !== null,
      mode: 'extension',
    });
  });

  app.get('/pages', (c) => {
    return c.json({ pages: Array.from(ctx.namedPages.keys()) });
  });

  app.post('/pages', async (c) => {
    const body = await c.req.json();
    const name = body.name as string;
    if (!name) return c.json({ error: 'name is required' }, 400);
    const existingSessionId = ctx.namedPages.get(name);
    if (existingSessionId) {
      const target = ctx.connectedTargets.get(existingSessionId);
      if (target) {
        await sendToExtension(
          {
            method: 'forwardCDPCommand',
            params: { method: 'Target.activateTarget', params: { targetId: target.targetId } },
          },
          ctx,
        );
        return c.json({
          wsEndpoint: `ws://${host}:${port}/cdp`,
          name,
          targetId: target.targetId,
          url: target.targetInfo.url,
        });
      }
      ctx.namedPages.delete(name);
    }
    if (!ctx.extensionWs.current) return c.json({ error: 'Extension not connected' }, 503);
    try {
      const result = (await sendToExtension(
        {
          method: 'forwardCDPCommand',
          params: { method: 'Target.createTarget', params: { url: 'about:blank' } },
        },
        ctx,
      )) as { targetId: string };
      await new Promise((resolve) => setTimeout(resolve, 200));
      for (const [sessionId, target] of ctx.connectedTargets) {
        if (target.targetId === result.targetId) {
          ctx.namedPages.set(name, sessionId);
          await sendToExtension(
            {
              method: 'forwardCDPCommand',
              params: { method: 'Target.activateTarget', params: { targetId: target.targetId } },
            },
            ctx,
          );
          return c.json({
            wsEndpoint: `ws://${host}:${port}/cdp`,
            name,
            targetId: target.targetId,
            url: target.targetInfo.url,
          });
        }
      }
      throw new Error('Target created but not found in registry');
    } catch (err) {
      ctx.log('Error creating tab:', err);
      return c.json({ error: (err as Error).message }, 500);
    }
  });

  app.delete('/pages/:name', (c) => {
    const name = c.req.param('name');
    return c.json({ success: ctx.namedPages.delete(name) });
  });

  app.get('/cdp/:clientId?', upgradeWebSocket(createPlaywrightWsHandler(ctx)));
  app.get('/extension', upgradeWebSocket(createExtensionWsHandler(ctx)));

  const server = serve({ fetch: app.fetch, port, hostname: host });
  injectWebSocket(server);

  const wsEndpoint = `ws://${host}:${port}/cdp`;
  ctx.log('CDP relay server started');
  ctx.log(`  HTTP: http://${host}:${port}`);
  ctx.log(`  CDP endpoint: ${wsEndpoint}`);
  ctx.log(`  Extension endpoint: ws://${host}:${port}/extension`);
  ctx.log('');
  ctx.log('Waiting for extension to connect...');

  return {
    wsEndpoint,
    port,
    async stop() {
      for (const client of ctx.playwrightClients.values()) client.ws.close(1000, 'Server stopped');
      ctx.playwrightClients.clear();
      ctx.extensionWs.current?.close(1000, 'Server stopped');
      server.close();
    },
  };
}
