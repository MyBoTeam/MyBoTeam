import type { Route } from '../http-server-factory.js';
import type { WhatsAppDaemonService } from '../whatsapp-service.js';
import { toWhatsAppJid } from './normalize.js';
import {
  checkConnected,
  handleConnectionLoss,
  handleError,
  sendJson,
} from './whatsapp-api-utils.js';

export function buildSendRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/send',
    handler: async (data, _req, res) => {
      const { recipient, message } = data as { recipient?: unknown; message?: unknown };
      if (typeof recipient !== 'string' || !recipient.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_recipient',
          message: 'A non-empty recipient is required.',
        });
        return;
      }
      if (typeof message !== 'string' || !message.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_message',
          message: 'A non-empty message body is required.',
        });
        return;
      }
      if (!checkConnected(svc, res)) return;
      try {
        const jid = toWhatsAppJid(recipient.trim());
        const messageId = await svc.sendMessage(jid, message);
        sendJson(res, { success: true, messageId });
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
        handleError(res, err, 'send_failed');
      }
    },
  };
}

export function buildSendReactionRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/send-reaction',
    handler: async (data, _req, res) => {
      const { chatJid, messageId, emoji } = data as {
        chatJid?: unknown;
        messageId?: unknown;
        emoji?: unknown;
      };
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
      if (typeof emoji !== 'string' || !emoji.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_emoji',
          message: 'A non-empty emoji is required.',
        });
        return;
      }
      if (!checkConnected(svc, res)) return;
      try {
        await svc.sendReaction(chatJid.trim(), messageId.trim(), emoji.trim());
        sendJson(res, { success: true });
      } catch (err) {
        handleConnectionLoss(svc, err);
        handleError(res, err, 'send_reaction_failed');
      }
    },
  };
}

export function buildSendPollRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/send-poll',
    handler: async (data, _req, res) => {
      const { recipient, question, options } = data as {
        recipient?: unknown;
        question?: unknown;
        options?: unknown;
      };
      if (typeof recipient !== 'string' || !recipient.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_recipient',
          message: 'A non-empty recipient is required.',
        });
        return;
      }
      if (typeof question !== 'string' || !question.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_question',
          message: 'A non-empty poll question is required.',
        });
        return;
      }
      if (!Array.isArray(options) || options.length < 2) {
        sendJson(res, {
          success: false,
          error: 'invalid_options',
          message: 'At least 2 poll options are required.',
        });
        return;
      }
      if (!checkConnected(svc, res)) return;
      try {
        const jid = toWhatsAppJid(recipient.trim());
        const messageId = await svc.sendPoll(jid, question, options as string[]);
        sendJson(res, { success: true, messageId });
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
        handleError(res, err, 'send_poll_failed');
      }
    },
  };
}
