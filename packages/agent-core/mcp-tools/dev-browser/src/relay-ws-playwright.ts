import type { CDPCommand, PlaywrightClient, RelayContext } from './relay-protocol.js';
import { routeCdpCommand, sendAttachedToTarget, sendToPlaywright } from './relay-transport.js';

export function createPlaywrightWsHandler(ctx: RelayContext) {
  return (c: { req: { param: (key: string) => string } }) => {
    const clientId =
      c.req.param('clientId') || `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return {
      onOpen(
        _event: unknown,
        ws: { close: (code: number, reason: string) => void; send: (data: string) => void },
      ) {
        if (ctx.playwrightClients.has(clientId)) {
          ctx.log(`Rejecting duplicate client ID: ${clientId}`);
          ws.close(1000, 'Client ID already connected');
          return;
        }
        const client: PlaywrightClient = { id: clientId, ws: ws as any, knownTargets: new Set() };
        ctx.playwrightClients.set(clientId, client);
        ctx.log(`Playwright client connected: ${clientId}`);
      },
      async onMessage(event: { data: unknown }, _ws: unknown) {
        let message: CDPCommand;
        try {
          message = JSON.parse(event.data as string);
        } catch {
          return;
        }
        const { id, sessionId, method, params } = message;
        if (!ctx.extensionWs.current) {
          sendToPlaywright(
            { id, sessionId, error: { message: 'Extension not connected' } },
            ctx,
            clientId,
          );
          return;
        }
        try {
          const result = await routeCdpCommand({ method, params, sessionId }, ctx);
          if (method === 'Target.setAutoAttach' && !sessionId) {
            for (const target of ctx.connectedTargets.values())
              sendAttachedToTarget(target, ctx, clientId);
          }
          if (
            method === 'Target.setDiscoverTargets' &&
            (params as { discover?: boolean })?.discover
          ) {
            for (const target of ctx.connectedTargets.values()) {
              sendToPlaywright(
                {
                  method: 'Target.targetCreated',
                  params: { targetInfo: { ...target.targetInfo, attached: true } },
                },
                ctx,
                clientId,
              );
            }
          }
          if (method === 'Target.attachToTarget' && (result as { sessionId?: string })?.sessionId) {
            const targetId = params?.targetId as string;
            const target = Array.from(ctx.connectedTargets.values()).find(
              (t) => t.targetId === targetId,
            );
            if (target) sendAttachedToTarget(target, ctx, clientId);
          }
          sendToPlaywright({ id, sessionId, result }, ctx, clientId);
        } catch (e) {
          ctx.log('Error handling CDP command:', method, e);
          sendToPlaywright(
            { id, sessionId, error: { message: (e as Error).message } },
            ctx,
            clientId,
          );
        }
      },
      onClose() {
        ctx.playwrightClients.delete(clientId);
        ctx.log(`Playwright client disconnected: ${clientId}`);
      },
      onError(event: unknown) {
        ctx.log(`Playwright WebSocket error [${clientId}]:`, event);
      },
    };
  };
}
