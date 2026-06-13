import { describe, expect, it } from 'vitest';
import { isGroupJid, isUserJid, toWhatsAppJid } from '../../../src/whatsapp/normalize.js';

describe('toWhatsAppJid', () => {
  it('should return jid unchanged if it already contains @', () => {
    expect(toWhatsAppJid('123@s.whatsapp.net')).toBe('123@s.whatsapp.net');
  });

  it('should append @s.whatsapp.net for plain phone number', () => {
    expect(toWhatsAppJid('972501234567')).toBe('972501234567@s.whatsapp.net');
  });

  it('should strip non-digit characters', () => {
    expect(toWhatsAppJid('+972-50-123-4567')).toBe('972501234567@s.whatsapp.net');
  });

  it('should throw for empty string', () => {
    expect(() => toWhatsAppJid('')).toThrow('invalid_recipient');
  });

  it('should throw for string with no digits', () => {
    expect(() => toWhatsAppJid('abc')).toThrow('invalid_recipient');
  });

  it('should throw for jid with invalid domain', () => {
    expect(() => toWhatsAppJid('user@invalid')).toThrow('invalid_jid');
  });
});

describe('isGroupJid', () => {
  it('should return true for @g.us jid', () => {
    expect(isGroupJid('123-456@g.us')).toBe(true);
  });

  it('should return false for user jid', () => {
    expect(isGroupJid('123@s.whatsapp.net')).toBe(false);
  });

  it('should return false for lid jid', () => {
    expect(isGroupJid('123@lid')).toBe(false);
  });
});

describe('isUserJid', () => {
  it('should return true for @s.whatsapp.net jid', () => {
    expect(isUserJid('123@s.whatsapp.net')).toBe(true);
  });

  it('should return true for @lid jid', () => {
    expect(isUserJid('123@lid')).toBe(true);
  });

  it('should return false for @g.us jid', () => {
    expect(isUserJid('123@g.us')).toBe(false);
  });

  it('should return false for invalid jid', () => {
    expect(isUserJid('invalid')).toBe(false);
  });
});
