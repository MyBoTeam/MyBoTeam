import { describe, expect, it } from 'vitest';
import type { BaileysMessage } from '../../../src/whatsapp/baileys-types.js';
import {
  extractText,
  getMessageType,
  normalizeMessage,
} from '../../../src/whatsapp/whatsapp-store-helpers.js';
import { SentMessageTracker, toTimestamp } from '../../../src/whatsapp/whatsapp-types.js';

const JID = '972501234567@s.whatsapp.net';
const JID_GROUP = '972501234567@g.us';

function makeMsg(overrides: Partial<BaileysMessage['message']>): BaileysMessage {
  return {
    key: { remoteJid: JID, id: 'msg-1', fromMe: false },
    messageTimestamp: 1000,
    message: overrides as BaileysMessage['message'],
  } as BaileysMessage;
}

describe('getMessageType', () => {
  it('returns text for conversation', () => {
    expect(getMessageType(makeMsg({ conversation: 'hello' }))).toBe('text');
  });

  it('returns text for extendedTextMessage', () => {
    expect(getMessageType(makeMsg({ extendedTextMessage: { text: 'hello' } }))).toBe('text');
  });

  it('returns image for imageMessage', () => {
    expect(getMessageType(makeMsg({ imageMessage: { caption: 'photo' } }))).toBe('image');
  });

  it('returns video for videoMessage', () => {
    expect(getMessageType(makeMsg({ videoMessage: { caption: 'vid' } }))).toBe('video');
  });

  it('returns audio for audioMessage', () => {
    expect(getMessageType(makeMsg({ audioMessage: {} }))).toBe('audio');
  });

  it('returns document for documentMessage', () => {
    expect(getMessageType(makeMsg({ documentMessage: { fileName: 'doc.pdf' } }))).toBe('document');
  });

  it('returns sticker for stickerMessage', () => {
    expect(getMessageType(makeMsg({ stickerMessage: {} }))).toBe('sticker');
  });

  it('returns reaction for reactionMessage', () => {
    expect(getMessageType(makeMsg({ reactionMessage: { text: '👍' } }))).toBe('reaction');
  });

  it('returns location for locationMessage', () => {
    expect(getMessageType(makeMsg({ locationMessage: { degreesLatitude: 0 } }))).toBe('location');
  });

  it('returns contact for contactMessage', () => {
    expect(getMessageType(makeMsg({ contactMessage: { displayName: 'John' } }))).toBe('contact');
  });

  it('returns system for systemMessage', () => {
    expect(getMessageType(makeMsg({ systemMessage: { body: 'joined' } }))).toBe('system');
  });

  it('returns text as default when no message', () => {
    expect(getMessageType(makeMsg(undefined as never))).toBe('text');
  });
});

describe('extractText', () => {
  it('extracts text from conversation', () => {
    const msg = makeMsg({ conversation: 'Hello world' });
    expect(extractText(msg)).toBe('Hello world');
  });

  it('extracts text from extendedTextMessage', () => {
    const msg = makeMsg({ extendedTextMessage: { text: 'Hello extended' } });
    expect(extractText(msg)).toBe('Hello extended');
  });

  it('extracts caption from imageMessage', () => {
    const msg = makeMsg({ imageMessage: { caption: 'Photo caption' } });
    expect(extractText(msg)).toBe('📷 Image: Photo caption');
  });

  it('returns placeholder for image without caption', () => {
    const msg = makeMsg({ imageMessage: { caption: undefined } });
    expect(extractText(msg)).toBe('📷 Image');
  });

  it('extracts caption from videoMessage', () => {
    const msg = makeMsg({ videoMessage: { caption: 'Video caption' } });
    expect(extractText(msg)).toBe('🎥 Video: Video caption');
  });

  it('returns placeholder for video without caption', () => {
    const msg = makeMsg({ videoMessage: { caption: undefined } });
    expect(extractText(msg)).toBe('🎥 Video');
  });

  it('returns placeholder for audioMessage', () => {
    const msg = makeMsg({ audioMessage: {} });
    expect(extractText(msg)).toBe('🎤 Audio');
  });

  it('extracts filename from documentMessage', () => {
    const msg = makeMsg({ documentMessage: { fileName: 'report.pdf' } });
    expect(extractText(msg)).toBe('📄 report.pdf');
  });

  it('returns placeholder for document without filename', () => {
    const msg = makeMsg({ documentMessage: { fileName: undefined } });
    expect(extractText(msg)).toBe('📄 Document');
  });

  it('returns placeholder for stickerMessage', () => {
    const msg = makeMsg({ stickerMessage: {} });
    expect(extractText(msg)).toBe('😊 Sticker');
  });

  it('extracts reaction text', () => {
    const msg = makeMsg({ reactionMessage: { text: '👍' } });
    expect(extractText(msg)).toBe('👍 react');
  });

  it('returns placeholder for locationMessage', () => {
    const msg = makeMsg({ locationMessage: { degreesLatitude: 32.06, degreesLongitude: 34.78 } });
    expect(extractText(msg)).toBe('📍 Location');
  });

  it('extracts contact displayName', () => {
    const msg = makeMsg({ contactMessage: { displayName: 'John Doe' } });
    expect(extractText(msg)).toBe('👤 Contact: John Doe');
  });

  it('returns placeholder for contact without displayName', () => {
    const msg = makeMsg({ contactMessage: { displayName: undefined } });
    expect(extractText(msg)).toBe('👤 Contact');
  });

  it('extracts body from systemMessage', () => {
    const msg = makeMsg({ systemMessage: { body: 'User joined group' } });
    expect(extractText(msg)).toBe('User joined group');
  });

  it('returns empty string for unknown message type', () => {
    const msg = makeMsg({});
    expect(extractText(msg)).toBe('');
  });
});

describe('normalizeMessage', () => {
  it('normalizes a text message', () => {
    const msg = makeMsg({ conversation: 'Hello' });
    const result = normalizeMessage(JID, msg);
    expect(result.messageId).toBe('msg-1');
    expect(result.senderJid).toBe(JID);
    expect(result.fromMe).toBe(false);
    expect(result.text).toBe('Hello');
    expect(result.timestamp).toBe(1000);
    expect(result.messageType).toBe('text');
  });

  it('uses participant as senderJid for group messages', () => {
    const msg = {
      key: {
        remoteJid: JID_GROUP,
        id: 'msg-1',
        fromMe: false,
        participant: '972509999999@s.whatsapp.net',
      },
      messageTimestamp: 1000,
      message: { conversation: 'Hello' },
    } as BaileysMessage;
    const result = normalizeMessage(JID_GROUP, msg);
    expect(result.senderJid).toBe('972509999999@s.whatsapp.net');
  });

  it('normalizes image message with caption', () => {
    const msg = makeMsg({ imageMessage: { caption: 'My photo' } });
    const result = normalizeMessage(JID, msg);
    expect(result.text).toBe('📷 Image: My photo');
    expect(result.messageType).toBe('image');
  });

  it('normalizes reaction message', () => {
    const msg = makeMsg({ reactionMessage: { text: '👍' } });
    const result = normalizeMessage(JID, msg);
    expect(result.text).toBe('👍 react');
    expect(result.messageType).toBe('reaction');
  });

  it('handles system message', () => {
    const msg = makeMsg({ systemMessage: { body: 'Security code changed' } });
    const result = normalizeMessage(JID, msg);
    expect(result.text).toBe('Security code changed');
    expect(result.messageType).toBe('system');
  });
});

describe('toTimestamp', () => {
  it('returns number as-is', () => {
    expect(toTimestamp(42)).toBe(42);
  });

  it('returns undefined for null', () => {
    expect(toTimestamp(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(toTimestamp(undefined)).toBeUndefined();
  });

  it('calls toNumber when available', () => {
    const val = { toNumber: () => 99 };
    expect(toTimestamp(val)).toBe(99);
  });

  it('returns undefined for plain object without toNumber', () => {
    expect(toTimestamp({})).toBeUndefined();
  });
});

describe('SentMessageTracker', () => {
  it('tracks and reports ids', () => {
    const tracker = new SentMessageTracker();
    expect(tracker.has('a')).toBe(false);
    tracker.add('a');
    expect(tracker.has('a')).toBe(true);
  });

  it('removes ids', () => {
    const tracker = new SentMessageTracker();
    tracker.add('a');
    tracker.remove('a');
    expect(tracker.has('a')).toBe(false);
  });

  it('evicts oldest id when exceeding 100', () => {
    const tracker = new SentMessageTracker();
    for (let i = 0; i < 100; i++) {
      tracker.add(`id-${i}`);
    }
    expect(tracker.has('id-0')).toBe(false);
    expect(tracker.has('id-99')).toBe(true);
    tracker.add('id-100');
    expect(tracker.has('id-1')).toBe(false);
    expect(tracker.has('id-100')).toBe(true);
  });
});
