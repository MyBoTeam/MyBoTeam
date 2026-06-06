import type {
  CDPEvent,
  CDPResponse,
  ConnectedTarget,
  PlaywrightClient,
  RelayContext,
} from './relay-protocol.js';

export function sendToPlaywright(
  message: CDPResponse | CDPEvent,
  ctx: RelayContext,
  clientId?: string,
): void {
  const messageStr = JSON.stringify(message);
  if (clientId) {
    const client = ctx.playwrightClients.get(clientId);
    if (client) client.ws.send(messageStr);
  } else {
    for (const client of ctx.playwrightClients.values()) {
      client.ws.send(messageStr);
    }
  }
}

export function sendAttachedToTarget(
  target: ConnectedTarget,
  ctx: RelayContext,
  clientId?: string,
  waitingForDebugger = false,
): void {
  const event: CDPEvent = {
    method: 'Target.attachedToTarget',
    params: {
      sessionId: target.sessionId,
      targetInfo: { ...target.targetInfo, attached: true },
      waitingForDebugger,
    },
  };
  const doSend = (client: PlaywrightClient) => {
    if (!client.knownTargets.has(target.targetId)) {
      client.knownTargets.add(target.targetId);
      client.ws.send(JSON.stringify(event));
    }
  };
  if (clientId) {
    const client = ctx.playwrightClients.get(clientId);
    if (client) doSend(client);
  } else {
    for (const client of ctx.playwrightClients.values()) doSend(client);
  }
}

export async function sendToExtension(
  {
    method,
    params,
    timeout = 30000,
  }: { method: string; params?: Record<string, unknown>; timeout?: number },
  ctx: RelayContext,
): Promise<unknown> {
  if (!ctx.extensionWs.current) throw new Error('Extension not connected');
  const id = ++ctx.extensionMessageId.current;
  ctx.extensionWs.current.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      ctx.extensionPendingRequests.delete(id);
      reject(new Error(`Extension request timeout after ${timeout}ms: ${method}`));
    }, timeout);
    ctx.extensionPendingRequests.set(id, {
      resolve: (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      reject: (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    });
  });
}

export async function routeCdpCommand(
  {
    method,
    params,
    sessionId,
  }: { method: string; params?: Record<string, unknown>; sessionId?: string },
  ctx: RelayContext,
): Promise<unknown> {
  const forwardToExtension = (p: {
    sessionId?: string;
    method: string;
    params?: Record<string, unknown>;
  }) => sendToExtension({ method: 'forwardCDPCommand', params: p }, ctx);
  switch (method) {
    case 'Browser.getVersion':
      return {
        protocolVersion: '1.3',
        product: 'Chrome/Extension-Bridge',
        revision: '1.0.0',
        userAgent: 'dev-browser-relay/1.0.0',
        jsVersion: 'V8',
      };
    case 'Browser.setDownloadBehavior':
      return {};
    case 'Target.setAutoAttach':
      if (sessionId) break;
      return {};
    case 'Target.setDiscoverTargets':
      return {};
    case 'Target.attachToBrowserTarget':
      return { sessionId: 'browser' };
    case 'Target.detachFromTarget':
      if (sessionId === 'browser' || params?.sessionId === 'browser') return {};
      break;
    case 'Target.attachToTarget': {
      const targetId = params?.targetId as string;
      if (!targetId) throw new Error('targetId is required for Target.attachToTarget');
      for (const target of ctx.connectedTargets.values()) {
        if (target.targetId === targetId) return { sessionId: target.sessionId };
      }
      throw new Error(`Target ${targetId} not found in connected targets`);
    }
    case 'Target.getTargetInfo': {
      const targetId = params?.targetId as string;
      if (targetId) {
        for (const target of ctx.connectedTargets.values()) {
          if (target.targetId === targetId) return { targetInfo: target.targetInfo };
        }
      }
      if (sessionId) {
        const target = ctx.connectedTargets.get(sessionId);
        if (target) return { targetInfo: target.targetInfo };
      }
      const firstTarget = Array.from(ctx.connectedTargets.values())[0];
      return { targetInfo: firstTarget?.targetInfo };
    }
    case 'Target.getTargets':
      return {
        targetInfos: Array.from(ctx.connectedTargets.values()).map((t) => ({
          ...t.targetInfo,
          attached: true,
        })),
      };
    case 'Target.createTarget':
    case 'Target.closeTarget':
      return await forwardToExtension({ method, params });
  }
  return await forwardToExtension({ sessionId, method, params });
}
