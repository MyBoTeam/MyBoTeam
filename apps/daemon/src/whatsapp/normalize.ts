const JID_PHONE_REGEX = /^(\d+)@s\.whatsapp\.net$/;
const JID_GROUP_REGEX = /^([\d-]+)@g\.us$/;
const JID_LID_REGEX = /^(\d+)@lid$/;

export function toWhatsAppJid(recipient: string): string {
  if (recipient.includes('@')) return recipient;
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
