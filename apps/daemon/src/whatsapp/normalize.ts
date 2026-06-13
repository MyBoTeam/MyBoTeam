const JID_PHONE_REGEX = /^(\d+)@s\.whatsapp\.net$/;
const JID_GROUP_REGEX = /^([\d-]+)@g\.us$/;
const JID_LID_REGEX = /^(\d+)@lid$/;

const VALID_JID_REGEX = /^(.+?)@(s\.whatsapp\.net|g\.us|lid|broadcast)$/;

export function toWhatsAppJid(recipient: string): string {
  if (recipient.includes('@')) {
    if (!VALID_JID_REGEX.test(recipient)) {
      throw new Error('invalid_jid');
    }
    return recipient;
  }
  const digits = recipient.replace(/[^\d]/g, '');
  if (!digits) throw new Error('invalid_recipient');
  return `${digits}@s.whatsapp.net`;
}

export function isGroupJid(jid: string): boolean {
  return JID_GROUP_REGEX.test(jid);
}

export function isUserJid(jid: string): boolean {
  return JID_PHONE_REGEX.test(jid) || JID_LID_REGEX.test(jid);
}
