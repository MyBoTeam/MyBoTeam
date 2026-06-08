import { describe, expect, it } from 'vitest';
import type { BaileysEventEmitter } from '../../../src/whatsapp/baileys-types.js';
import { createStore } from '../../../src/whatsapp/whatsapp-store.js';

function createMockEmitter(): {
  emitter: BaileysEventEmitter;
  emit: (event: string, data: unknown) => void;
} {
  const handlers = new Map<string, (data: unknown) => void>();
  return {
    emitter: {
      on(event: string, handler: (data: unknown) => void) {
        handlers.set(event, handler);
      },
      removeAllListeners() {
        handlers.clear();
      },
    } as unknown as BaileysEventEmitter,
    emit(event: string, data: unknown) {
      handlers.get(event)?.(data);
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
      expect(store.chats.all()).toEqual([]);
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

      const chats = store.chats.all();
      expect(chats).toHaveLength(2);
      expect(chats[0].id).toBe(JID_1);
      expect(chats[0].name).toBe('Contact A');
      expect(chats[1].id).toBe(JID_2);
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

      const chats = store.chats.all();
      expect(chats).toHaveLength(1);
      expect(chats[0].id).toBe(JID_2);
    });

    it('should add chats on chats.upsert', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: JID_1, name: 'Contact A' }]);

      const chats = store.chats.all();
      expect(chats).toHaveLength(1);
      expect(chats[0].id).toBe(JID_1);
      expect(chats[0].name).toBe('Contact A');
    });

    it('should update existing chat on chats.upsert with same id', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: JID_1, name: 'Old Name' }]);
      emit('chats.upsert', [{ id: JID_1, name: 'New Name' }]);

      const chats = store.chats.all();
      expect(chats).toHaveLength(1);
      expect(chats[0].name).toBe('New Name');
    });

    it('should update chat name on chats.update', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: JID_1, name: 'Old Name' }]);
      emit('chats.update', [{ id: JID_1, name: 'Updated Name' }]);

      const chats = store.chats.all();
      expect(chats[0].name).toBe('Updated Name');
    });

    it('should update chat conversationTimestamp on chats.update', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: JID_1, name: 'A', conversationTimestamp: 100 }]);
      emit('chats.update', [{ id: JID_1, conversationTimestamp: 200 }]);

      expect(store.chats.all()[0].conversationTimestamp).toBe(200);
    });

    it('should not add new chat on chats.update if not already present', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.update', [{ id: JID_1, name: 'Ghost Update' }]);

      expect(store.chats.all()).toHaveLength(0);
    });

    it('should remove chat on chats.delete', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: JID_1, name: 'Contact A' }]);
      emit('chats.delete', [JID_1]);

      expect(store.chats.all()).toHaveLength(0);
    });
  });

  describe('messages', () => {
    it('should start empty for any jid', () => {
      const { emitter } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      expect(store.messages[JID_1]?.all()).toBeUndefined();
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

      const msgs = store.messages[JID_1]!.all();
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

      expect(store.messages[JID_1]!.all()).toHaveLength(1);
      expect(store.messages[JID_2]!.all()).toHaveLength(1);
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

      expect(store.messages[JID_1]!.all()).toHaveLength(1);
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

      expect(store.messages[JID_1]!.all()).toHaveLength(1);
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

      const msgs = store.messages[JID_1]!.all();
      expect(msgs[0].messageTimestamp).toBe(2000);
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

      const msgs = store.messages[JID_1]!.all();
      expect(msgs).toHaveLength(1);
      expect((msgs[0].key as { id?: string | null } | null)?.id).toBe('msg-2');
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

      expect(store.messages[JID_1]?.all()).toBeUndefined();
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

      expect(store.messages[JID_1]?.all()).toBeUndefined();
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

      expect(store.messages[JID_1]?.all()).toBeUndefined();
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

      expect(store.messages[JID_1]?.all()).toBeUndefined();
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

      expect(store.messages[JID_1]!.all()).toHaveLength(1);
    });

    it('should skip chats.upsert with empty id', () => {
      const { emitter, emit } = createMockEmitter();
      const store = createStore();
      store.bind(emitter);

      emit('chats.upsert', [{ id: '', name: 'No ID' }]);

      expect(store.chats.all()).toHaveLength(0);
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

      expect(store.messages[JID_1]?.all()).toBeUndefined();
    });
  });
});
