import type { Route } from '../http-server-factory.js';
import type { WhatsAppDaemonService } from '../whatsapp-service.js';
import { toWhatsAppJid } from './normalize.js';
import {
  checkConnected,
  handleConnectionLoss,
  handleError,
  sendJson,
} from './whatsapp-api-utils.js';

export function buildSendTypingRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/send-typing',
    handler: async (data, _req, res) => {
      const { recipient } = data as { recipient?: unknown };
      if (typeof recipient !== 'string' || !recipient.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_recipient',
          message: 'A non-empty recipient is required.',
        });
        return;
      }
      if (!checkConnected(svc, res)) return;
      try {
        const jid = toWhatsAppJid(recipient.trim());
        await svc.sendTyping(jid);
        sendJson(res, { success: true });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg === 'invalid_recipient') {
          sendJson(res, {
            success: false,
            error: 'invalid_recipient',
            message: 'Recipient contains no digits and is not a valid JID.',
          });
          return;
        }
        handleConnectionLoss(svc, err);
        handleError(res, err, 'send_typing_failed');
      }
    },
  };
}

export function buildMediaRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/download-media',
    handler: async (data, _req, res) => {
      const { chatJid, messageId } = data as { chatJid?: unknown; messageId?: unknown };
      if (typeof chatJid !== 'string' || !chatJid.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_chatJid',
          message: 'A non-empty chatJid is required.',
        });
        return;
      }
      if (typeof messageId !== 'string' || !messageId.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_messageId',
          message: 'A non-empty messageId is required.',
        });
        return;
      }
      if (!checkConnected(svc, res)) return;
      try {
        const media = await svc.downloadMedia(chatJid.trim(), messageId.trim());
        if (!media) {
          sendJson(res, {
            success: false,
            error: 'media_not_found',
            message: 'Media not found or could not be downloaded.',
          });
          return;
        }
        sendJson(res, { success: true, filePath: media.filePath, mimeType: media.mimeType });
      } catch (err) {
        handleConnectionLoss(svc, err);
        handleError(res, err, 'media_download_failed');
      }
    },
  };
}

export function buildResyncRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/resync',
    handler: async (_data, _req, res) => {
      try {
        await svc.resync();
        sendJson(res, { success: true });
      } catch (err) {
        handleError(res, err, 'resync_failed');
      }
    },
  };
}

export function buildMarkReadRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/mark-read',
    handler: async (data, _req, res) => {
      const { chatJid, messageIds } = data as { chatJid?: unknown; messageIds?: unknown };
      if (typeof chatJid !== 'string' || !chatJid.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_chatJid',
          message: 'A non-empty chatJid is required.',
        });
        return;
      }
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        sendJson(res, {
          success: false,
          error: 'invalid_messageIds',
          message: 'A non-empty array of messageIds is required.',
        });
        return;
      }
      if (!checkConnected(svc, res)) return;
      try {
        await svc.markRead(chatJid.trim(), messageIds as string[]);
        sendJson(res, { success: true });
      } catch (err) {
        handleConnectionLoss(svc, err);
        handleError(res, err, 'mark_read_failed');
      }
    },
  };
}
