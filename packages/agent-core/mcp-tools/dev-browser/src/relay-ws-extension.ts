import type {
  ConnectedTarget,
  ExtensionEventMessage,
  ExtensionMessage,
  ExtensionResponseMessage,
  RelayContext,
  TargetInfo,
} from './relay-protocol.js';
import { sendAttachedToTarget, sendToPlaywright } from './relay-transport.js';

export function createExtensionWsHandler(ctx: RelayContext) {
  return () => ({
    onOpen(
      _event: unknown,
      ws: { close: (code: number, reason?: string) => void; send: (data: string) => void },
    ) {
      if (ctx.extensionWs.current) {
        ctx.log('Closing existing extension connection');
        ctx.extensionWs.current.close(4001, 'Extension Replaced');
        ctx.connectedTargets.clear();
        ctx.namedPages.clear();
        for (const pending of ctx.extensionPendingRequests.values())
          pending.reject(new Error('Extension connection replaced'));
        ctx.extensionPendingRequests.clear();
      }
      ctx.extensionWs.current = ws as any;
      ctx.log('Extension connected');
    },
    async onMessage(
      event: { data: unknown },
      ws: { close: (code: number, reason?: string) => void },
    ) {
      let message: ExtensionMessage;
      try {
        message = JSON.parse(event.data as string);
      } catch {
        ws.close(1000, 'Invalid JSON');
        return;
      }
      if ('id' in message && typeof message.id === 'number') {
        const pending = ctx.extensionPendingRequests.get(message.id);
        if (!pending) {
          ctx.log('Unexpected response with id:', message.id);
          return;
        }
        ctx.extensionPendingRequests.delete(message.id);
        if ((message as ExtensionResponseMessage).error) {
          pending.reject(new Error((message as ExtensionResponseMessage).error));
        } else {
          pending.resolve((message as ExtensionResponseMessage).result);
        }
        return;
      }
      if ('method' in message && message.method === 'log') {
        const { level, args } = (message as { params: { level: string; args: string[] } }).params;
        console.log(`[extension:${level}]`, ...args);
        return;
      }
      if ('method' in message && message.method === 'forwardCDPEvent') {
        const eventMsg = message as ExtensionEventMessage;
        const { method, params, sessionId } = eventMsg.params;
        if (method === 'Target.attachedToTarget') {
          const targetParams = params as { sessionId: string; targetInfo: TargetInfo };
          const target: ConnectedTarget = {
            sessionId: targetParams.sessionId,
            targetId: targetParams.targetInfo.targetId,
            targetInfo: targetParams.targetInfo,
          };
          ctx.connectedTargets.set(targetParams.sessionId, target);
          ctx.log(`Target attached: ${targetParams.targetInfo.url} (${targetParams.sessionId})`);
          sendAttachedToTarget(target, ctx);
        } else if (method === 'Target.detachedFromTarget') {
          const detachParams = params as { sessionId: string };
          ctx.connectedTargets.delete(detachParams.sessionId);
          for (const [name, sid] of ctx.namedPages) {
            if (sid === detachParams.sessionId) {
              ctx.namedPages.delete(name);
              break;
            }
          }
          ctx.log(`Target detached: ${detachParams.sessionId}`);
          sendToPlaywright({ method: 'Target.detachedFromTarget', params: detachParams }, ctx);
        } else if (method === 'Target.targetInfoChanged') {
          const infoParams = params as { targetInfo: TargetInfo };
          for (const target of ctx.connectedTargets.values()) {
            if (target.targetId === infoParams.targetInfo.targetId) {
              target.targetInfo = infoParams.targetInfo;
              break;
            }
          }
          sendToPlaywright({ method: 'Target.targetInfoChanged', params: infoParams }, ctx);
        } else {
          sendToPlaywright({ sessionId, method, params }, ctx);
        }
      }
    },
    onClose(_event: unknown, ws: { close: (code: number, reason?: string) => void }) {
      if (ctx.extensionWs.current && ctx.extensionWs.current !== ws) {
        ctx.log('Old extension connection closed');
        return;
      }
      ctx.log('Extension disconnected');
      for (const pending of ctx.extensionPendingRequests.values())
        pending.reject(new Error('Extension connection closed'));
      ctx.extensionPendingRequests.clear();
      ctx.extensionWs.current = null;
      ctx.connectedTargets.clear();
      ctx.namedPages.clear();
      for (const client of ctx.playwrightClients.values())
        client.ws.close(1000, 'Extension disconnected');
      ctx.playwrightClients.clear();
    },
    onError(event: unknown) {
      ctx.log('Extension WebSocket error:', event);
    },
  });
}
