import { describe, expect, it } from 'vitest';

import { normalizeMessage } from '../../../src/whatsapp/normalizeMessage.js';

describe('normalizeMessage', () => {
  it('should return null when message has no message field', () => {
    const result = normalizeMessage({ key: { remoteJid: '123@s.whatsapp.net' } });
    expect(result).toBeNull();
  });

  it('should return null when message has empty text', () => {
    const result = normalizeMessage({
      key: { remoteJid: '123@s.whatsapp.net', id: 'msg-1' },
      message: { conversation: '' },
    });
    expect(result).toBeNull();
  });

  it('should return null when message has only whitespace', () => {
    const result = normalizeMessage({
      key: { remoteJid: '123@s.whatsapp.net', id: 'msg-1' },
      message: { conversation: '   ' },
    });
    expect(result).toBeNull();
  });

  it('should extract conversation text from a simple DM', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-1', fromMe: false },
      message: { conversation: 'Hello there' },
      messageTimestamp: 1000,
      pushName: 'John',
    });

    expect(result).toEqual({
      messageId: 'msg-1',
      senderId: '972501234567@s.whatsapp.net',
      senderName: 'John',
      text: 'Hello there',
      timestamp: 1000000,
      isGroup: false,
      isFromMe: false,
    });
  });

  it('should extract text from extendedTextMessage', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-2' },
      message: {
        extendedTextMessage: { text: 'Extended text' },
      },
      messageTimestamp: 2000,
    });

    expect(result?.text).toBe('Extended text');
    expect(result?.messageId).toBe('msg-2');
  });

  it('should extract caption from imageMessage', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-3' },
      message: {
        imageMessage: { caption: 'Image caption' },
      },
      messageTimestamp: 3000,
    });

    expect(result?.text).toBe('Image caption');
  });

  it('should extract caption from videoMessage', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-4' },
      message: {
        videoMessage: { caption: 'Video caption' },
      },
      messageTimestamp: 4000,
    });

    expect(result?.text).toBe('Video caption');
  });

  it('should extract caption from documentMessage', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-5' },
      message: {
        documentMessage: { caption: 'Doc caption' },
      },
      messageTimestamp: 5000,
    });

    expect(result?.text).toBe('Doc caption');
  });

  it('should extract title from documentMessage when caption is absent', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-6' },
      message: {
        documentMessage: { title: 'Doc title' },
      },
      messageTimestamp: 6000,
    });

    expect(result?.text).toBe('Doc title');
  });

  it('should detect group messages', () => {
    const result = normalizeMessage({
      key: {
        remoteJid: '123-456@g.us',
        id: 'msg-7',
        fromMe: false,
        participant: '972501234567@s.whatsapp.net',
      },
      message: { conversation: 'Group message' },
      messageTimestamp: 7000,
      pushName: 'Jane',
    });

    expect(result?.isGroup).toBe(true);
    expect(result?.senderId).toBe('972501234567@s.whatsapp.net');
  });

  it('should set senderId to chatJid for outgoing messages in groups', () => {
    const result = normalizeMessage({
      key: {
        remoteJid: '123-456@g.us',
        id: 'msg-8',
        fromMe: true,
        participant: '972501234567@s.whatsapp.net',
      },
      message: { conversation: 'My outgoing group message' },
      messageTimestamp: 8000,
    });

    // fromMe is true, so senderId should be the chatJid (group), not participant
    expect(result?.senderId).toBe('123-456@g.us');
    expect(result?.isFromMe).toBe(true);
  });

  it('should handle timestamp as number', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-9' },
      message: { conversation: 'test' },
      messageTimestamp: 1234567890,
    });

    expect(result?.timestamp).toBe(1234567890 * 1000);
  });

  it('should handle timestamp as Long object with toNumber', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-10' },
      message: { conversation: 'test' },
      messageTimestamp: { toNumber: () => 999888777 },
    });

    expect(result?.timestamp).toBe(999888777 * 1000);
  });

  it('should default timestamp to 0 for unrecognized format', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-11' },
      message: { conversation: 'test' },
      messageTimestamp: 'invalid',
    });

    expect(result?.timestamp).toBe(0);
  });

  it('should handle missing pushName', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net', id: 'msg-12' },
      message: { conversation: 'test' },
    });

    expect(result?.senderName).toBeUndefined();
  });

  it('should handle missing key.id', () => {
    const result = normalizeMessage({
      key: { remoteJid: '972501234567@s.whatsapp.net' },
      message: { conversation: 'test' },
      messageTimestamp: 0,
    });

    expect(result?.messageId).toBe('');
  });

  it('should handle empty senderId when remoteJid is missing', () => {
    const result = normalizeMessage({
      key: { id: 'msg-13' },
      message: { conversation: 'test' },
      messageTimestamp: 0,
    });

    expect(result?.senderId).toBe('');
  });
});
