import type http from 'node:http';
import { log } from '../logger.js';
import type { WhatsAppDaemonService } from '../whatsapp-service.js';

export const WHATSAPP_CONNECTION_LOSS_PATTERNS = [
  'connection closed',
  'connection lost',
  'connection terminated',
  'connection terminated by server',
  'connection failure',
  'socket closed',
  'stream errored',
] as const;

export function sendJson(res: http.ServerResponse, payload: unknown): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

export function checkConnected(svc: WhatsAppDaemonService, res: http.ServerResponse): boolean {
  const config = svc.getConfig();
  if (config?.status !== 'connected') {
    const isConnecting = config?.status === 'connecting' || config?.status === 'qr_ready';
    sendJson(res, {
      success: false,
      error: 'not_connected',
      message: isConnecting ? 'WhatsApp is connecting...' : 'WhatsApp is not connected.',
    });
    return false;
  }
  return true;
}

export function handleError(res: http.ServerResponse, err: unknown, errorCode = 'failed'): void {
  const errMsg = err instanceof Error ? err.message : String(err);
  log.error(`[WhatsAppApi] ${errorCode}: ${errMsg}`);
  sendJson(res, { success: false, error: errorCode, message: errMsg });
}

export function handleConnectionLoss(svc: WhatsAppDaemonService, err: unknown): boolean {
  const errMsg = err instanceof Error ? err.message : String(err);
  const errLower = errMsg.toLowerCase();
  const isConnectionLoss = WHATSAPP_CONNECTION_LOSS_PATTERNS.some((p) => errLower.includes(p));
  if (isConnectionLoss) {
    svc.markDisconnected();
  }
  return isConnectionLoss;
}
