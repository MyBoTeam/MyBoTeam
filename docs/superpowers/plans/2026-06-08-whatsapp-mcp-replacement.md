# WhatsApp MCP Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 3-tool WhatsApp MCP integration with a comprehensive 12-tool MCP server at `packages/mcp-servers/whatsapp`, powered by enhanced daemon backend with full WhatsApp capabilities (send text/media/reactions/polls/typing, list chats/groups, read messages, manage connection).

**Architecture:** Enhanced `WhatsAppService` in daemon → extended HTTP API (12 endpoints) → single MCP server exposing all capabilities. New `packages/mcp-servers/whatsapp/` package. Config generation updated to resolve the new MCP server path.

**Tech Stack:** Baileys (WhatsApp Web), TypeScript, @modelcontextprotocol/sdk, Vitest

---

### Task 1: Workspace Setup — Create `packages/mcp-servers/whatsapp` Package

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `packages/mcp-servers/package.json`
- Create: `packages/mcp-servers/whatsapp/package.json`
- Create: `packages/mcp-servers/whatsapp/tsconfig.json`
- Create: `packages/mcp-servers/whatsapp/vitest.config.ts`

- [ ] **Step 1: Update pnpm-workspace.yaml to include mcp-servers**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'packages/mcp-servers/*'
```

- [ ] **Step 2: Create packages/mcp-servers/package.json**

```json
{
  "name": "@myboteam/mcp-servers",
  "version": "0.0.0",
  "private": true,
  "description": "MCP server packages for MyBoTeam"
}
```

- [ ] **Step 3: Create packages/mcp-servers/whatsapp/package.json**

```json
{
  "name": "@myboteam/whatsapp-mcp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "check": "biome check --write . && tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^6.0.2",
    "vitest": "^4.0.17",
    "@types/node": "^25.9.1"
  }
}
```

- [ ] **Step 4: Create packages/mcp-servers/whatsapp/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 5: Create packages/mcp-servers/whatsapp/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: Install dependencies**

Run: `pnpm install`

---

### Task 2: Enhance WhatsAppService — Add Reactions, Polls, Typing, Media

**Files:**
- Read reference: https://github.com/WhiskeySockets/Baileys (for AnyMessageContent types)
- Rewrite: `apps/daemon/src/whatsapp/WhatsAppService.ts`
- Rewrite: `apps/daemon/src/whatsapp/whatsapp-types.ts`

This rewrites the service from ~200 lines to ~350 lines (within biome 200-line rule we split send ops to separate file in Task 3). Actually, we keep it under 200 by extracting send operations.

- [ ] **Step 1: Create apps/daemon/src/whatsapp/normalize.ts**

```typescript
const JID_PHONE_REGEX = /^(\d+)@s\.whatsapp\.net$/;
const JID_GROUP_REGEX = /^([\d-]+)@g\.us$/;
const JID_LID_REGEX = /^(\d+)@lid$/;

export function toWhatsAppJid(recipient: string): string {
  if (recipient.includes('@')) return recipient;
  const digits = recipient.replace(/[^\d]/g, '');
  if (!digits) throw new Error('Invalid recipient: no digits found');
  return `${digits}@s.whatsapp.net`;
}

export function isGroupJid(jid: string): boolean {
  return JID_GROUP_REGEX.test(jid);
}

export function isUserJid(jid: string): boolean {
  return JID_PHONE_REGEX.test(jid) || JID_LID_REGEX.test(jid);
}
```

- [ ] **Step 2: Create apps/daemon/src/whatsapp/send.ts** (send operations extracted)

```typescript
import type { BaileysSocket } from './WhatsAppService.js';
import { toWhatsAppJid } from './normalize.js';

export interface SendMessageOptions {
  mediaPath?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  replyToId?: string;
  asDocument?: boolean;
  gifPlayback?: boolean;
}

export async function sendText(
  socket: BaileysSocket,
  recipient: string,
  text: string,
  options?: SendMessageOptions,
): Promise<string> {
  const jid = toWhatsAppJid(recipient);
  let content: Record<string, unknown> = { text };
  if (options?.mediaPath) {
    const fs = await import('node:fs');
    const mediaBuffer = fs.readFileSync(options.mediaPath);
    const mimeType = options.mediaType === 'image' ? 'image/jpeg'
      : options.mediaType === 'audio' ? 'audio/ogg'
      : options.mediaType === 'video' ? 'video/mp4'
      : 'application/octet-stream';

    if (options.asDocument) {
      content = { document: mediaBuffer, fileName: path.basename(options.mediaPath), caption: text, mimetype: mimeType };
    } else if (options.mediaType === 'image') {
      content = { image: mediaBuffer, caption: text, mimetype: mimeType };
    } else if (options.mediaType === 'audio') {
      content = { audio: mediaBuffer, ptt: true, mimetype: mimeType };
    } else if (options.mediaType === 'video') {
      content = { video: mediaBuffer, caption: text, mimetype: mimeType, ...(options.gifPlayback ? { gifPlayback: true } : {}) };
    } else {
      content = { document: mediaBuffer, fileName: path.basename(options.mediaPath), caption: text, mimetype: mimeType };
    }
  }
  const result = await socket.sendMessage(jid, content as any);
  return (result as { key?: { id?: string } })?.key?.id ?? '';
}

export async function sendReaction(
  socket: BaileysSocket,
  chatJid: string,
  messageId: string,
  emoji: string,
  fromMe: boolean = false,
  participant?: string,
): Promise<void> {
  const jid = toWhatsAppJid(chatJid);
  await socket.sendMessage(jid, {
    react: { text: emoji, key: { remoteJid: jid, id: messageId, fromMe, ...(participant ? { participant } : {}) } },
  } as any);
}

export async function sendPoll(
  socket: BaileysSocket,
  recipient: string,
  question: string,
  options: string[],
  maxSelections: number = 1,
): Promise<string> {
  if (options.length < 2 || options.length > 12) throw new Error('Poll options must be between 2 and 12');
  const jid = toWhatsAppJid(recipient);
  const result = await socket.sendMessage(jid, {
    poll: { name: question, values: options, selectableCount: maxSelections },
  } as any);
  return (result as { key?: { id?: string } })?.key?.id ?? '';
}

export async function sendTyping(
  socket: BaileysSocket,
  recipient: string,
  action: 'composing' | 'paused' | 'recording' = 'composing',
): Promise<void> {
  const jid = toWhatsAppJid(recipient);
  await socket.sendPresenceUpdate(action, jid);
}

export async function markMessagesRead(
  socket: BaileysSocket,
  chatJid: string,
  messageIds: string[],
): Promise<void> {
  const jid = toWhatsAppJid(chatJid);
  await socket.readMessages(
    messageIds.map((id) => ({ remoteJid: jid, id, fromMe: false })),
  );
}
```

- [ ] **Step 3: Rewrite apps/daemon/src/whatsapp/WhatsAppService.ts** (keep under 200 lines by delegating send ops to send.ts)

```typescript
import type { ChannelAdapter, MessagingConnectionStatus, MessagingProviderId } from '@myboteam/agent-core/common';
import { EventEmitter } from 'events';
import path from 'node:path';
import type { WASocket, WAMessageKey } from '@whiskeysockets/baileys';
import { cleanupAuthState } from './authCleanup.js';
import { clearReconnectTimer, createReconnectState, scheduleReconnect, type ReconnectState } from './reconnection.js';
import { initBaileysSocket, wireSocketEvents } from './whatsapp-service-init.js';
import { type ChatSummary, type MessageSummary, SentMessageTracker, toTimestamp } from './whatsapp-types.js';
import { sendText, sendReaction, sendPoll, sendTyping, markMessagesRead, type SendMessageOptions } from './send.js';
import type { BaileysChat, BaileysMessage } from './baileys-types.js';

export type { BaileysSocket } from './baileys-types.js';

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 60000;
const WATCHDOG_TRANSPORT_TIMEOUT_MS = 120000;

export class WhatsAppService extends EventEmitter implements ChannelAdapter {
  readonly channelType: MessagingProviderId = 'whatsapp';
  private socket: WASocket | null = null;
  private store: BaileysStore | null = null;
  private status: MessagingConnectionStatus = 'disconnected';
  private reconnect: ReconnectState = createReconnectState();
  private authStatePath: string;
  private storePath: string;
  private disposed = false;
  private manualDisconnect = false;
  private qrCode: string | null = null;
  private qrIssuedAt: number | null = null;
  private sentMessageIds = new SentMessageTracker();
  private lastTransportActivity = Date.now();
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private phoneNumber: string | null = null;

  constructor(dataDir: string) {
    super();
    this.authStatePath = path.join(dataDir, 'whatsapp-auth');
    this.storePath = path.join(dataDir, 'whatsapp-store.json');
  }

  getStatus(): MessagingConnectionStatus { return this.status; }
  getQrCode(): string | null { return this.qrCode; }
  getQrIssuedAt(): number | null { return this.qrIssuedAt; }
  getPhoneNumber(): string | null { return this.phoneNumber; }

  markDisconnected(): void { this.setStatus('disconnected'); }

  private setStatus(s: MessagingConnectionStatus): void {
    this.status = s;
    this.emit('status', s);
  }

  async connect(): Promise<void> {
    if (this.disposed) throw new Error('WhatsApp service has been disposed');
    clearReconnectTimer(this.reconnect);
    this.reconnect.scheduled = false;
    this.reconnect.attempts = 0;
    this.manualDisconnect = false;
    if (this.status === 'connecting') return;
    this.setStatus('connecting');
    try {
      const { socket, store, saveCreds, DisconnectReason, jidNormalizedUser } =
        await initBaileysSocket(this.authStatePath, this.storePath, () => this.disposed, () => this.setStatus('disconnected'));
      if (this.disposed) { this.setStatus('disconnected'); return; }
      this.disposeSocket();
      if (this.disposed) { socket.end(new Error('disposed')); return; }
      this.socket = socket;
      this.store = store;
      wireSocketEvents(socket, saveCreds, DisconnectReason, jidNormalizedUser, {
        reconnect: this.reconnect, authStatePath: this.authStatePath, disposed: this.disposed,
        manualDisconnect: this.manualDisconnect, socket, setStatus: (s) => this.setStatus(s),
        setQrCode: (qr) => { this.qrCode = qr; this.qrIssuedAt = Date.now(); },
        emitQr: (qr) => this.emit('qr', qr),
        emitPhoneNumber: (p) => { this.phoneNumber = p; this.emit('phoneNumber', p); },
        emitOwnerLid: (lid) => this.emit('ownerLid', lid),
        connect: () => this.connect(), sentMessageIds: this.sentMessageIds,
        emitMessage: (msg) => this.emit('message', msg),
      });
      this.startWatchdog();
    } catch (err) {
      this.setStatus('disconnected');
      throw err;
    }
  }

  async sendMessage(recipient: string, text: string, options?: SendMessageOptions): Promise<string> {
    if (!this.socket) throw new Error('WhatsApp is not connected');
    this.touchTransport();
    return sendText(this.socket, recipient, text, options);
  }

  async sendReaction(chatJid: string, messageId: string, emoji: string, fromMe?: boolean, participant?: string): Promise<void> {
    if (!this.socket) throw new Error('WhatsApp is not connected');
    this.touchTransport();
    return sendReaction(this.socket, chatJid, messageId, emoji, fromMe, participant);
  }

  async sendPoll(recipient: string, question: string, options: string[], maxSelections?: number): Promise<string> {
    if (!this.socket) throw new Error('WhatsApp is not connected');
    this.touchTransport();
    return sendPoll(this.socket, recipient, question, options, maxSelections);
  }

  async sendTyping(recipient: string, action?: 'composing' | 'paused' | 'recording'): Promise<void> {
    if (!this.socket) throw new Error('WhatsApp is not connected');
    return sendTyping(this.socket, recipient, action);
  }

  async markRead(chatJid: string, messageIds: string[]): Promise<void> {
    if (!this.socket) throw new Error('WhatsApp is not connected');
    return markMessagesRead(this.socket, chatJid, messageIds);
  }

  async downloadMedia(chatJid: string, messageId: string): Promise<{ filePath: string; mimeType: string } | null> {
    if (!this.socket || !this.store) throw new Error('WhatsApp is not connected');
    this.touchTransport();
    const msgMap = this.store.messages[chatJid];
    if (!msgMap) return null;
    const msgs = msgMap.all() as BaileysMessage[];
    const target = msgs.find((m) => (m.key as WAMessageKey)?.id === messageId);
    if (!target?.message) return null;
    const downloadDir = path.dirname(this.authStatePath);
    const mediaDir = path.join(downloadDir, 'media');
    const fs = await import('node:fs');
    fs.mkdirSync(mediaDir, { recursive: true });
    const baileys = await import('@whiskeysockets/baileys');
    const { downloadContentFromMessage } = baileys;
    const msg = target.message as Record<string, unknown>;
    const mediaKey = Object.keys(msg).find((k) => msg[k] && typeof msg[k] === 'object' && 'mimetype' in (msg[k] as Record<string, unknown>));
    if (!mediaKey) return null;
    const mediaContent = msg[mediaKey] as { mimetype?: string };
    const stream = await downloadContentFromMessage(target.message as any, mediaKey as any);
    const ext = mediaContent?.mimetype?.split('/')[1] ?? 'bin';
    const outPath = path.join(mediaDir, `${messageId}.${ext}`);
    const writeStream = fs.createWriteStream(outPath);
    for await (const chunk of stream) writeStream.write(chunk);
    await new Promise<void>((resolve, reject) => { writeStream.end(); writeStream.on('finish', resolve); writeStream.on('error', reject); });
    return { filePath: outPath, mimeType: mediaContent?.mimetype ?? 'application/octet-stream' };
  }

  getChats(limit: number): ChatSummary[] {
    if (!this.store) return [];
    const chats = this.store.chats.all() ?? [];
    this.touchTransport();
    return chats.slice(0, Math.min(limit, 100)).map((c) => ({
      jid: c.id, name: (c as any).name ?? undefined,
      lastMessageAt: toTimestamp((c as any).conversationTimestamp),
    }));
  }

  getMessages(jid: string, limit: number): MessageSummary[] {
    if (!this.store) return [];
    this.touchTransport();
    const msgs = this.store.messages[jid]?.all() ?? [];
    return msgs.slice(-Math.min(limit, 100)).flatMap((m) => {
      const msg = m as BaileysMessage;
      const text = (msg.message as any)?.conversation ?? (msg.message as any)?.extendedTextMessage?.text ?? undefined;
      if (!text) return [];
      return [{ senderJid: (msg.key as any)?.fromMe ? 'me' : ((msg.key as any)?.participant ?? (msg.key as any)?.remoteJid ?? jid), fromMe: Boolean((msg.key as any)?.fromMe), text, timestamp: toTimestamp(msg.messageTimestamp) ?? 0 }];
    });
  }

  getGroups(limit: number): Array<{ jid: string; name?: string; participants: number }> {
    if (!this.store) return [];
    this.touchTransport();
    return (this.store.chats.all() ?? [])
      .filter((c) => (c.id as string).endsWith('@g.us'))
      .slice(0, Math.min(limit, 100))
      .map((c) => ({ jid: c.id, name: (c as any).name ?? undefined, participants: (c as any).participants?.length ?? 0 }));
  }

  getGroupInfo(groupJid: string): { jid: string; name?: string; participants: Array<{ id: string; admin?: string }> } | null {
    if (!this.store) return null;
    this.touchTransport();
    const groupMetadata = (this.store as any).groupMetadata?.(groupJid);
    if (!groupMetadata) return null;
    return { jid: groupJid, name: groupMetadata.subject, participants: groupMetadata.participants?.map((p: any) => ({ id: p.id, admin: p.admin })) ?? [] };
  }

  async disconnect(): Promise<void> {
    this.manualDisconnect = true;
    this.reconnect.scheduled = false;
    this.reconnect.attempts = 0;
    clearReconnectTimer(this.reconnect);
    this.stopWatchdog();
    if (this.socket) {
      this.socket.ev.removeAllListeners('creds.update');
      this.socket.ev.removeAllListeners('connection.update');
      this.socket.ev.removeAllListeners('messages.upsert');
      try { await this.socket.logout(); } catch {}
      this.socket.end(new Error('disconnect'));
      this.socket = null;
    }
    this.qrCode = null; this.qrIssuedAt = null; this.phoneNumber = null;
    this.store = null;
    cleanupAuthState(this.authStatePath);
    this.setStatus('disconnected');
  }

  dispose(): void {
    this.disposed = true;
    this.stopWatchdog();
    this.qrCode = null; this.qrIssuedAt = null; this.phoneNumber = null;
    this.store = null;
    clearReconnectTimer(this.reconnect);
    this.removeAllListeners();
    if (this.socket) {
      this.socket.ev.removeAllListeners('creds.update');
      this.socket.ev.removeAllListeners('connection.update');
      this.socket.ev.removeAllListeners('messages.upsert');
      this.socket.end(new Error('disposed'));
      this.socket = null;
    }
  }

  private touchTransport(): void { this.lastTransportActivity = Date.now(); }

  private startWatchdog(): void {
    this.stopWatchdog();
    this.watchdogTimer = setInterval(() => {
      if (!this.socket || this.status !== 'connected') return;
      if (Date.now() - this.lastTransportActivity > WATCHDOG_TRANSPORT_TIMEOUT_MS) {
        this.emit('status', 'connecting');
        this.socket.end(new Error('watchdog timeout'));
      }
    }, 30000);
  }

  private stopWatchdog(): void {
    if (this.watchdogTimer) { clearInterval(this.watchdogTimer); this.watchdogTimer = null; }
  }

  private disposeSocket(): void {
    if (!this.socket) return;
    this.socket.ev.removeAllListeners('creds.update');
    this.socket.ev.removeAllListeners('connection.update');
    this.socket.ev.removeAllListeners('messages.upsert');
    this.socket.end(new Error('replaced'));
    this.socket = null;
  }
}
```

- [ ] **Step 4: Rewrite apps/daemon/src/whatsapp/whatsapp-types.ts** — add ChatSummary, MessageSummary with messageId support

```typescript
export interface ChatSummary {
  jid: string;
  name?: string;
  lastMessageAt?: number;
  unreadCount?: number;
}

export interface MessageSummary {
  messageId?: string;
  senderJid: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
  mediaType?: string;
}

export function toTimestamp(ts: number | string | Long | undefined): number | undefined {
  if (ts == null) return undefined;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') return parseInt(ts, 10);
  if (typeof ts === 'object' && 'toNumber' in ts) return (ts as any).toNumber();
  return undefined;
}

export class SentMessageTracker {
  private ids = new Set<string>();
  add(id: string): void { this.ids.add(id); }
  has(id: string): boolean { return this.ids.has(id); }
  remove(id: string): void { this.ids.delete(id); }
}
```

- [ ] **Step 5: Create tests/apps/daemon/__tests__/unit/whatsapp/send.test.ts**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { sendText, sendReaction, sendPoll, sendTyping, markMessagesRead } from '../../../../src/whatsapp/send.js';

describe('send', () => {
  const mockSocket = { sendMessage: vi.fn(), sendPresenceUpdate: vi.fn(), readMessages: vi.fn() } as any;

  it('sendText sends text message', async () => {
    mockSocket.sendMessage.mockResolvedValue({ key: { id: 'msg-1' } });
    const id = await sendText(mockSocket, '+15551234567', 'Hello');
    expect(id).toBe('msg-1');
    expect(mockSocket.sendMessage).toHaveBeenCalledWith('15551234567@s.whatsapp.net', { text: 'Hello' });
  });

  it('sendReaction sends reaction', async () => {
    await sendReaction(mockSocket, '15551234567@s.whatsapp.net', 'msg-1', '❤️');
    expect(mockSocket.sendMessage).toHaveBeenCalledWith('15551234567@s.whatsapp.net', {
      react: { text: '❤️', key: { remoteJid: '15551234567@s.whatsapp.net', id: 'msg-1', fromMe: false } },
    });
  });

  it('sendPoll sends poll', async () => {
    mockSocket.sendMessage.mockResolvedValue({ key: { id: 'poll-1' } });
    const id = await sendPoll(mockSocket, '+15551234567', 'Best color?', ['Red', 'Blue'], 1);
    expect(id).toBe('poll-1');
    expect(mockSocket.sendMessage).toHaveBeenCalledWith('15551234567@s.whatsapp.net', {
      poll: { name: 'Best color?', values: ['Red', 'Blue'], selectableCount: 1 },
    });
  });

  it('sendTyping sends composing presence', async () => {
    await sendTyping(mockSocket, '+15551234567', 'composing');
    expect(mockSocket.sendPresenceUpdate).toHaveBeenCalledWith('composing', '15551234567@s.whatsapp.net');
  });

  it('markMessagesRead sends read markers', async () => {
    await markMessagesRead(mockSocket, '15551234567@s.whatsapp.net', ['msg-1', 'msg-2']);
    expect(mockSocket.readMessages).toHaveBeenCalledWith([
      { remoteJid: '15551234567@s.whatsapp.net', id: 'msg-1', fromMe: false },
      { remoteJid: '15551234567@s.whatsapp.net', id: 'msg-2', fromMe: false },
    ]);
  });

  it('sendPoll throws for <2 options', async () => {
    await expect(sendPoll(mockSocket, '+1', 'Q', ['one'], 1)).rejects.toThrow('2 and 12');
  });
});
```

- [ ] **Step 6: Run tests**

Run: `pnpm -F @myboteam/daemon test:unit`
Expected: PASS (new send tests pass)

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml packages/mcp-servers/ apps/daemon/src/whatsapp/send.ts apps/daemon/src/whatsapp/normalize.ts apps/daemon/src/whatsapp/WhatsAppService.ts apps/daemon/src/whatsapp/whatsapp-types.ts apps/daemon/__tests__/unit/whatsapp/send.test.ts
git commit -m "feat: add reactions, polls, typing, media send to WhatsAppService"
```

---

### Task 3: Extend HTTP API to 12 Endpoints

**Files:**
- Create: `apps/daemon/src/whatsapp/whatsapp-api-routes.ts` (handles all route builders)
- Rewrite: `apps/daemon/src/whatsapp/whatsapp-send-api.ts` (uses new routes)
- Delete: `apps/daemon/src/whatsapp/whatsapp-routes.ts`

- [ ] **Step 1: Create apps/daemon/src/whatsapp/whatsapp-api-routes.ts**

```typescript
import type http from 'node:http';
import type { Route } from '../http-server-factory.js';
import { log } from '../logger.js';
import type { WhatsAppDaemonService } from '../whatsapp-service.js';

const CONNECTION_LOSS_PATTERNS = ['connection closed', 'connection lost', 'connection terminated', 'socket closed', 'stream errored'] as const;

function sendJson(res: http.ServerResponse, payload: unknown): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function checkConnected(svc: WhatsAppDaemonService, res: http.ServerResponse): boolean {
  const config = svc.getConfig();
  if (config?.status !== 'connected') {
    const isConnecting = config?.status === 'connecting' || config?.status === 'qr_ready';
    sendJson(res, { success: false, error: 'not_connected', message: isConnecting ? 'WhatsApp is connecting...' : 'WhatsApp is not connected. Please connect in Settings → Integrations.' });
    return false;
  }
  return true;
}

function handleError(res: http.ServerResponse, err: unknown, errorCode = 'failed'): void {
  const errMsg = err instanceof Error ? err.message : String(err);
  const isConnectionLoss = CONNECTION_LOSS_PATTERNS.some((p) => errMsg.toLowerCase().includes(p));
  log.error(`[WhatsAppApi] ${errorCode}: ${errMsg}`);
  sendJson(res, { success: false, error: errorCode, message: isConnectionLoss ? 'WhatsApp disconnected. Please reconnect.' : errMsg });
}

export function buildSendRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/send', handler: async (data, _req, res) => {
    const { recipient, message, mediaPath, mediaType, replyToId, asDocument, gifPlayback } = data as Record<string, unknown>;
    if (!recipient || !message) { sendJson(res, { success: false, error: 'invalid_input', message: 'recipient and message are required' }); return; }
    if (!checkConnected(svc, res)) return;
    try {
      const msgId = await svc.sendMessage(String(recipient), String(message), { mediaPath: mediaPath as string | undefined, mediaType: mediaType as any, replyToId: replyToId as string | undefined, asDocument: asDocument as boolean | undefined, gifPlayback: gifPlayback as boolean | undefined });
      sendJson(res, { success: true, messageId: msgId });
    } catch (err) { handleError(res, err, 'send_failed'); }
  }};
}

export function buildSendReactionRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/send-reaction', handler: async (data, _req, res) => {
    const { chatJid, messageId, emoji, fromMe, participant } = data as Record<string, unknown>;
    if (!chatJid || !messageId || emoji === undefined) { sendJson(res, { success: false, error: 'invalid_input', message: 'chatJid, messageId, and emoji are required' }); return; }
    if (!checkConnected(svc, res)) return;
    try { await svc.sendReaction(String(chatJid), String(messageId), String(emoji), Boolean(fromMe), participant as string | undefined); sendJson(res, { success: true }); }
    catch (err) { handleError(res, err, 'reaction_failed'); }
  }};
}

export function buildSendPollRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/send-poll', handler: async (data, _req, res) => {
    const { recipient, question, options, maxSelections } = data as Record<string, unknown>;
    if (!recipient || !question || !Array.isArray(options)) { sendJson(res, { success: false, error: 'invalid_input', message: 'recipient, question, and options are required' }); return; }
    if (!checkConnected(svc, res)) return;
    try {
      const pollId = await svc.sendPoll(String(recipient), String(question), options.map(String), maxSelections != null ? Number(maxSelections) : 1);
      sendJson(res, { success: true, messageId: pollId });
    } catch (err) { handleError(res, err, 'poll_failed'); }
  }};
}

export function buildSendTypingRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/send-typing', handler: async (data, _req, res) => {
    const { recipient, action } = data as Record<string, unknown>;
    if (!recipient) { sendJson(res, { success: false, error: 'invalid_input', message: 'recipient is required' }); return; }
    if (!checkConnected(svc, res)) return;
    try { await svc.sendTyping(String(recipient), action as 'composing' | 'paused' | 'recording'); sendJson(res, { success: true }); }
    catch (err) { handleError(res, err, 'typing_failed'); }
  }};
}

export function buildChatsRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/chats', handler: async (data, _req, res) => {
    const limit = Math.min(Number((data as any)?.limit) || 20, 100);
    if (!checkConnected(svc, res)) return;
    sendJson(res, { success: true, chats: svc.readChats(limit) });
  }};
}

export function buildMessagesRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/messages', handler: async (data, _req, res) => {
    const { jid } = data as Record<string, unknown>;
    if (!jid) { sendJson(res, { success: false, error: 'invalid_jid', message: 'jid is required' }); return; }
    const limit = Math.min(Number((data as any)?.limit) || 20, 100);
    if (!checkConnected(svc, res)) return;
    sendJson(res, { success: true, messages: svc.readMessages(String(jid), limit) });
  }};
}

export function buildGroupsRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/groups', handler: async (data, _req, res) => {
    const limit = Math.min(Number((data as any)?.limit) || 20, 100);
    if (!checkConnected(svc, res)) return;
    sendJson(res, { success: true, groups: svc.readGroups(limit) });
  }};
}

export function buildGroupInfoRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/group-info', handler: async (data, _req, res) => {
    const { groupJid } = data as Record<string, unknown>;
    if (!groupJid) { sendJson(res, { success: false, error: 'invalid_input', message: 'groupJid is required' }); return; }
    if (!checkConnected(svc, res)) return;
    sendJson(res, { success: true, group: svc.readGroupInfo(String(groupJid)) });
  }};
}

export function buildMediaRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/download-media', handler: async (data, _req, res) => {
    const { chatJid, messageId } = data as Record<string, unknown>;
    if (!chatJid || !messageId) { sendJson(res, { success: false, error: 'invalid_input', message: 'chatJid and messageId are required' }); return; }
    if (!checkConnected(svc, res)) return;
    try {
      const result = await svc.downloadMedia(String(chatJid), String(messageId));
      if (!result) { sendJson(res, { success: false, error: 'not_found', message: 'Media not found or not downloadable' }); return; }
      sendJson(res, { success: true, filePath: result.filePath, mimeType: result.mimeType });
    } catch (err) { handleError(res, err, 'download_failed'); }
  }};
}

export function buildMarkReadRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/mark-read', handler: async (data, _req, res) => {
    const { chatJid, messageIds } = data as Record<string, unknown>;
    if (!chatJid || !Array.isArray(messageIds)) { sendJson(res, { success: false, error: 'invalid_input', message: 'chatJid and messageIds[] are required' }); return; }
    if (!checkConnected(svc, res)) return;
    try { await svc.markMessagesRead(String(chatJid), messageIds.map(String)); sendJson(res, { success: true }); }
    catch (err) { handleError(res, err, 'mark_read_failed'); }
  }};
}

export function buildStatusRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/status', handler: async (_data, _req, res) => {
    const config = svc.getConfig();
    sendJson(res, { success: true, connected: config?.status === 'connected', status: config?.status, phoneNumber: config?.phoneNumber ?? null });
  }};
}

export function buildLogoutRoute(svc: WhatsAppDaemonService): Route {
  return { method: 'POST', path: '/logout', handler: async (_data, _req, res) => {
    try { await svc.disconnect(); sendJson(res, { success: true }); }
    catch (err) { handleError(res, err, 'logout_failed'); }
  }};
}
```

- [ ] **Step 2: Rewrite apps/daemon/src/whatsapp/whatsapp-send-api.ts**

```typescript
import type http from 'node:http';
import { createHttpServer } from '../http-server-factory.js';
import { RateLimiter } from '../rate-limiter.js';
import type { WhatsAppDaemonService } from '../whatsapp-service.js';
import { buildSendRoute, buildSendReactionRoute, buildSendPollRoute, buildSendTypingRoute, buildChatsRoute, buildMessagesRoute, buildGroupsRoute, buildGroupInfoRoute, buildMediaRoute, buildMarkReadRoute, buildStatusRoute, buildLogoutRoute } from './whatsapp-api-routes.js';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;

export class WhatsAppSendApi {
  private whatsappService: WhatsAppDaemonService;
  private authToken: string;
  private server: http.Server | null = null;
  private port: number | null = null;
  private rateLimiter = new RateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);

  constructor(whatsappService: WhatsAppDaemonService, authToken: string) {
    this.whatsappService = whatsappService;
    this.authToken = authToken;
  }

  async start(fixedPort?: number): Promise<void> {
    const { server, port } = await createHttpServer({
      authToken: this.authToken,
      rateLimiter: this.rateLimiter,
      serviceName: 'WhatsAppSendApi',
      port: fixedPort,
      routes: [
        buildSendRoute(this.whatsappService),
        buildSendReactionRoute(this.whatsappService),
        buildSendPollRoute(this.whatsappService),
        buildSendTypingRoute(this.whatsappService),
        buildChatsRoute(this.whatsappService),
        buildMessagesRoute(this.whatsappService),
        buildGroupsRoute(this.whatsappService),
        buildGroupInfoRoute(this.whatsappService),
        buildMediaRoute(this.whatsappService),
        buildMarkReadRoute(this.whatsappService),
        buildStatusRoute(this.whatsappService),
        buildLogoutRoute(this.whatsappService),
      ],
    });
    this.server = server;
    this.port = port;
  }

  getPort(): number | null { return this.port; }

  stop(): void {
    if (this.server) { this.server.close(); this.server = null; this.port = null; }
  }
}
```

- [ ] **Step 3: Delete apps/daemon/src/whatsapp/whatsapp-routes.ts** (replaced by whatsapp-api-routes.ts)

- [ ] **Step 4: Update apps/daemon/src/whatsapp/index.ts exports**

```typescript
export { TaskBridge } from './taskBridge.js';
export { WhatsAppService } from './WhatsAppService.js';
export { wireStatusListeners, wireTaskBridge } from './wireTaskBridge.js';
export { WhatsAppSendApi } from './whatsapp-send-api.js';
```

- [ ] **Step 5: Run existing daemon tests to ensure nothing breaks**

Run: `pnpm -F @myboteam/daemon test:unit`
Expected: PASS (tests passing with refactored service)

- [ ] **Step 6: Commit**

```bash
git add apps/daemon/src/whatsapp/whatsapp-api-routes.ts apps/daemon/src/whatsapp/whatsapp-send-api.ts apps/daemon/src/whatsapp/index.ts
git rm apps/daemon/src/whatsapp/whatsapp-routes.ts
git commit -m "feat: extend HTTP API to 12 WhatsApp endpoints"
```

---

### Task 4: Update WhatsAppDaemonService — Add Missing Methods and Update whatsapp-service.ts

**Files:**
- Modify: `apps/daemon/src/whatsapp-service.ts`
- Modify: `apps/daemon/src/whatsapp-service-utils.ts`

- [ ] **Step 1: Add missing methods to WhatsAppDaemonService**

```typescript
// Add to WhatsAppDaemonService class in apps/daemon/src/whatsapp-service.ts

async sendMessage(recipientId: string, text: string, options?: SendMessageOptions): Promise<string> {
  if (!this.service) throw new Error('WhatsApp is not connected');
  return this.service.sendMessage(recipientId, text, options);
}

async sendReaction(chatJid: string, messageId: string, emoji: string, fromMe?: boolean, participant?: string): Promise<void> {
  if (!this.service) throw new Error('WhatsApp is not connected');
  return this.service.sendReaction(chatJid, messageId, emoji, fromMe, participant);
}

async sendPoll(recipient: string, question: string, options: string[], maxSelections?: number): Promise<string> {
  if (!this.service) throw new Error('WhatsApp is not connected');
  return this.service.sendPoll(recipient, question, options, maxSelections);
}

async sendTyping(recipient: string, action?: 'composing' | 'paused' | 'recording'): Promise<void> {
  if (!this.service) throw new Error('WhatsApp is not connected');
  return this.service.sendTyping(recipient, action);
}

async markMessagesRead(chatJid: string, messageIds: string[]): Promise<void> {
  if (!this.service) throw new Error('WhatsApp is not connected');
  return this.service.markRead(chatJid, messageIds);
}

async downloadMedia(chatJid: string, messageId: string): Promise<{ filePath: string; mimeType: string } | null> {
  if (!this.service) throw new Error('WhatsApp is not connected');
  return this.service.downloadMedia(chatJid, messageId);
}

readGroups(limit: number): Array<{ jid: string; name?: string; participants: number }> {
  if (!this.service) return [];
  return this.service.getGroups(limit);
}

readGroupInfo(groupJid: string): { jid: string; name?: string; participants: Array<{ id: string; admin?: string }> } | null {
  if (!this.service) return null;
  return this.service.getGroupInfo(groupJid);
}
```

- [ ] **Step 2: Update apps/daemon/src/whatsapp-service-utils.ts** to include `phoneNumber` in config type

```typescript
// Add phoneNumber to WhatsAppDaemonConfig if not present
export interface WhatsAppDaemonConfig {
  providerId: string;
  enabled: boolean;
  status: string;
  phoneNumber?: string;
  qrCode?: string;
  qrIssuedAt?: number;
  lastConnectedAt?: number;
}
```

- [ ] **Step 3: Update wireTaskBridge.ts to pass phoneNumber**

- [ ] **Step 4: Run tests**

Run: `pnpm -F @myboteam/daemon test:unit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/daemon/src/whatsapp-service.ts apps/daemon/src/whatsapp-service-utils.ts
git commit -m "feat: add sendReaction, sendPoll, sendTyping, downloadMedia to daemon service"
```

---

### Task 5: Build MCP Server — `packages/mcp-servers/whatsapp/src/`

**Files:**
- Create: `packages/mcp-servers/whatsapp/src/types.ts`
- Create: `packages/mcp-servers/whatsapp/src/api-client.ts`
- Create: `packages/mcp-servers/whatsapp/src/index.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/send.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/send-reaction.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/send-poll.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/send-typing.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/list-chats.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/get-messages.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/list-groups.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/get-group-info.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/download-media.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/mark-read.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/get-status.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/logout.ts`

- [ ] **Step 1: Create packages/mcp-servers/whatsapp/src/types.ts**

```typescript
export interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  messageId?: string;
  chats?: Array<{ jid: string; name?: string; lastMessageAt?: number }>;
  messages?: Array<{ messageId?: string; senderJid: string; fromMe: boolean; text: string; timestamp: number }>;
  groups?: Array<{ jid: string; name?: string; participants: number }>;
  group?: { jid: string; name?: string; participants: Array<{ id: string; admin?: string }> } | null;
  filePath?: string;
  mimeType?: string;
  connected?: boolean;
  status?: string;
  phoneNumber?: string | null;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}
```

- [ ] **Step 2: Create packages/mcp-servers/whatsapp/src/api-client.ts**

```typescript
import type { ApiResponse } from './types.js';

function getBaseUrl(): string {
  const port = process.env.MYBOTEAM_WHATSAPP_API_PORT;
  if (!port) throw new Error('MYBOTEAM_WHATSAPP_API_PORT is not set');
  return `http://localhost:${port}`;
}

function getAuthToken(): string | undefined {
  return process.env.MYBOTEAM_DAEMON_AUTH_TOKEN;
}

async function callApi(path: string, body: Record<string, unknown>): Promise<ApiResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: 'POST', headers, body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`WhatsApp API returned ${response.status}`);
  return response.json() as Promise<ApiResponse>;
}

export { callApi };
export type { ApiResponse } from './types.js';
```

- [ ] **Step 3: Create packages/mcp-servers/whatsapp/src/index.ts**

```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, type CallToolResult, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { sendTool, sendToolHandler } from './tools/send.js';
import { sendReactionTool, sendReactionToolHandler } from './tools/send-reaction.js';
import { sendPollTool, sendPollToolHandler } from './tools/send-poll.js';
import { sendTypingTool, sendTypingToolHandler } from './tools/send-typing.js';
import { listChatsTool, listChatsToolHandler } from './tools/list-chats.js';
import { getMessagesTool, getMessagesToolHandler } from './tools/get-messages.js';
import { listGroupsTool, listGroupsToolHandler } from './tools/list-groups.js';
import { getGroupInfoTool, getGroupInfoToolHandler } from './tools/get-group-info.js';
import { downloadMediaTool, downloadMediaToolHandler } from './tools/download-media.js';
import { markReadTool, markReadToolHandler } from './tools/mark-read.js';
import { getStatusTool, getStatusToolHandler } from './tools/get-status.js';
import { logoutTool, logoutToolHandler } from './tools/logout.js';

if (!process.env.MYBOTEAM_WHATSAPP_API_PORT) {
  process.stderr.write('MYBOTEAM_WHATSAPP_API_PORT is not set — WhatsApp MCP tool cannot start\n');
  process.exit(1);
}

const TOOLS = [sendTool, sendReactionTool, sendPollTool, sendTypingTool, listChatsTool, getMessagesTool, listGroupsTool, getGroupInfoTool, downloadMediaTool, markReadTool, getStatusTool, logoutTool];

const HANDLERS: Record<string, (args: Record<string, unknown>) => Promise<CallToolResult>> = {
  SendWhatsAppMessage: sendToolHandler,
  SendWhatsAppReaction: sendReactionToolHandler,
  SendWhatsAppPoll: sendPollToolHandler,
  SendWhatsAppTyping: sendTypingToolHandler,
  ListWhatsAppChats: listChatsToolHandler,
  GetWhatsAppMessages: getMessagesToolHandler,
  ListWhatsAppGroups: listGroupsToolHandler,
  GetWhatsAppGroupInfo: getGroupInfoToolHandler,
  DownloadWhatsAppMedia: downloadMediaToolHandler,
  MarkWhatsAppRead: markReadToolHandler,
  GetWhatsAppStatus: getStatusToolHandler,
  LogoutWhatsApp: logoutToolHandler,
};

const server = new Server({ name: '@myboteam/whatsapp-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name } = request.params;
  const handler = HANDLERS[name];
  if (!handler) return { content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }], isError: true };
  return handler((request.params.arguments ?? {}) as Record<string, unknown>);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WhatsApp MCP Server started');
}

main().catch((error) => { console.error('Failed to start server:', error); process.exit(1); });
```

- [ ] **Step 4: Create each tool file. Example: packages/mcp-servers/whatsapp/src/tools/send.ts**

```typescript
import { callApi } from '../api-client.js';
import type { CallToolResult, ToolDefinition } from '../types.js';

export const sendTool: ToolDefinition = {
  name: 'SendWhatsAppMessage',
  description: 'Send a WhatsApp message. Supports text, images, audio, video, and documents. Use ListWhatsAppChats first to find available contacts.',
  inputSchema: {
    type: 'object',
    properties: {
      recipient: { type: 'string', description: 'Phone number in international format (e.g. +15551234567)' },
      message: { type: 'string', description: 'Text message to send' },
      mediaPath: { type: 'string', description: 'Optional path to a media file' },
      mediaType: { type: 'string', enum: ['image', 'audio', 'video', 'document'], description: 'Type of media' },
      replyToId: { type: 'string', description: 'Optional message ID to reply to' },
    },
    required: ['recipient', 'message'],
  },
};

export async function sendToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const { recipient, message, mediaPath, mediaType, replyToId } = args;
  if (!recipient || !message) return { content: [{ type: 'text', text: 'Error: recipient and message are required' }], isError: true };
  try {
    const result = await callApi('/send', { recipient, message, mediaPath, mediaType, replyToId });
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed to send' }], isError: true };
    return { content: [{ type: 'text', text: `Message sent to ${recipient}.` + (result.messageId ? ` ID: ${result.messageId}` : '') }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
}
```

- [ ] **Step 5: Create remaining tool files** following the same pattern:

`tools/send-reaction.ts`:
```typescript
import { callApi } from '../api-client.js';
import type { CallToolResult } from '../types.js';

export const sendReactionTool = {
  name: 'SendWhatsAppReaction',
  description: 'React to a WhatsApp message with an emoji.',
  inputSchema: {
    type: 'object',
    properties: {
      chatJid: { type: 'string', description: 'The chat JID (e.g. 15551234567@s.whatsapp.net)' },
      messageId: { type: 'string', description: 'The message ID to react to' },
      emoji: { type: 'string', description: 'The emoji to send (e.g. ❤️, 👍, 😂). Send empty string to remove reaction.' },
    },
    required: ['chatJid', 'messageId', 'emoji'],
  },
};

export async function sendReactionToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const { chatJid, messageId, emoji } = args;
  if (!chatJid || !messageId || emoji === undefined) return { content: [{ type: 'text', text: 'Error: chatJid, messageId, and emoji are required' }], isError: true };
  try {
    const result = await callApi('/send-reaction', { chatJid, messageId, emoji });
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed to send reaction' }], isError: true };
    return { content: [{ type: 'text', text: `Reaction ${emoji} sent to message ${messageId}` }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
}
```

`tools/send-poll.ts`:
```typescript
import { callApi } from '../api-client.js';
import type { CallToolResult } from '../types.js';

export const sendPollTool = {
  name: 'SendWhatsAppPoll',
  description: 'Send a poll to a WhatsApp contact or group. Requires 2-12 options.',
  inputSchema: {
    type: 'object',
    properties: {
      recipient: { type: 'string', description: 'Phone number or JID' },
      question: { type: 'string', description: 'The poll question' },
      options: { type: 'array', items: { type: 'string' }, description: 'Poll options (2-12)' },
      maxSelections: { type: 'number', description: 'Maximum selectable options (default 1)' },
    },
    required: ['recipient', 'question', 'options'],
  },
};

export async function sendPollToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const { recipient, question, options, maxSelections } = args;
  if (!recipient || !question || !Array.isArray(options)) return { content: [{ type: 'text', text: 'Error: recipient, question, and options are required' }], isError: true };
  try {
    const result = await callApi('/send-poll', { recipient, question, options, maxSelections });
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed to send poll' }], isError: true };
    return { content: [{ type: 'text', text: `Poll "${question}" sent to ${recipient}.${result.messageId ? ` ID: ${result.messageId}` : ''}` }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
}
```

`tools/send-typing.ts`:
```typescript
import { callApi } from '../api-client.js';
import type { CallToolResult } from '../types.js';

export const sendTypingTool = {
  name: 'SendWhatsAppTyping',
  description: 'Show a typing/composing/recording indicator in a WhatsApp conversation.',
  inputSchema: {
    type: 'object',
    properties: {
      recipient: { type: 'string', description: 'Phone number or JID' },
      action: { type: 'string', enum: ['composing', 'paused', 'recording'], description: 'Typing action (default composing)' },
    },
    required: ['recipient'],
  },
};

export async function sendTypingToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const { recipient, action } = args;
  if (!recipient) return { content: [{ type: 'text', text: 'Error: recipient is required' }], isError: true };
  try {
    const result = await callApi('/send-typing', { recipient, action: action ?? 'composing' });
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed to send typing indicator' }], isError: true };
    return { content: [{ type: 'text', text: `Typing indicator sent to ${recipient}.` }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
}
```

`tools/list-chats.ts`:
```typescript
export const listChatsTool = {
  name: 'ListWhatsAppChats',
  description: 'List recent WhatsApp conversations with names and last activity timestamps.',
  inputSchema: {
    type: 'object',
    properties: { limit: { type: 'number', description: 'Max chats to return (default 20, max 100)' } },
    required: [],
  },
};

export async function listChatsToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  try {
    const result = await callApi('/chats', { limit: (args as any).limit ?? 20 });
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed' }], isError: true };
    const chats = result.chats ?? [];
    if (chats.length === 0) return { content: [{ type: 'text', text: 'No conversations found.' }] };
    const lines = chats.map((c) => `• ${c.name ?? c.jid} (${c.jid})${c.lastMessageAt ? ` — last: ${new Date(c.lastMessageAt * 1000).toISOString()}` : ''}`);
    return { content: [{ type: 'text', text: `WhatsApp conversations:\n${lines.join('\n')}` }] };
  } catch (err) { /* */ }
}
```

`tools/get-messages.ts`:
```typescript
import { callApi } from '../api-client.js';
import type { CallToolResult } from '../types.js';

export const getMessagesTool = {
  name: 'GetWhatsAppMessages',
  description: 'Get recent messages from a WhatsApp conversation. Use ListWhatsAppChats to find JIDs.',
  inputSchema: {
    type: 'object',
    properties: {
      jid: { type: 'string', description: 'The chat JID (e.g. 15551234567@s.whatsapp.net)' },
      limit: { type: 'number', description: 'Max messages (default 20, max 100)' },
    },
    required: ['jid'],
  },
};

export async function getMessagesToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const { jid, limit } = args;
  if (!jid) return { content: [{ type: 'text', text: 'Error: jid is required' }], isError: true };
  try {
    const result = await callApi('/messages', { jid, limit: limit ?? 20 });
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed to get messages' }], isError: true };
    const messages = result.messages ?? [];
    if (messages.length === 0) return { content: [{ type: 'text', text: 'No messages found.' }] };
    const lines = messages.map((m) => `[${new Date(m.timestamp * 1000).toISOString()}] ${m.fromMe ? 'You' : m.senderJid}: ${m.text}`);
    return { content: [{ type: 'text', text: `Messages from ${jid}:\n${lines.join('\n')}` }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
}
```

`tools/list-groups.ts`:
```typescript
import { callApi } from '../api-client.js';
import type { CallToolResult } from '../types.js';

export const listGroupsTool = {
  name: 'ListWhatsAppGroups',
  description: 'List WhatsApp group chats with names and participant counts.',
  inputSchema: {
    type: 'object',
    properties: { limit: { type: 'number', description: 'Max groups (default 20, max 100)' } },
    required: [],
  },
};

export async function listGroupsToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  try {
    const result = await callApi('/groups', { limit: (args as any).limit ?? 20 });
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed to list groups' }], isError: true };
    const groups = result.groups ?? [];
    if (groups.length === 0) return { content: [{ type: 'text', text: 'No groups found.' }] };
    const lines = groups.map((g) => `• ${g.name ?? g.jid} (${g.jid}) — ${g.participants} participants`);
    return { content: [{ type: 'text', text: `WhatsApp groups:\n${lines.join('\n')}` }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
}
```

`tools/get-group-info.ts`:
```typescript
import { callApi } from '../api-client.js';
import type { CallToolResult } from '../types.js';

export const getGroupInfoTool = {
  name: 'GetWhatsAppGroupInfo',
  description: 'Get detailed information about a WhatsApp group including participants.',
  inputSchema: {
    type: 'object',
    properties: { groupJid: { type: 'string', description: 'The group JID' } },
    required: ['groupJid'],
  },
};

export async function getGroupInfoToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const { groupJid } = args;
  if (!groupJid) return { content: [{ type: 'text', text: 'Error: groupJid is required' }], isError: true };
  try {
    const result = await callApi('/group-info', { groupJid });
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed to get group info' }], isError: true };
    const group = result.group;
    if (!group) return { content: [{ type: 'text', text: 'Group not found.' }] };
    const members = group.participants?.map((p) => `  • ${p.id}${p.admin ? ` (${p.admin})` : ''}`).join('\n') ?? '';
    return { content: [{ type: 'text', text: `Group: ${group.name ?? group.jid}\nParticipants:\n${members}` }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
}
```

`tools/download-media.ts`:
```typescript
import { callApi } from '../api-client.js';
import type { CallToolResult } from '../types.js';

export const downloadMediaTool = {
  name: 'DownloadWhatsAppMedia',
  description: 'Download media from a WhatsApp message and return the file path.',
  inputSchema: {
    type: 'object',
    properties: {
      chatJid: { type: 'string', description: 'The chat JID' },
      messageId: { type: 'string', description: 'The message ID to download media from' },
    },
    required: ['chatJid', 'messageId'],
  },
};

export async function downloadMediaToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const { chatJid, messageId } = args;
  if (!chatJid || !messageId) return { content: [{ type: 'text', text: 'Error: chatJid and messageId are required' }], isError: true };
  try {
    const result = await callApi('/download-media', { chatJid, messageId });
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed to download media' }], isError: true };
    return { content: [{ type: 'text', text: `Media downloaded to ${result.filePath} (${result.mimeType})` }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
}
```

`tools/mark-read.ts`:
```typescript
import { callApi } from '../api-client.js';
import type { CallToolResult } from '../types.js';

export const markReadTool = {
  name: 'MarkWhatsAppRead',
  description: 'Mark messages as read in a WhatsApp conversation.',
  inputSchema: {
    type: 'object',
    properties: {
      chatJid: { type: 'string', description: 'The chat JID' },
      messageIds: { type: 'array', items: { type: 'string' }, description: 'Message IDs to mark as read' },
    },
    required: ['chatJid', 'messageIds'],
  },
};

export async function markReadToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const { chatJid, messageIds } = args;
  if (!chatJid || !Array.isArray(messageIds)) return { content: [{ type: 'text', text: 'Error: chatJid and messageIds[] are required' }], isError: true };
  try {
    const result = await callApi('/mark-read', { chatJid, messageIds });
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed to mark as read' }], isError: true };
    return { content: [{ type: 'text', text: `${messageIds.length} message(s) marked as read in ${chatJid}.` }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
}
```

`tools/get-status.ts`:
```typescript
export const getStatusTool = {
  name: 'GetWhatsAppStatus',
  description: 'Get WhatsApp connection status and phone number.',
  inputSchema: { type: 'object', properties: {}, required: [] },
};

export async function getStatusToolHandler(): Promise<CallToolResult> {
  try {
    const result = await callApi('/status', {});
    return {
      content: [{ type: 'text', text: `Status: ${result.status ?? 'unknown'}\nConnected: ${result.connected}\nPhone: ${result.phoneNumber ?? 'N/A'}` }],
    };
  } catch (err) { /* */ }
}
```

`tools/logout.ts`:
```typescript
import { callApi } from '../api-client.js';
import type { CallToolResult } from '../types.js';

export const logoutTool = {
  name: 'LogoutWhatsApp',
  description: 'Disconnect WhatsApp and clear authentication data. Requires reconnecting via Settings afterwards.',
  inputSchema: { type: 'object', properties: {}, required: [] },
};

export async function logoutToolHandler(): Promise<CallToolResult> {
  try {
    const result = await callApi('/logout', {});
    if (!result.success) return { content: [{ type: 'text', text: result.message ?? 'Failed to logout' }], isError: true };
    return { content: [{ type: 'text', text: 'WhatsApp disconnected and auth data cleared.' }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
}
```

- [ ] **Step 6: Verify the MCP server compiles**

Run: `pnpm -F @myboteam/whatsapp-mcp build`
Expected: dist/index.mjs is created

- [ ] **Step 7: Commit**

```bash
git add packages/mcp-servers/whatsapp/
git commit -m "feat: create whatsapp MCP server with 12 tools"
```

---

### Task 6: Update Config Generation Pipeline

**Files:**
- Modify: `packages/agent-core/src/opencode/generator-mcp.ts`
- Modify: `packages/agent-core/src/opencode/config-generator-types.ts`
- Modify: `packages/agent-core/src/opencode/config-generator.ts`
- Modify: `packages/agent-core/src/opencode/resolve-task-config.ts`
- Modify: `apps/daemon/src/app-config.ts`
- Modify: `apps/daemon/src/task-config-builder.ts`

- [ ] **Step 1: Add whatsappMcpPath to BuildMcpServersOptions and config pipeline**

In `generator-mcp.ts`:
```typescript
export interface BuildMcpServersOptions {
  mcpToolsPath: string;
  nodeExe: string;
  whatsappMcpPath?: string;  // NEW
  whatsappApiPort?: number;
  // ...
}

export function buildMcpServers(options: BuildMcpServersOptions): Record<string, McpServerConfig> {
  const { mcpToolsPath, nodeExe, whatsappApiPort, whatsappMcpPath, ...rest } = options;
  // ...
  if (whatsappMcpPath && whatsappApiPort) {
    const distPath = path.join(whatsappMcpPath, 'dist/index.mjs');
    mcpServers.whatsapp = {
      type: 'local',
      command: [nodeExe, distPath],
      enabled: true,
      environment: {
        MYBOTEAM_WHATSAPP_API_PORT: String(whatsappApiPort),
        ...authEnv,
      },
      timeout: 30000,
    };
  }
  // Remove the old whatsapp MCP from mcpToolsPath
  return mcpServers;
}
```

In `config-generator-types.ts`:
```typescript
whatsappMcpPath?: string;  // NEW — path to packages/mcp-servers/whatsapp
```

In `config-generator.ts`:
```typescript
const mcpServers = buildMcpServers({
  mcpToolsPath,
  nodeExe,
  whatsappApiPort,
  whatsappMcpPath: options.whatsappMcpPath,  // NEW
  // ...
});
```

In `resolve-task-config.ts`:
```typescript
whatsappMcpPath?: string;  // in ResolveTaskConfigOptions
```

In `task-config-builder.ts`:
```typescript
const whatsappMcpPath = getPort('MYBOTEAM_WHATSAPP_MCP_PATH') 
  ? path.resolve(process.env.MYBOTEAM_WHATSAPP_MCP_PATH!)
  : path.resolve(__dirname, '..', '..', '..', 'packages', 'mcp-servers', 'whatsapp');
```

Actually, for simplicity, add `whatsappMcpPath` to `DaemonPaths` in `app-config.ts`:
```typescript
const whatsappMcpPath = args.isPackaged
  ? path.join(args.resourcesPath, 'mcp-servers', 'whatsapp')
  : path.resolve(__dirname, '..', '..', '..', 'packages', 'mcp-servers', 'whatsapp');
```

- [ ] **Step 2: Run existing config tests**

Run: `pnpm -F @myboteam/agent-core test`
Expected: PASS (config generation tests still pass with the new option)

- [ ] **Step 3: Commit**

```bash
git add packages/agent-core/src/opencode/generator-mcp.ts packages/agent-core/src/opencode/config-generator-types.ts packages/agent-core/src/opencode/config-generator.ts packages/agent-core/src/opencode/resolve-task-config.ts apps/daemon/src/app-config.ts apps/daemon/src/task-config-builder.ts
git commit -m "feat: update config generation for new whatsapp MCP server path"
```

---

### Task 7: Delete Old Files and Fix Imports

**Files:**
- Delete: `packages/agent-core/mcp-tools/whatsapp/` (entire directory — old 3-tool MCP)
- Delete: `apps/daemon/src/whatsapp/whatsapp-service-init.ts`
- Delete: `apps/daemon/src/whatsapp/whatsapp-session.ts`
- Delete: `apps/daemon/src/whatsapp/whatsapp-store.ts`
- Delete: `apps/daemon/src/whatsapp/whatsapp-store-persistence.ts`
- Delete: `apps/daemon/src/whatsapp/normalizeMessage.ts`
- Delete: `apps/daemon/src/whatsapp/baileys-types.ts`
- Delete: `apps/daemon/src/whatsapp/reconnection.ts`
- Delete: `apps/daemon/src/whatsapp/authCleanup.ts`

- [ ] **Step 1: Verify there are no remaining imports to deleted files**

Run: `rg "from.*(whatsapp-service-init|whatsapp-session|whatsapp-store|normalizeMessage|baileys-types|reconnection|authCleanup)" apps/daemon/src/`
Expected: No matches (or only in files we're keeping)

- [ ] **Step 2: Delete old MCP tools directory**

```bash
rm -rf packages/agent-core/mcp-tools/whatsapp/
```

- [ ] **Step 3: Delete old daemon WhatsApp files**

```bash
rm apps/daemon/src/whatsapp/whatsapp-service-init.ts
rm apps/daemon/src/whatsapp/whatsapp-session.ts
rm apps/daemon/src/whatsapp/whatsapp-store.ts
rm apps/daemon/src/whatsapp/whatsapp-store-persistence.ts
rm apps/daemon/src/whatsapp/normalizeMessage.ts
rm apps/daemon/src/whatsapp/baileys-types.ts
rm apps/daemon/src/whatsapp/reconnection.ts
rm apps/daemon/src/whatsapp/authCleanup.ts
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git rm -r packages/agent-core/mcp-tools/whatsapp/
git rm apps/daemon/src/whatsapp/whatsapp-service-init.ts apps/daemon/src/whatsapp/whatsapp-session.ts apps/daemon/src/whatsapp/whatsapp-store.ts apps/daemon/src/whatsapp/whatsapp-store-persistence.ts apps/daemon/src/whatsapp/normalizeMessage.ts apps/daemon/src/whatsapp/baileys-types.ts apps/daemon/src/whatsapp/reconnection.ts apps/daemon/src/whatsapp/authCleanup.ts
git commit -m "chore: remove old WhatsApp files replaced by openclaw patterns"
```

---

### Task 8: Write Tests — Daemon WhatsApp Service & Routes

**Files:**
- Create/rewrite: `apps/daemon/__tests__/unit/whatsapp/whatsapp-service.test.ts`
- Create: `apps/daemon/__tests__/unit/whatsapp/whatsapp-api.test.ts`
- Create: `apps/daemon/__tests__/unit/whatsapp/whatsapp-storage-sync.test.ts`

- [ ] **Step 1: Rewrite whatsapp-service.test.ts** — test all new methods

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppService } from '../../../src/whatsapp/WhatsAppService.js';
import { toWhatsAppJid, isGroupJid } from '../../../src/whatsapp/normalize.js';
import { sendText, sendReaction, sendPoll, sendTyping } from '../../../src/whatsapp/send.js';

describe('normalize', () => {
  it('converts phone to JID', () => { expect(toWhatsAppJid('+15551234567')).toBe('15551234567@s.whatsapp.net'); });
  it('passes through JID', () => { expect(toWhatsAppJid('15551234567@s.whatsapp.net')).toBe('15551234567@s.whatsapp.net'); });
  it('throws for invalid', () => { expect(() => toWhatsAppJid('')).toThrow(); });
  it('detects group JID', () => { expect(isGroupJid('123@g.us')).toBe(true); expect(isGroupJid('123@s.whatsapp.net')).toBe(false); });
});

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  beforeEach(() => { service = new WhatsAppService('/tmp/test-whatsapp'); });

  it('starts disconnected', () => { expect(service.getStatus()).toBe('disconnected'); });
  it('has no QR initially', () => { expect(service.getQrCode()).toBeNull(); });
  it('dispose cleans up', () => { service.dispose(); expect(service.getStatus()).toBe('disconnected'); });
});
```

- [ ] **Step 2: Create whatsapp-api.test.ts** — test route validation

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { WhatsAppDaemonService } from '../../../src/whatsapp-service.js';

// Test the route builders by checking request validation logic
describe('WhatsApp API Routes', () => {
  it('send route validates recipient', async () => {
    const mockSvc = { getConfig: () => ({ status: 'connected' }), sendMessage: vi.fn() } as any;
    const { buildSendRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildSendRoute(mockSvc);
    const res = { writeHead: vi.fn(), end: vi.fn() } as any;
    await route.handler({ recipient: '', message: 'hi' }, {} as any, res);
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    const payload = JSON.parse(res.end.mock.calls[0][0]);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('invalid_input');
  });

  it('status route returns config', async () => {
    const mockSvc = { getConfig: () => ({ status: 'connected', phoneNumber: '+15551234567' }) } as any;
    const { buildStatusRoute } = await import('../../../src/whatsapp/whatsapp-api-routes.js');
    const route = buildStatusRoute(mockSvc);
    const res = { writeHead: vi.fn(), end: vi.fn() } as any;
    await route.handler({}, {} as any, res);
    const payload = JSON.parse(res.end.mock.calls[0][0]);
    expect(payload.connected).toBe(true);
    expect(payload.phoneNumber).toBe('+15551234567');
  });
});
```

- [ ] **Step 3: Run daemon tests**

Run: `pnpm -F @myboteam/daemon test:unit`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/daemon/__tests__/unit/whatsapp/
git commit -m "test: add daemon WhatsApp service and API route tests"
```

---

### Task 9: Write Tests — MCP Server Package

**Files:**
- Create: `packages/mcp-servers/whatsapp/src/tools/send.test.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/send-reaction.test.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/send-poll.test.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/list-chats.test.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/get-messages.test.ts`
- Create: `packages/mcp-servers/whatsapp/src/tools/get-status.test.ts`
- Create: `packages/mcp-servers/whatsapp/src/api-client.test.ts`
- Create: `packages/mcp-servers/whatsapp/src/index.test.ts`

- [ ] **Step 1: Create each test file. Example: packages/mcp-servers/whatsapp/src/tools/send.test.ts**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../../api-client.js';
import { sendToolHandler } from './send.js';

describe('SendWhatsAppMessage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('validates required fields', async () => {
    const result = await sendToolHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('recipient');
  });

  it('calls /send on success', async () => {
    (callApi as any).mockResolvedValue({ success: true, messageId: 'msg-1' });
    const result = await sendToolHandler({ recipient: '+1', message: 'hi' });
    expect(callApi).toHaveBeenCalledWith('/send', { recipient: '+1', message: 'hi' });
    expect(result.isError).toBeFalsy();
  });

  it('returns error from API', async () => {
    (callApi as any).mockResolvedValue({ success: false, message: 'not connected' });
    const result = await sendToolHandler({ recipient: '+1', message: 'hi' });
    expect(result.isError).toBe(true);
  });
});
```

- [ ] **Step 2: Create index.test.ts** — test tool listing

```typescript
import { describe, it, expect } from 'vitest';
import { sendTool } from './tools/send.js';
import { sendReactionTool } from './tools/send-reaction.js';
import { sendPollTool } from './tools/send-poll.js';
import { sendTypingTool } from './tools/send-typing.js';
import { listChatsTool } from './tools/list-chats.js';
import { getMessagesTool } from './tools/get-messages.js';
import { listGroupsTool } from './tools/list-groups.js';
import { getGroupInfoTool } from './tools/get-group-info.js';
import { downloadMediaTool } from './tools/download-media.js';
import { markReadTool } from './tools/mark-read.js';
import { getStatusTool } from './tools/get-status.js';
import { logoutTool } from './tools/logout.js';

describe('Tool Definitions', () => {
  const tools = [sendTool, sendReactionTool, sendPollTool, sendTypingTool, listChatsTool, getMessagesTool, listGroupsTool, getGroupInfoTool, downloadMediaTool, markReadTool, getStatusTool, logoutTool];

  it('all tools have name and description', () => {
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
    }
  });

  it('all tool names are unique', () => {
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
```

- [ ] **Step 3: Run MCP server tests**

Run: `pnpm -F @myboteam/whatsapp-mcp test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-servers/whatsapp/src/
git commit -m "test: add MCP server tests for all 12 tools"
```

---

### Task 10: Full Verification

- [ ] **Step 1: Typecheck**

Run: `pnpm typecheck`
Expected: No type errors

- [ ] **Step 2: Biome check**

Run: `pnpm check`
Expected: No lint errors

- [ ] **Step 3: Run all tests**

```bash
pnpm -F @myboteam/agent-core test
pnpm -F @myboteam/daemon test
pnpm -F @myboteam/whatsapp-mcp test
pnpm -F @myboteam/desktop test
pnpm -F @myboteam/web test
```

Expected: All pass

- [ ] **Step 4: Final review of changes**

Run: `git diff --stat`
Expected: New MCP server, enhanced daemon service, extended HTTP API, deleted old files

- [ ] **Step 5: Final commit if needed**

```bash
git commit -m "chore: full verification passes"
```
