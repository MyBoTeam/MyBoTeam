import type { Route } from '../http-server-factory.js';
import type { WhatsAppDaemonService } from '../whatsapp-service.js';
import { checkConnected, handleError, sendJson } from './whatsapp-api-utils.js';

export function buildChatsRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/chats',
    handler: async (data, _req, res) => {
      const rawLimit = (data as { limit?: unknown }).limit;
      const parsedLimit = Math.floor(Number(rawLimit));
      const limit =
        Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;

      if (!checkConnected(svc, res)) return;

      sendJson(res, { success: true, chats: svc.readChats(limit) });
    },
  };
}

export function buildMessagesRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/messages',
    handler: async (data, _req, res) => {
      const { jid, limit: rawLimit } = data as { jid?: unknown; limit?: unknown };

      if (typeof jid !== 'string' || !jid.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_jid',
          message: 'A non-empty jid is required.',
        });
        return;
      }

      const parsedLimit = Math.floor(Number(rawLimit));
      const limit =
        Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;

      if (!checkConnected(svc, res)) return;

      sendJson(res, { success: true, messages: svc.readMessages(jid.trim(), limit) });
    },
  };
}

export function buildGroupsRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/groups',
    handler: async (data, _req, res) => {
      const rawLimit = (data as { limit?: unknown }).limit;
      const parsedLimit = Math.floor(Number(rawLimit));
      const limit =
        Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;

      if (!checkConnected(svc, res)) return;

      sendJson(res, { success: true, groups: svc.readGroups(limit) });
    },
  };
}

export function buildGroupInfoRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/group-info',
    handler: async (data, _req, res) => {
      const { groupJid } = data as { groupJid?: unknown };

      if (typeof groupJid !== 'string' || !groupJid.trim()) {
        sendJson(res, {
          success: false,
          error: 'invalid_groupJid',
          message: 'A non-empty groupJid is required.',
        });
        return;
      }

      if (!checkConnected(svc, res)) return;

      const info = svc.readGroupInfo(groupJid.trim());
      if (!info) {
        sendJson(res, { success: false, error: 'group_not_found', message: 'Group not found.' });
        return;
      }

      sendJson(res, { success: true, group: info });
    },
  };
}

export function buildStatusRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/status',
    handler: async (_data, _req, res) => {
      const config = svc.getConfig();
      sendJson(res, { success: true, config });
    },
  };
}

export function buildLogoutRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/logout',
    handler: async (_data, _req, res) => {
      try {
        await svc.disconnect();
        sendJson(res, { success: true });
      } catch (err) {
        handleError(res, err, 'logout_failed');
      }
    },
  };
}
