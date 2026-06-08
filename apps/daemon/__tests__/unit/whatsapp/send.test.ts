import { mkdtempSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import {
  markMessagesRead,
  sendPoll,
  sendReaction,
  sendText,
  sendTyping,
} from '../../../src/whatsapp/send.js';

function createMockSocket() {
  return {
    sendMessage: vi.fn().mockResolvedValue({ key: { id: 'msg-1' } }),
    sendPresenceUpdate: vi.fn().mockResolvedValue(undefined),
    readMessages: vi.fn().mockResolvedValue(undefined),
  };
}

describe('sendText', () => {
  it('should send a plain text message', async () => {
    const socket = createMockSocket() as any;
    const id = await sendText(socket, '972501234567', 'Hello');
    expect(id).toBe('msg-1');
    expect(socket.sendMessage).toHaveBeenCalledWith('972501234567@s.whatsapp.net', {
      text: 'Hello',
    });
  });

  it('should send text with image attachment', async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'send-test-'));
    const testFile = join(tmpDir, 'test.jpg');
    writeFileSync(testFile, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    try {
      const socket = createMockSocket() as any;
      const id = await sendText(socket, '972501234567', 'Caption', {
        mediaPath: testFile,
        mediaType: 'image',
      });
      expect(id).toBe('msg-1');
      expect(socket.sendMessage).toHaveBeenCalledWith(
        '972501234567@s.whatsapp.net',
        expect.objectContaining({
          caption: 'Caption',
          mimetype: 'image/jpeg',
        }),
      );
    } finally {
      unlinkSync(testFile);
    }
  });

  it('should return empty string when no key in result', async () => {
    const socket = { sendMessage: vi.fn().mockResolvedValue({}) } as any;
    const id = await sendText(socket, '972501234567', 'Hello');
    expect(id).toBe('');
  });

  it('should keep jid with @ unchanged', async () => {
    const socket = createMockSocket() as any;
    await sendText(socket, 'group@g.us', 'Hello');
    expect(socket.sendMessage).toHaveBeenCalledWith('group@g.us', { text: 'Hello' });
  });
});

describe('sendReaction', () => {
  it('should send a reaction emoji', async () => {
    const socket = createMockSocket() as any;
    await sendReaction(socket, '972501234567', 'msg-1', '👍');
    expect(socket.sendMessage).toHaveBeenCalledWith(
      '972501234567@s.whatsapp.net',
      expect.objectContaining({
        react: expect.objectContaining({
          text: '👍',
          key: expect.objectContaining({
            remoteJid: '972501234567@s.whatsapp.net',
            id: 'msg-1',
            fromMe: false,
          }),
        }),
      }),
    );
  });

  it('should include participant when provided', async () => {
    const socket = createMockSocket() as any;
    await sendReaction(socket, '972501234567', 'msg-1', '👍', false, 'participant-jid');
    expect(socket.sendMessage).toHaveBeenCalledWith(
      '972501234567@s.whatsapp.net',
      expect.objectContaining({
        react: expect.objectContaining({
          key: expect.objectContaining({ participant: 'participant-jid' }),
        }),
      }),
    );
  });

  it('should set fromMe when true', async () => {
    const socket = createMockSocket() as any;
    await sendReaction(socket, '972501234567', 'msg-1', '👍', true);
    expect(socket.sendMessage).toHaveBeenCalledWith(
      '972501234567@s.whatsapp.net',
      expect.objectContaining({
        react: expect.objectContaining({
          key: expect.objectContaining({ fromMe: true }),
        }),
      }),
    );
  });
});

describe('sendPoll', () => {
  it('should send a poll with options', async () => {
    const socket = createMockSocket() as any;
    const id = await sendPoll(socket, '972501234567', 'Best?', ['A', 'B', 'C'], 2);
    expect(id).toBe('msg-1');
    expect(socket.sendMessage).toHaveBeenCalledWith(
      '972501234567@s.whatsapp.net',
      expect.objectContaining({
        poll: expect.objectContaining({
          name: 'Best?',
          values: ['A', 'B', 'C'],
          selectableCount: 2,
        }),
      }),
    );
  });

  it('should default maxSelections to 1', async () => {
    const socket = createMockSocket() as any;
    await sendPoll(socket, '972501234567', 'Q', ['A', 'B']);
    expect(socket.sendMessage).toHaveBeenCalledWith(
      '972501234567@s.whatsapp.net',
      expect.objectContaining({
        poll: expect.objectContaining({ selectableCount: 1 }),
      }),
    );
  });

  it('should throw for less than 2 options', async () => {
    const socket = createMockSocket() as any;
    await expect(sendPoll(socket, '972501234567', 'Q', ['A'])).rejects.toThrow('between 2 and 12');
  });

  it('should throw for more than 12 options', async () => {
    const socket = createMockSocket() as any;
    await expect(
      sendPoll(
        socket,
        '972501234567',
        'Q',
        Array.from({ length: 13 }, (_, i) => `${i}`),
      ),
    ).rejects.toThrow('between 2 and 12');
  });
});

describe('sendTyping', () => {
  it('should send composing presence by default', async () => {
    const socket = createMockSocket() as any;
    await sendTyping(socket, '972501234567');
    expect(socket.sendPresenceUpdate).toHaveBeenCalledWith(
      'composing',
      '972501234567@s.whatsapp.net',
    );
  });

  it('should send paused presence', async () => {
    const socket = createMockSocket() as any;
    await sendTyping(socket, '972501234567', 'paused');
    expect(socket.sendPresenceUpdate).toHaveBeenCalledWith('paused', '972501234567@s.whatsapp.net');
  });

  it('should send recording presence', async () => {
    const socket = createMockSocket() as any;
    await sendTyping(socket, '972501234567', 'recording');
    expect(socket.sendPresenceUpdate).toHaveBeenCalledWith(
      'recording',
      '972501234567@s.whatsapp.net',
    );
  });
});

describe('markMessagesRead', () => {
  it('should mark messages as read', async () => {
    const socket = createMockSocket() as any;
    await markMessagesRead(socket, '972501234567', ['msg-1', 'msg-2']);
    expect(socket.readMessages).toHaveBeenCalledWith([
      { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-1', fromMe: false },
      { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-2', fromMe: false },
    ]);
  });
});
