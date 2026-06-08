import { describe, expect, it, vi } from 'vitest';

const connectedConfig = { status: 'connected', phoneNumber: '+15551234567' };
const disconnectedConfig = { status: 'disconnected' };
const connectingConfig = { status: 'connecting' };

function createMockSvc(config: Record<string, unknown> = {}) {
  return {
    getConfig: vi.fn(() => config),
    sendMessage: vi.fn(),
    sendReaction: vi.fn(),
    sendPoll: vi.fn(),
    sendTyping: vi.fn(),
    markRead: vi.fn(),
    downloadMedia: vi.fn(),
    readChats: vi.fn(),
    readMessages: vi.fn(),
    readGroups: vi.fn(),
    readGroupInfo: vi.fn(),
    disconnect: vi.fn(),
    markDisconnected: vi.fn(),
  };
}

function createRes() {
  return { writeHead: vi.fn(), end: vi.fn() };
}

function getPayload(res: ReturnType<typeof createRes>): Record<string, unknown> {
  return JSON.parse(res.end.mock.calls[0][0]);
}

describe('buildSendRoute', () => {
  it('rejects empty recipient', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendRoute(svc as any);
    const res = createRes();
    await route.handler({ recipient: '', message: 'hi' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_recipient');
  });

  it('rejects empty message', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendRoute(svc as any);
    const res = createRes();
    await route.handler({ recipient: '+1', message: '' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_message');
  });

  it('returns not_connected when disconnected', async () => {
    const svc = createMockSvc(disconnectedConfig);
    const { buildSendRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendRoute(svc as any);
    const res = createRes();
    await route.handler({ recipient: '+1', message: 'hi' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('not_connected');
  });

  it('returns not_connected when connecting', async () => {
    const svc = createMockSvc(connectingConfig);
    const { buildSendRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendRoute(svc as any);
    const res = createRes();
    await route.handler({ recipient: '+1', message: 'hi' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('not_connected');
  });

  it('calls sendMessage on valid input and returns messageId', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.sendMessage.mockResolvedValue('msg-1');
    const { buildSendRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendRoute(svc as any);
    const res = createRes();
    await route.handler({ recipient: '+15551234567', message: 'Hello' }, {} as any, res as any);
    expect(svc.sendMessage).toHaveBeenCalledWith('15551234567@s.whatsapp.net', 'Hello');
    const payload = getPayload(res);
    expect(payload.success).toBe(true);
    expect(payload.messageId).toBe('msg-1');
  });

  it('rejects recipient with no digits after stripping', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.sendMessage.mockRejectedValue(new Error('invalid_recipient'));
    const { buildSendRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendRoute(svc as any);
    const res = createRes();
    await route.handler({ recipient: 'abc', message: 'hi' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_recipient');
  });

  it('marks disconnected on connection loss error', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.sendMessage.mockRejectedValue(new Error('connection closed'));
    const { buildSendRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendRoute(svc as any);
    const res = createRes();
    await route.handler({ recipient: '+15551234567', message: 'hi' }, {} as any, res as any);
    expect(svc.markDisconnected).toHaveBeenCalled();
  });
});

describe('buildSendReactionRoute', () => {
  it('rejects missing chatJid', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendReactionRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendReactionRoute(svc as any);
    const res = createRes();
    await route.handler({ messageId: 'm1', emoji: '👍' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_chatJid');
  });

  it('rejects missing messageId', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendReactionRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendReactionRoute(svc as any);
    const res = createRes();
    await route.handler({ chatJid: 'jid', emoji: '👍' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_messageId');
  });

  it('rejects missing emoji', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendReactionRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendReactionRoute(svc as any);
    const res = createRes();
    await route.handler({ chatJid: 'jid', messageId: 'm1' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_emoji');
  });

  it('calls sendReaction with valid input', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendReactionRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendReactionRoute(svc as any);
    const res = createRes();
    await route.handler({ chatJid: 'jid', messageId: 'm1', emoji: '👍' }, {} as any, res as any);
    expect(svc.sendReaction).toHaveBeenCalledWith('jid', 'm1', '👍');
    expect(getPayload(res).success).toBe(true);
  });
});

describe('buildSendPollRoute', () => {
  it('rejects missing recipient', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendPollRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendPollRoute(svc as any);
    const res = createRes();
    await route.handler({ question: 'Q', options: ['A', 'B'] }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_recipient');
  });

  it('rejects missing question', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendPollRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendPollRoute(svc as any);
    const res = createRes();
    await route.handler({ recipient: '+1', options: ['A', 'B'] }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_question');
  });

  it('rejects less than 2 options', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendPollRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendPollRoute(svc as any);
    const res = createRes();
    await route.handler({ recipient: '+1', question: 'Q', options: ['A'] }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_options');
  });

  it('calls sendPoll with valid input', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.sendPoll.mockResolvedValue('poll-1');
    const { buildSendPollRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendPollRoute(svc as any);
    const res = createRes();
    await route.handler(
      { recipient: '+15551234567', question: 'Best?', options: ['A', 'B', 'C'] },
      {} as any,
      res as any,
    );
    expect(svc.sendPoll).toHaveBeenCalledWith('15551234567@s.whatsapp.net', 'Best?', [
      'A',
      'B',
      'C',
    ]);
    const payload = getPayload(res);
    expect(payload.success).toBe(true);
    expect(payload.messageId).toBe('poll-1');
  });
});

describe('buildSendTypingRoute', () => {
  it('rejects missing recipient', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendTypingRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendTypingRoute(svc as any);
    const res = createRes();
    await route.handler({}, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_recipient');
  });

  it('calls sendTyping with valid recipient', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildSendTypingRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendTypingRoute(svc as any);
    const res = createRes();
    await route.handler({ recipient: '972501234567' }, {} as any, res as any);
    expect(svc.sendTyping).toHaveBeenCalledWith('972501234567@s.whatsapp.net');
    expect(getPayload(res).success).toBe(true);
  });
});

describe('buildMediaRoute', () => {
  it('rejects missing chatJid', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildMediaRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildMediaRoute(svc as any);
    const res = createRes();
    await route.handler({ messageId: 'm1' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_chatJid');
  });

  it('rejects missing messageId', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildMediaRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildMediaRoute(svc as any);
    const res = createRes();
    await route.handler({ chatJid: 'jid' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_messageId');
  });

  it('returns media_not_found when downloadMedia returns null', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.downloadMedia.mockResolvedValue(null);
    const { buildMediaRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildMediaRoute(svc as any);
    const res = createRes();
    await route.handler({ chatJid: 'jid', messageId: 'm1' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('media_not_found');
  });

  it('returns filePath and mimeType on successful download', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.downloadMedia.mockResolvedValue({ filePath: '/tmp/media', mimeType: 'image/jpeg' });
    const { buildMediaRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildMediaRoute(svc as any);
    const res = createRes();
    await route.handler({ chatJid: 'jid', messageId: 'm1' }, {} as any, res as any);
    const payload = getPayload(res);
    expect(payload.success).toBe(true);
    expect(payload.filePath).toBe('/tmp/media');
    expect(payload.mimeType).toBe('image/jpeg');
  });
});

describe('buildMarkReadRoute', () => {
  it('rejects missing chatJid', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildMarkReadRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildMarkReadRoute(svc as any);
    const res = createRes();
    await route.handler({ messageIds: ['m1'] }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_chatJid');
  });

  it('rejects empty messageIds', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildMarkReadRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildMarkReadRoute(svc as any);
    const res = createRes();
    await route.handler({ chatJid: 'jid', messageIds: [] }, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_messageIds');
  });

  it('calls markRead with valid input', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildMarkReadRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildMarkReadRoute(svc as any);
    const res = createRes();
    await route.handler({ chatJid: 'jid', messageIds: ['m1', 'm2'] }, {} as any, res as any);
    expect(svc.markRead).toHaveBeenCalledWith('jid', ['m1', 'm2']);
    expect(getPayload(res).success).toBe(true);
  });
});

describe('buildChatsRoute', () => {
  it('returns chats from readChats', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.readChats.mockReturnValue([{ jid: 'jid1', name: 'Test' }]);
    const { buildChatsRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildChatsRoute(svc as any);
    const res = createRes();
    await route.handler({ limit: 5 }, {} as any, res as any);
    expect(svc.readChats).toHaveBeenCalledWith(5);
    expect(getPayload(res).chats).toEqual([{ jid: 'jid1', name: 'Test' }]);
  });

  it('defaults limit to 20 when not provided', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.readChats.mockReturnValue([]);
    const { buildChatsRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildChatsRoute(svc as any);
    const res = createRes();
    await route.handler({}, {} as any, res as any);
    expect(svc.readChats).toHaveBeenCalledWith(20);
  });

  it('caps limit at 100', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.readChats.mockReturnValue([]);
    const { buildChatsRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildChatsRoute(svc as any);
    const res = createRes();
    await route.handler({ limit: 999 }, {} as any, res as any);
    expect(svc.readChats).toHaveBeenCalledWith(100);
  });
});

describe('buildMessagesRoute', () => {
  it('rejects missing jid', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildMessagesRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildMessagesRoute(svc as any);
    const res = createRes();
    await route.handler({}, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_jid');
  });

  it('returns messages from readMessages', async () => {
    const svc = createMockSvc(connectedConfig);
    const msgs = [{ messageId: 'm1', senderJid: 'me', fromMe: true, text: 'hi', timestamp: 1000 }];
    svc.readMessages.mockReturnValue(msgs);
    const { buildMessagesRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildMessagesRoute(svc as any);
    const res = createRes();
    await route.handler({ jid: 'jid1', limit: 10 }, {} as any, res as any);
    expect(svc.readMessages).toHaveBeenCalledWith('jid1', 10);
    expect(getPayload(res).messages).toEqual(msgs);
  });
});

describe('buildGroupsRoute', () => {
  it('returns groups from readGroups', async () => {
    const svc = createMockSvc(connectedConfig);
    const groups = [{ jid: 'gid@g.us', name: 'Group', participants: 3 }];
    svc.readGroups.mockReturnValue(groups);
    const { buildGroupsRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildGroupsRoute(svc as any);
    const res = createRes();
    await route.handler({ limit: 5 }, {} as any, res as any);
    expect(svc.readGroups).toHaveBeenCalledWith(5);
    expect(getPayload(res).groups).toEqual(groups);
  });
});

describe('buildGroupInfoRoute', () => {
  it('rejects missing groupJid', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildGroupInfoRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildGroupInfoRoute(svc as any);
    const res = createRes();
    await route.handler({}, {} as any, res as any);
    expect(getPayload(res).error).toBe('invalid_groupJid');
  });

  it('returns group_not_found when readGroupInfo returns null', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.readGroupInfo.mockReturnValue(null);
    const { buildGroupInfoRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildGroupInfoRoute(svc as any);
    const res = createRes();
    await route.handler({ groupJid: 'gid@g.us' }, {} as any, res as any);
    expect(getPayload(res).error).toBe('group_not_found');
  });

  it('returns group info when found', async () => {
    const svc = createMockSvc(connectedConfig);
    const info = { jid: 'gid@g.us', name: 'My Group' };
    svc.readGroupInfo.mockReturnValue(info);
    const { buildGroupInfoRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildGroupInfoRoute(svc as any);
    const res = createRes();
    await route.handler({ groupJid: 'gid@g.us' }, {} as any, res as any);
    expect(svc.readGroupInfo).toHaveBeenCalledWith('gid@g.us');
    expect(getPayload(res).group).toEqual(info);
  });
});

describe('buildStatusRoute', () => {
  it('returns config from getConfig', async () => {
    const svc = createMockSvc(connectedConfig);
    const { buildStatusRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildStatusRoute(svc as any);
    const res = createRes();
    await route.handler({}, {} as any, res as any);
    const payload = getPayload(res);
    expect(payload.success).toBe(true);
    expect(payload.config).toEqual(connectedConfig);
  });
});

describe('buildLogoutRoute', () => {
  it('calls disconnect and returns success', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.disconnect.mockResolvedValue(undefined);
    const { buildLogoutRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildLogoutRoute(svc as any);
    const res = createRes();
    await route.handler({}, {} as any, res as any);
    expect(svc.disconnect).toHaveBeenCalled();
    expect(getPayload(res).success).toBe(true);
  });

  it('handles disconnect error', async () => {
    const svc = createMockSvc(connectedConfig);
    svc.disconnect.mockRejectedValue(new Error('fail'));
    const { buildLogoutRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildLogoutRoute(svc as any);
    const res = createRes();
    await route.handler({}, {} as any, res as any);
    expect(getPayload(res).error).toBe('logout_failed');
  });
});
