import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { BaileysEventEmitter } from '../../../src/whatsapp/baileys-types.js';
import { createStore } from '../../../src/whatsapp/whatsapp-store.js';

function createMockEmitter(): {
  emitter: BaileysEventEmitter;
  emit: (event: string, data: unknown) => void;
} {
  const handlers = new Map<string, Array<(data: unknown) => void>>();
  return {
    emitter: {
      on(event: string, handler: (data: unknown) => void) {
        if (!handlers.has(event)) handlers.set(event, []);
        handlers.get(event)!.push(handler);
      },
      off(event: string, handler: (data: unknown) => void) {
        const h = handlers.get(event);
        if (h) {
          const idx = h.indexOf(handler);
          if (idx >= 0) h.splice(idx, 1);
        }
      },
      removeAllListeners: vi.fn(),
    } as unknown as BaileysEventEmitter,
    emit(event: string, data: unknown) {
      handlers.get(event)?.forEach((h) => h(data));
    },
  };
}

const JID_1 = '972501234567@s.whatsapp.net';
const JID_2 = '972509876543@s.whatsapp.net';

describe('WhatsAppStore', () => {
  describe('chats', () => {
    it('should start empty', () => {
      const { emitter } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);
      expect(store.getChats()).toEqual([]);
    });

    it('should populate from messaging-history.set', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messaging-history.set', {
        chats: [
          { id: JID_1, name: 'Contact A', conversationTimestamp: 1000 },
          { id: JID_2, name: 'Contact B', conversationTimestamp: 2000 },
        ],
        messages: [],
      });

      const chats = store.getChats();
      expect(chats).toHaveLength(2);
      expect(chats[0].jid).toBe(JID_1);
      expect(chats[0].name).toBe('Contact A');
      expect(chats[1].jid).toBe(JID_2);
      expect(chats[1].name).toBe('Contact B');
    });

    it('should replace chats on subsequent messaging-history.set', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messaging-history.set', {
        chats: [{ id: JID_1, name: 'Contact A', conversationTimestamp: 1000 }],
        messages: [],
      });

      emit('messaging-history.set', {
        chats: [{ id: JID_2, name: 'Contact B', conversationTimestamp: 2000 }],
        messages: [],
      });

      const chats = store.getChats();
      expect(chats).toHaveLength(1);
      expect(chats[0].jid).toBe(JID_2);
    });

    it('should add chats on chats.upsert', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: JID_1, name: 'Contact A' }]);

      const chats = store.getChats();
      expect(chats).toHaveLength(1);
      expect(chats[0].jid).toBe(JID_1);
      expect(chats[0].name).toBe('Contact A');
    });

    it('should update existing chat on chats.upsert with same id', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: JID_1, name: 'Old Name' }]);
      emit('chats.upsert', [{ id: JID_1, name: 'New Name' }]);

      const chats = store.getChats();
      expect(chats).toHaveLength(1);
      expect(chats[0].name).toBe('New Name');
    });

    it('should update chat name on chats.update', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: JID_1, name: 'Old Name' }]);
      emit('chats.update', [{ id: JID_1, name: 'Updated Name' }]);

      const chats = store.getChats();
      expect(chats[0].name).toBe('Updated Name');
    });

    it('should update chat conversationTimestamp on chats.update', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: JID_1, name: 'A', conversationTimestamp: 100 }]);
      emit('chats.update', [{ id: JID_1, conversationTimestamp: 200 }]);

      expect(store.getChats()[0].lastMessageAt).toBe(200);
    });

    it('should not add new chat on chats.update if not already present', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.update', [{ id: JID_1, name: 'Ghost Update' }]);

      expect(store.getChats()).toHaveLength(0);
    });

    it('should remove chat on chats.delete', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: JID_1, name: 'Contact A' }]);
      emit('chats.delete', [JID_1]);

      expect(store.getChats()).toHaveLength(0);
    });
  });

  describe('messages', () => {
    it('should start empty for any jid', () => {
      const { emitter } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      expect(store.getMessages(JID_1, 1000)).toEqual([]);
    });

    it('should populate from messaging-history.set', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messaging-history.set', {
        chats: [],
        messages: [
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
            message: { conversation: 'Hello' },
            messageTimestamp: 1000,
          },
          {
            key: { remoteJid: JID_1, fromMe: true, id: 'msg-2' },
            message: { conversation: 'Hi back' },
            messageTimestamp: 1001,
          },
        ],
      });

      const msgs = store.getMessages(JID_1, 1000);
      expect(msgs).toHaveLength(2);
    });

    it('should store messages by jid separately', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messaging-history.set', {
        chats: [],
        messages: [
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
            message: { conversation: 'Hello' },
            messageTimestamp: 1000,
          },
          {
            key: { remoteJid: JID_2, fromMe: false, id: 'msg-2' },
            message: { conversation: 'World' },
            messageTimestamp: 1001,
          },
        ],
      });

      expect(store.getMessages(JID_1, 1000)).toHaveLength(1);
      expect(store.getMessages(JID_2, 1000)).toHaveLength(1);
    });

    it('should deduplicate messages with same id on messages.upsert', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      const msg = {
        key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
        message: { conversation: 'Hello' },
        messageTimestamp: 1000,
      };

      emit('messages.upsert', { messages: [msg] });
      emit('messages.upsert', { messages: [msg] });

      expect(store.getMessages(JID_1, 1000)).toHaveLength(1);
    });

    it('should update existing message on messages.upsert with same id and different content', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messages.upsert', {
        messages: [
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
            message: { conversation: 'Original' },
            messageTimestamp: 1000,
          },
        ],
      });

      emit('messages.upsert', {
        messages: [
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
            message: { conversation: 'Updated' },
            messageTimestamp: 1001,
          },
        ],
      });

      expect(store.getMessages(JID_1, 1000)).toHaveLength(1);
    });

    it('should apply update on messages.update', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messages.upsert', {
        messages: [
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
            message: { conversation: 'Hello' },
            messageTimestamp: 1000,
          },
        ],
      });

      emit('messages.update', [
        {
          key: { remoteJid: JID_1, id: 'msg-1' },
          update: { messageTimestamp: 2000 },
        },
      ]);

      const msgs = store.getMessages(JID_1, 1000);
      expect(msgs[0].timestamp).toBe(2000);
    });

    it('should remove message on messages.delete by key', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messaging-history.set', {
        chats: [],
        messages: [
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
            message: { conversation: 'Hello' },
            messageTimestamp: 1000,
          },
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-2' },
            message: { conversation: 'World' },
            messageTimestamp: 1001,
          },
        ],
      });

      emit('messages.delete', { keys: [{ remoteJid: JID_1, id: 'msg-1' }] });

      const msgs = store.getMessages(JID_1, 1000);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].messageId).toBe('msg-2');
    });

    it('should clear all messages for jid on messages.delete with all=true', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messaging-history.set', {
        chats: [],
        messages: [
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
            message: { conversation: 'Hello' },
            messageTimestamp: 1000,
          },
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-2' },
            message: { conversation: 'World' },
            messageTimestamp: 1001,
          },
        ],
      });

      emit('messages.delete', { jid: JID_1, all: true });

      expect(store.getMessages(JID_1, 1000)).toEqual([]);
    });

    it('should skip messages.upsert without remoteJid', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messages.upsert', {
        messages: [
          {
            key: { fromMe: false, id: 'no-jid' },
            message: { conversation: 'No JID' },
            messageTimestamp: 1000,
          },
        ],
      });

      expect(store.getMessages(JID_1, 1000)).toEqual([]);
    });

    it('should skip messages.upsert without message id', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messages.upsert', {
        messages: [
          {
            key: { remoteJid: JID_1, fromMe: false },
            message: { conversation: 'No ID' },
            messageTimestamp: 1000,
          },
        ],
      });

      expect(store.getMessages(JID_1, 1000)).toEqual([]);
    });

    it('should skip messages.update for unknown jid', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messages.update', [
        {
          key: { remoteJid: JID_1, id: 'msg-1' },
          update: { messageTimestamp: 2000 },
        },
      ]);

      expect(store.getMessages(JID_1, 1000)).toEqual([]);
    });

    it('should not delete messages on messages.delete with all=false', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messaging-history.set', {
        chats: [],
        messages: [
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
            message: { conversation: 'Hello' },
            messageTimestamp: 1000,
          },
        ],
      });

      emit('messages.delete', { jid: JID_1, all: false });

      expect(store.getMessages(JID_1, 1000)).toHaveLength(1);
    });

    it('should skip chats.upsert with empty id', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: '', name: 'No ID' }]);

      expect(store.getChats()).toHaveLength(0);
    });

    it('should remove messages for deleted chat on chats.delete', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messaging-history.set', {
        chats: [{ id: JID_1, name: 'A' }],
        messages: [
          {
            key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
            message: { conversation: 'Hello' },
            messageTimestamp: 1000,
          },
        ],
      });

      emit('chats.delete', [JID_1]);

      expect(store.getMessages(JID_1, 1000)).toEqual([]);
    });
  });

  describe('messaging-history.set message preservation', () => {
    const JID_A = '972501111111@s.whatsapp.net';

    it('preserves existing messages from messages.upsert across history.set', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      const upsertMsg = {
        key: { remoteJid: JID_A, fromMe: false, id: 'msg-upsert-1' },
        message: { conversation: 'from upsert' },
        messageTimestamp: 200,
      };
      emit('messages.upsert', { messages: [upsertMsg] });

      emit('messaging-history.set', {
        chats: [],
        messages: [
          {
            key: { remoteJid: JID_A, fromMe: false, id: 'msg-hist-1' },
            message: { conversation: 'from history' },
            messageTimestamp: 50,
          },
        ],
      });

      const msgs = store.getMessages(JID_A, 10);
      expect(msgs).toHaveLength(2);
      const ids = msgs.map((m) => m.messageId);
      expect(ids).toContain('msg-upsert-1');
      expect(ids).toContain('msg-hist-1');
    });

    it('does not add duplicate messages from history.set', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      const msg = {
        key: { remoteJid: JID_A, fromMe: false, id: 'msg-dup' },
        message: { conversation: 'original' },
        messageTimestamp: 100,
      };
      emit('messages.upsert', { messages: [msg] });

      emit('messaging-history.set', {
        chats: [],
        messages: [
          {
            key: { remoteJid: JID_A, fromMe: false, id: 'msg-dup' },
            message: { conversation: 'from history' },
            messageTimestamp: 100,
          },
        ],
      });

      const msgs = store.getMessages(JID_A, 10);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].text).toBe('original');
    });

    it('preserves messages across multiple history.set events', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messages.upsert', {
        messages: [
          {
            key: { remoteJid: JID_A, fromMe: false, id: 'msg-live' },
            message: { conversation: 'live message' },
            messageTimestamp: 300,
          },
        ],
      });

      emit('messaging-history.set', {
        chats: [],
        messages: [
          {
            key: { remoteJid: JID_A, fromMe: false, id: 'msg-h1' },
            message: { conversation: 'hist 1' },
            messageTimestamp: 100,
          },
        ],
      });

      let msgs = store.getMessages(JID_A, 10);
      expect(msgs).toHaveLength(2);

      emit('messaging-history.set', {
        chats: [],
        messages: [
          {
            key: { remoteJid: JID_A, fromMe: false, id: 'msg-h2' },
            message: { conversation: 'hist 2' },
            messageTimestamp: 200,
          },
        ],
      });

      msgs = store.getMessages(JID_A, 10);
      expect(msgs).toHaveLength(3);
      const ids = msgs.map((m) => m.messageId);
      expect(ids).toContain('msg-live');
      expect(ids).toContain('msg-h1');
      expect(ids).toContain('msg-h2');
    });

    it('replaces chats but preserves messages across history.set', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('messages.upsert', {
        messages: [
          {
            key: { remoteJid: JID_A, fromMe: false, id: 'msg-keep' },
            message: { conversation: 'keep me' },
            messageTimestamp: 100,
          },
        ],
      });

      emit('messaging-history.set', {
        chats: [{ id: JID_A, name: 'Contact A', conversationTimestamp: 100 }],
        messages: [],
      });

      expect(store.getChats()).toHaveLength(1);
      expect(store.getChats()[0].jid).toBe(JID_A);

      const msgs = store.getMessages(JID_A, 10);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].messageId).toBe('msg-keep');
    });
  });

  describe('persistence', () => {
    it('should save and reload chats from disk', () => {
      const storePath = path.join(os.tmpdir(), `whatsapp-store-test-${Date.now()}.json`);
      try {
        const { emitter, emit } = createMockEmitter();
        const store = createStore(storePath);
        store.bind(emitter);

        emit('messaging-history.set', {
          chats: [{ id: JID_1, name: 'Contact A', conversationTimestamp: 1000 }],
          messages: [
            {
              key: { remoteJid: JID_1, fromMe: false, id: 'msg-1' },
              message: { conversation: 'Hello' },
              messageTimestamp: 1000,
            },
          ],
        });

        expect(fs.existsSync(storePath)).toBe(true);

        const reloaded = createStore(storePath);
        const chats = reloaded.getChats();
        expect(chats).toHaveLength(1);
        expect(chats[0].jid).toBe(JID_1);
        expect(chats[0].name).toBe('Contact A');

        const msgs = reloaded.getMessages(JID_1, 1000);
        expect(msgs).toHaveLength(1);
        expect(msgs[0].messageId).toBe('msg-1');
      } finally {
        try {
          fs.unlinkSync(storePath);
        } catch {
          /* cleanup */
        }
      }
    });

    it('should start fresh when no persisted file exists', () => {
      const storePath = path.join(os.tmpdir(), `whatsapp-store-nonexistent-${Date.now()}.json`);
      const store = createStore(storePath);
      expect(store.getChats()).toEqual([]);
    });

    it('should handle corrupted persisted file gracefully', () => {
      const storePath = path.join(os.tmpdir(), `whatsapp-store-corrupt-${Date.now()}.json`);
      try {
        fs.writeFileSync(storePath, 'not valid json', 'utf-8');
        const store = createStore(storePath);
        expect(store.getChats()).toEqual([]);
      } finally {
        try {
          fs.unlinkSync(storePath);
        } catch {
          /* cleanup */
        }
      }
    });
  });
});
