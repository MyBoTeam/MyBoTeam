export interface ChatSummary {
  jid: string;
  name?: string;
  lastMessageAt?: number;
}
export interface MessageSummary {
  messageId: string;
  senderJid: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
}

export function toTimestamp(val: unknown): number | undefined {
  if (typeof val === 'number') return val;
  if (val != null && typeof (val as { toNumber: () => number }).toNumber === 'function')
    return (val as { toNumber: () => number }).toNumber();
  return undefined;
}

export class SentMessageTracker {
  private ids = new Set<string>();
  add(id: string): void {
    this.ids.add(id);
    if (this.ids.size > 100) {
      const first = this.ids.values().next().value;
      if (first) this.ids.delete(first);
    }
  }
  has(id: string): boolean {
    return this.ids.has(id);
  }
  remove(id: string): void {
    this.ids.delete(id);
  }
}
