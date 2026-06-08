import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/whatsapp/index.js', async () => {
  const { EventEmitter } = await import('events');

  class MockWhatsAppService extends EventEmitter {
    sendMessage = vi.fn().mockResolvedValue('msg-1');
    sendReaction = vi.fn().mockResolvedValue(undefined);
    sendPoll = vi.fn().mockResolvedValue('poll-1');
    sendTyping = vi.fn().mockResolvedValue(undefined);
    markRead = vi.fn().mockResolvedValue(undefined);
    downloadMedia = vi.fn().mockResolvedValue({ filePath: '/tmp/test', mimeType: 'image/jpeg' });
    getChats = vi.fn().mockReturnValue([{ jid: 'jid1', name: 'Test' }]);
    getMessages = vi
      .fn()
      .mockReturnValue([
        { messageId: 'm1', senderJid: 'me', fromMe: true, text: 'hi', timestamp: 1000 },
      ]);
    getGroups = vi.fn().mockReturnValue([{ jid: 'gid@g.us', name: 'Group', participants: 3 }]);
    getGroupInfo = vi.fn().mockReturnValue({ jid: 'gid@g.us', name: 'Group' });
    getStatus = vi.fn().mockReturnValue('connected');
    getQrCode = vi.fn().mockReturnValue(null);
    getQrIssuedAt = vi.fn().mockReturnValue(null);
    getPhoneNumber = vi.fn().mockReturnValue('+15551234567');
    connect = vi.fn().mockResolvedValue(undefined);
    disconnect = vi.fn().mockResolvedValue(undefined);
    dispose = vi.fn();
    markDisconnected = vi.fn();
  }

  class MockTaskBridge {
    setEnabled = vi.fn();
    setOwnerJid = vi.fn();
    setOwnerLid = vi.fn();
    dispose = vi.fn();
  }

  return {
    WhatsAppService: MockWhatsAppService,
    TaskBridge: MockTaskBridge,
    wireTaskBridge: vi.fn(() => ({
      bridge: new MockTaskBridge(),
    })),
    wireStatusListeners: vi.fn(),
  };
});

import { WhatsAppDaemonService } from '../../../src/whatsapp-service.js';

function createMockStorage() {
  return {
    getMessagingConfig: vi.fn(() => ({
      integrations: {
        whatsapp: { platform: 'whatsapp', enabled: true },
      },
    })),
    setMessagingConfig: vi.fn(),
  };
}

function createMockTaskService() {
  return {
    on: vi.fn(),
    startTask: vi.fn(),
    listTasks: vi.fn(() => []),
    getActiveTaskCount: vi.fn(() => 0),
  };
}

describe('WhatsAppDaemonService passthrough methods', () => {
  function createConnectedService() {
    const storage = createMockStorage();
    const taskService = createMockTaskService();
    const svc = new WhatsAppDaemonService(storage as any, '/tmp/data', taskService as any);
    return { svc, storage, taskService };
  }

  describe('sendMessage', () => {
    it('forwards to WhatsAppService.sendMessage when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      const id = await svc.sendMessage('+15551234567', 'Hello');
      expect(id).toBe('msg-1');
    });

    it('throws when not connected', async () => {
      const { svc } = createConnectedService();
      await expect(svc.sendMessage('+1', 'hi')).rejects.toThrow('WhatsApp is not connected');
    });
  });

  describe('sendReaction', () => {
    it('forwards to WhatsAppService.sendReaction when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      await expect(svc.sendReaction('jid', 'm1', '👍')).resolves.toBeUndefined();
    });

    it('throws when not connected', async () => {
      const { svc } = createConnectedService();
      await expect(svc.sendReaction('jid', 'm1', '👍')).rejects.toThrow(
        'WhatsApp is not connected',
      );
    });
  });

  describe('sendPoll', () => {
    it('forwards to WhatsAppService.sendPoll when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      const id = await svc.sendPoll('+15551234567', 'Q', ['A', 'B']);
      expect(id).toBe('poll-1');
    });

    it('throws when not connected', async () => {
      const { svc } = createConnectedService();
      await expect(svc.sendPoll('+1', 'Q', ['A', 'B'])).rejects.toThrow(
        'WhatsApp is not connected',
      );
    });
  });

  describe('sendTyping', () => {
    it('forwards to WhatsAppService.sendTyping when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      await expect(svc.sendTyping('jid')).resolves.toBeUndefined();
    });

    it('throws when not connected', async () => {
      const { svc } = createConnectedService();
      await expect(svc.sendTyping('jid')).rejects.toThrow('WhatsApp is not connected');
    });
  });

  describe('markRead', () => {
    it('forwards to WhatsAppService.markRead when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      await expect(svc.markRead('jid', ['m1'])).resolves.toBeUndefined();
    });

    it('throws when not connected', async () => {
      const { svc } = createConnectedService();
      await expect(svc.markRead('jid', ['m1'])).rejects.toThrow('WhatsApp is not connected');
    });
  });

  describe('downloadMedia', () => {
    it('forwards to WhatsAppService.downloadMedia when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      const result = await svc.downloadMedia('jid', 'm1');
      expect(result).toEqual({ filePath: '/tmp/test', mimeType: 'image/jpeg' });
    });

    it('returns null when not connected', async () => {
      const { svc } = createConnectedService();
      const result = await svc.downloadMedia('jid', 'm1');
      expect(result).toBeNull();
    });
  });

  describe('readChats', () => {
    it('forwards to WhatsAppService.getChats when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      const chats = svc.readChats(10);
      expect(chats).toEqual([{ jid: 'jid1', name: 'Test' }]);
    });

    it('returns empty array when not connected', () => {
      const { svc } = createConnectedService();
      expect(svc.readChats(10)).toEqual([]);
    });
  });

  describe('readMessages', () => {
    it('forwards to WhatsAppService.getMessages when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      const messages = svc.readMessages('jid', 10);
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe('hi');
    });

    it('returns empty array when not connected', () => {
      const { svc } = createConnectedService();
      expect(svc.readMessages('jid', 10)).toEqual([]);
    });
  });

  describe('readGroups', () => {
    it('forwards to WhatsAppService.getGroups when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      const groups = svc.readGroups(10);
      expect(groups).toEqual([{ jid: 'gid@g.us', name: 'Group', participants: 3 }]);
    });

    it('returns empty array when not connected', () => {
      const { svc } = createConnectedService();
      expect(svc.readGroups(10)).toEqual([]);
    });
  });

  describe('readGroupInfo', () => {
    it('forwards to WhatsAppService.getGroupInfo when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      const info = svc.readGroupInfo('gid@g.us');
      expect(info).toEqual({ jid: 'gid@g.us', name: 'Group' });
    });

    it('returns null when not connected', () => {
      const { svc } = createConnectedService();
      expect(svc.readGroupInfo('gid@g.us')).toBeNull();
    });
  });

  describe('markDisconnected', () => {
    it('forwards to WhatsAppService.markDisconnected when connected', async () => {
      const { svc } = createConnectedService();
      await svc.connect();
      svc.markDisconnected();
    });

    it('does not throw when not connected', () => {
      const { svc } = createConnectedService();
      expect(() => svc.markDisconnected()).not.toThrow();
    });
  });
});
