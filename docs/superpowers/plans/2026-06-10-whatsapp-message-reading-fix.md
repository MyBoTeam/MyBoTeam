# WhatsApp Message Reading Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix WhatsApp message reading to return all message types with proper sync, deduplication, and persistence.

**Architecture:** Complete rewrite of `whatsapp-store.ts` with explicit API, expand type support, use Baileys `isLatest` signal for sync completion, implement soft resync.

**Tech Stack:** TypeScript, Baileys v7, Node.js ESM

---

## File Structure

| File | Responsibility |
|------|----------------|
| `apps/daemon/src/whatsapp/whatsapp-store.ts` | Rewrite: New store API with explicit methods, deduplication, proper persistence |
| `apps/daemon/src/whatsapp/whatsapp-store-persistence.ts` | Delete (functionality moved into new whatsapp-store.ts) |
| `apps/daemon/src/whatsapp/service-store.ts` | Update: Use new store API, support all message types |
| `apps/daemon/src/whatsapp/service-sync.ts` | Update: Use `isLatest` signal, remove debounce, implement soft resync |
| `apps/daemon/src/whatsapp/baileys-types.ts` | Expand: Full WAMessage support for all message types |
| `apps/daemon/src/whatsapp/whatsapp-types.ts` | Expand: `messageType` field for all message types |
| `apps/daemon/src/whatsapp/WhatsAppService.ts` | Update: `resync()` does soft resync |

---

## Task 1: Expand Type Definitions

**Files:**
- Modify: `apps/daemon/src/whatsapp/baileys-types.ts`
- Modify: `apps/daemon/src/whatsapp/whatsapp-types.ts`

### Step 1: Update baileys-types.ts

Replace `BaileysMessage` interface with full WAMessage support:

```typescript
export interface BaileysMessage {
  key?: {
    fromMe?: boolean | null;
    participant?: string | null;
    remoteJid?: string | null;
    id?: string | null;
  } | null;
  message?: {
    conversation?: string | null;
    extendedTextMessage?: { text?: string | null } | null;
    imageMessage?: { caption?: string | null; mimetype?: string } | null;
    videoMessage?: { caption?: string | null; mimetype?: string } | null;
    audioMessage?: { mimetype?: string; ptt?: boolean } | null;
    documentMessage?: { mimetype?: string; fileName?: string } | null;
    stickerMessage?: Record<string, unknown> | null;
    reactionMessage?: { text?: string } | null;
    locationMessage?: Record<string, unknown> | null;
    contactMessage?: { displayName?: string } | null;
    systemMessage?: { body?: string } | null;
  } | null;
  messageTimestamp?: unknown;
}
```

### Step 2: Update whatsapp-types.ts

Replace `MessageSummary` interface:

```typescript
export type MessageType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'document' 
  | 'sticker' 
  | 'reaction' 
  | 'location' 
  | 'contact' 
  | 'system';

export interface MessageSummary {
  messageId: string;
  senderJid: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
  messageType: MessageType;
}
```

### Step 3: Commit

```bash
git add apps/daemon/src/whatsapp/baileys-types.ts apps/daemon/src/whatsapp/whatsapp-types.ts
git commit -m "feat(whatsapp): expand type definitions for all message types (MAO-119)"
```

---

## Task 2: Rewrite whatsapp-store.ts

**Files:**
- Create: `apps/daemon/src/whatsapp/whatsapp-store.ts` (complete rewrite)

### Step 1: Write the new whatsapp-store.ts

```typescript
import fs from 'fs';
import type { BaileysChat, BaileysEventEmitter, BaileysMessage } from './baileys-types.js';
import type { ChatSummary, MessageSummary, MessageType } from './whatsapp-types.js';
import { toTimestamp } from './whatsapp-types.js';

const SAVE_DEBOUNCE_MS = 2000;

export interface WhatsAppStore {
  bind(ev: BaileysEventEmitter): void;
  getChats(): ChatSummary[];
  getChat(jid: string): ChatSummary | undefined;
  getMessages(jid: string, limit: number, before?: number): MessageSummary[];
  clearMessages(): void;
  clearChats(): void;
  save(): void;
  load(): void;
}

export function createStore(storePath?: string): WhatsAppStore {
  const chatsMap = new Map<string, BaileysChat>();
  const messagesMap = new Map<string, Map<string, BaileysMessage>>();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let serializing = false;

  function ensureMessageMap(jid: string): Map<string, BaileysMessage> {
    let map = messagesMap.get(jid);
    if (!map) {
      map = new Map();
      messagesMap.set(jid, map);
    }
    return map;
  }

  function doSave(): void {
    if (!storePath || serializing) return;
    serializing = true;
    try {
      const chats = Array.from(chatsMap.entries());
      const messages = Array.from(messagesMap.entries()).map(([jid, msgMap]) => [
        jid,
        Array.from(msgMap.entries()),
      ]);
      fs.writeFileSync(storePath, JSON.stringify({ chats, messages }), 'utf-8');
    } catch {
      // Silently handle persistence errors
    } finally {
      serializing = false;
    }
  }

  function debouncedSave(): void {
    if (!storePath) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => doSave(), SAVE_DEBOUNCE_MS);
  }

  function load(): void {
    if (!storePath) return;
    try {
      if (!fs.existsSync(storePath)) return;
      const data = JSON.parse(fs.readFileSync(storePath, 'utf-8')) as {
        chats: [string, BaileysChat][];
        messages: [string, [string, BaileysMessage][]][];
      };
      chatsMap.clear();
      for (const [jid, chat] of data.chats) {
        chatsMap.set(jid, chat);
      }
      messagesMap.clear();
      for (const [jid, msgEntries] of data.messages) {
        const map = new Map();
        for (const [msgId, msg] of msgEntries) {
          map.set(msgId, msg);
        }
        messagesMap.set(jid, map);
      }
    } catch {
      // Silently handle load errors
    }
  }

  function clearMessages(): void {
    messagesMap.clear();
    debouncedSave();
  }

  function clearChats(): void {
    chatsMap.clear();
    debouncedSave();
  }

  function getChats(): ChatSummary[] {
    return Array.from(chatsMap.values()).map((c) => ({
      jid: c.id,
      name: c.name ?? undefined,
      lastMessageAt: toTimestamp(c.conversationTimestamp),
    }));
  }

  function getChat(jid: string): ChatSummary | undefined {
    const c = chatsMap.get(jid);
    if (!c) return undefined;
    return {
      jid: c.id,
      name: c.name ?? undefined,
      lastMessageAt: toTimestamp(c.conversationTimestamp),
    };
  }

  function getMessages(jid: string, limit: number, _before?: number): MessageSummary[] {
    const chatMessages = messagesMap.get(jid);
    if (!chatMessages) return [];
    return Array.from(chatMessages.values())
      .slice(-limit)
      .flatMap((m) => normalizeMessage(m));
  }

  function normalizeMessage(m: BaileysMessage): MessageSummary[] {
    const key = m.key;
    const msg = m.message;
    if (!key?.id || !key?.remoteJid) return [];

    const senderJid = key.fromMe ? 'me' : (key.participant ?? key.remoteJid);
    const timestamp = toTimestamp(m.messageTimestamp) ?? 0;
    const text = extractText(msg);
    const messageType = detectMessageType(msg);

    return [{
      messageId: key.id,
      senderJid,
      fromMe: Boolean(key.fromMe),
      text,
      timestamp,
      messageType,
    }];
  }

  function extractText(msg: BaileysMessage['message']): string {
    if (!msg) return '';
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return `📷 Image: ${msg.imageMessage.caption}`;
    if (msg.videoMessage?.caption) return `🎥 Video: ${msg.videoMessage.caption}`;
    if (msg.audioMessage) return '🎤 Audio';
    if (msg.documentMessage) return `📄 ${msg.documentMessage.fileName ?? 'Document'}`;
    if (msg.stickerMessage) return '😊 Sticker';
    if (msg.reactionMessage?.text) return `${msg.reactionMessage.text} react`;
    if (msg.locationMessage) return '📍 Location';
    if (msg.contactMessage?.displayName) return `👤 Contact: ${msg.contactMessage.displayName}`;
    if (msg.systemMessage?.body) return msg.systemMessage.body;
    return '';
  }

  function detectMessageType(msg: BaileysMessage['message']): MessageType {
    if (!msg) return 'text';
    if (msg.conversation || msg.extendedTextMessage) return 'text';
    if (msg.imageMessage) return 'image';
    if (msg.videoMessage) return 'video';
    if (msg.audioMessage) return 'audio';
    if (msg.documentMessage) return 'document';
    if (msg.stickerMessage) return 'sticker';
    if (msg.reactionMessage) return 'reaction';
    if (msg.locationMessage) return 'location';
    if (msg.contactMessage) return 'contact';
    if (msg.systemMessage) return 'system';
    return 'text';
  }

  function bind(ev: BaileysEventEmitter): void {
    ev.on('messaging-history.set', (data: unknown) => {
      const { chats, messages, isLatest } = data as {
        chats?: Record<string, unknown>[];
        messages?: Record<string, unknown>[];
        isLatest?: boolean;
      };
      clearChats();
      clearMessages();
      if (chats) {
        for (const chat of chats) {
          const id = (chat.id as string) ?? '';
          if (!id) continue;
          chatsMap.set(id, {
            id,
            name: chat.name as string | null | undefined,
            conversationTimestamp: chat.conversationTimestamp,
          });
        }
      }
      if (messages) {
        for (const raw of messages) {
          const key = raw.key as Record<string, unknown> | null;
          const jid = (key?.remoteJid as string) ?? '';
          if (!jid) continue;
          const msgId = (key?.id as string) ?? '';
          if (!msgId) continue;
          ensureMessageMap(jid).set(msgId, raw as BaileysMessage);
        }
      }
      doSave();
    });

    ev.on('chats.upsert', (data: unknown) => {
      const chats = data as Record<string, unknown>[];
      for (const chat of chats) {
        const id = (chat.id as string) ?? '';
        if (!id) continue;
        chatsMap.set(id, {
          id,
          name: chat.name as string | null | undefined,
          conversationTimestamp: chat.conversationTimestamp,
        });
      }
      debouncedSave();
    });

    ev.on('chats.update', (data: unknown) => {
      const updates = data as Record<string, unknown>[];
      for (const update of updates) {
        const id = (update.id as string) ?? '';
        if (!id) continue;
        const existing = chatsMap.get(id);
        if (!existing) continue;
        if (update.name !== undefined) {
          existing.name = update.name as string | null | undefined;
        }
        if (update.conversationTimestamp !== undefined) {
          existing.conversationTimestamp = update.conversationTimestamp;
        }
      }
    });

    ev.on('chats.delete', (data: unknown) => {
      const ids = data as string[];
      for (const id of ids) {
        chatsMap.delete(id);
        messagesMap.delete(id);
      }
      debouncedSave();
    });

    ev.on('messages.upsert', (data: unknown) => {
      const { messages } = data as { messages: Record<string, unknown>[]; type: string };
      for (const raw of messages) {
        const key = raw.key as Record<string, unknown> | null;
        const jid = (key?.remoteJid as string) ?? '';
        const msgId = (key?.id as string) ?? '';
        if (!jid || !msgId) continue;
        // Deduplicate by key.id
        if (ensureMessageMap(jid).has(msgId)) continue;
        ensureMessageMap(jid).set(msgId, raw as BaileysMessage);
      }
      debouncedSave();
    });

    ev.on('messages.update', (data: unknown) => {
      const updates = data as { key: Record<string, unknown>; update: Record<string, unknown> }[];
      for (const { key, update } of updates) {
        const jid = (key.remoteJid as string) ?? '';
        const msgId = (key.id as string) ?? '';
        if (!jid || !msgId) continue;
        const map = messagesMap.get(jid);
        if (!map) continue;
        const existing = map.get(msgId);
        if (existing) Object.assign(existing, update);
      }
    });

    ev.on('messages.delete', (data: unknown) => {
      const deleted = data as
        | { keys: Array<{ remoteJid?: string | null; id?: string | null }> }
        | { jid: string | null; all: boolean };
      if ('keys' in deleted) {
        for (const key of deleted.keys) {
          const jid = key?.remoteJid ?? '';
          if (!jid) continue;
          const msgId = key?.id;
          if (!msgId) continue;
          messagesMap.get(jid)?.delete(msgId);
        }
      } else if ('all' in deleted && deleted.all && deleted.jid) {
        messagesMap.delete(deleted.jid);
      }
      debouncedSave();
    });
  }

  return {
    bind,
    getChats,
    getChat,
    getMessages,
    clearMessages,
    clearChats,
    save: doSave,
    load,
  };
}
```

### Step 2: Commit

```bash
git add apps/daemon/src/whatsapp/whatsapp-store.ts
git commit -m "feat(whatsapp): rewrite whatsapp-store with new API, deduplication, proper persistence (MAO-119)"
```

---

## Task 3: Delete whatsapp-store-persistence.ts

**Files:**
- Delete: `apps/daemon/src/whatsapp/whatsapp-store-persistence.ts`

### Step 1: Delete the file

```bash
rm apps/daemon/src/whatsapp/whatsapp-store-persistence.ts
```

### Step 2: Commit

```bash
git rm apps/daemon/src/whatsapp/whatsapp-store-persistence.ts
git commit -m "refactor(whatsapp): remove whatsapp-store-persistence.ts, functionality merged into new store (MAO-119)"
```

---

## Task 4: Update service-store.ts

**Files:**
- Modify: `apps/daemon/src/whatsapp/service-store.ts`

### Step 1: Rewrite service-store.ts

```typescript
import type { BaileysStore } from './baileys-types.js';
import { type ChatSummary, type MessageSummary } from './whatsapp-types.js';

export function getChats(store: BaileysStore | null, limit: number): ChatSummary[] {
  if (!store) return [];
  return store.getChats().slice(0, limit);
}

export function getMessages(
  store: BaileysStore | null,
  jid: string,
  limit: number,
): MessageSummary[] {
  if (!store) return [];
  return store.getMessages(jid, limit);
}

export function getGroups(
  store: BaileysStore | null,
  limit: number,
): Array<{ jid: string; name?: string; participants: number }> {
  if (!store) return [];
  return store
    .getChats()
    .filter((c) => c.jid.endsWith('@g.us'))
    .slice(0, limit)
    .map((c) => ({
      jid: c.jid,
      name: c.name,
      participants: 0,
    }));
}

export function getGroupInfo(
  store: BaileysStore | null,
  groupJid: string,
): { jid: string; name?: string } | null {
  if (!store) return null;
  const chat = store.getChat(groupJid);
  if (!chat) return null;
  return { jid: chat.jid, name: chat.name };
}
```

### Step 2: Commit

```bash
git add apps/daemon/src/whatsapp/service-store.ts
git commit -m "feat(whatsapp): update service-store to use new WhatsAppStore API (MAO-119)"
```

---

## Task 5: Update service-sync.ts

**Files:**
- Modify: `apps/daemon/src/whatsapp/service-sync.ts`

### Step 1: Rewrite service-sync.ts

```typescript
import type { LifecycleState } from './service-lifecycle.js';
import { touchTransport } from './service-lifecycle.js';

const SYNC_TIMEOUT_MS = 90_000;

export function syncAttachListeners(
  state: LifecycleState,
  emit: (event: string, ...args: unknown[]) => void,
): void {
  if (!state.socket) return;

  cleanupSyncListeners(state);

  const checkStoreAndEmit = () => {
    if (!state.store) return;
    const chats = state.store.getChats();
    state.syncProgress = {
      chatsProcessed: chats.length,
      messagesProcessed: 0,
    };
    emit('syncProgress', { ...state.syncProgress, syncState: state.syncState });
  };

  const markSyncComplete = () => {
    if (state.syncState !== 'syncing') return;
    state.syncState = 'complete';
    checkStoreAndEmit();
    cleanupSyncListeners(state);
  };

  state.syncState = 'syncing';
  state.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
  emit('syncProgress', { ...state.syncProgress, syncState: 'syncing' });

  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let markedComplete = false;

  const onHistorySet = (data: unknown) => {
    touchTransport(state);
    const { isLatest } = data as { isLatest?: boolean };
    checkStoreAndEmit();
    if (isLatest && !markedComplete) {
      markedComplete = true;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      markSyncComplete();
    }
  };

  const onMessagesUpsert = () => {
    touchTransport(state);
    checkStoreAndEmit();
  };

  state.socket.ev.on('messaging-history.set', onHistorySet);
  state.socket.ev.on('messages.upsert', onMessagesUpsert);

  timeoutTimer = setTimeout(() => {
    if (!markedComplete) {
      markedComplete = true;
      markSyncComplete();
    }
  }, SYNC_TIMEOUT_MS);

  state.syncListeners = { onHistorySet, onMessagesUpsert, debounceTimer: null, timeoutTimer };
}

export function cleanupSyncListeners(state: LifecycleState): void {
  if (!state.socket || !state.syncListeners) return;
  state.socket.ev.off('messaging-history.set', state.syncListeners.onHistorySet);
  state.socket.ev.off('messages.upsert', state.syncListeners.onMessagesUpsert);
  if (state.syncListeners.timeoutTimer) {
    clearTimeout(state.syncListeners.timeoutTimer);
  }
  state.syncListeners = null;
}
```

### Step 2: Commit

```bash
git add apps/daemon/src/whatsapp/service-sync.ts
git commit -m "feat(whatsapp): use isLatest signal for sync completion, add 90s timeout fallback (MAO-119)"
```

---

## Task 6: Update baileys-types.ts

**Files:**
- Modify: `apps/daemon/src/whatsapp/baileys-types.ts`

### Step 1: Update BaileysStore interface

```typescript
export interface BaileysStore {
  bind(ev: BaileysEventEmitter): void;
  getChats(): ChatSummary[];
  getChat(jid: string): ChatSummary | undefined;
  getMessages(jid: string, limit: number): MessageSummary[];
  clearMessages(): void;
  clearChats(): void;
  save(): void;
  load(): void;
}

export interface BaileysChat {
  id: string;
  name?: string | null;
  conversationTimestamp: unknown;
}
```

### Step 2: Commit

```bash
git add apps/daemon/src/whatsapp/baileys-types.ts
git commit -m "feat(whatsapp): update BaileysStore interface to match new store API (MAO-119)"
```

---

## Task 7: Update WhatsAppService.ts for Soft Resync

**Files:**
- Modify: `apps/daemon/src/whatsapp/WhatsAppService.ts:163-165`
- Modify: `apps/daemon/src/whatsapp/service-lifecycle.ts`
- Modify: `apps/daemon/src/whatsapp/service-sync.ts`

### Step 1: Add softResync to LifecycleState

In `service-lifecycle.ts`, add:

```typescript
export function lifecycleSoftResync(
  state: LifecycleState,
  emit: (event: string, ...args: unknown[]) => void,
): void {
  if (!state.socket || !state.store) return;
  state.syncState = 'idle';
  cleanupSyncListeners(state);
  syncAttachListeners(state, emit);
}
```

### Step 2: Update WhatsAppService.ts

Change `resync()` method:

```typescript
async resync(): Promise<void> {
  if (!this.l.socket || !this.l.store) {
    await this.reconnect();
    return;
  }
  // Soft resync - clear and re-sync without reconnecting
  this.l.store.clearMessages();
  this.l.store.clearChats();
  this.l.syncState = 'idle';
  cleanupSyncListeners(this.l);
  syncAttachListeners(this.l, (e, ...a) => this.emit(e, ...a));
}
```

Add imports for `cleanupSyncListeners` and `syncAttachListeners`.

### Step 3: Commit

```bash
git add apps/daemon/src/whatsapp/WhatsAppService.ts apps/daemon/src/whatsapp/service-lifecycle.ts apps/daemon/src/whatsapp/service-sync.ts
git commit -m "feat(whatsapp): implement soft resync that clears and re-syncs without reconnecting (MAO-119)"
```

---

## Task 8: Run TypeCheck and Fix Any Issues

### Step 1: Run typecheck

```bash
cd /Users/mavishay/Projects/MaorInnovations/myboteam_v0.3.0/.worktrees/MAO-119-whatsapp-fix
pnpm typecheck 2>&1 | head -100
```

### Step 2: Fix any type errors

Common issues:
- Missing imports
- Interface mismatches
- Missing properties on types

### Step 3: Commit fixes

```bash
git add -A
git commit -m "fix(whatsapp): typecheck fixes (MAO-119)"
```

---

## Task 9: Verify and Run Tests

### Step 1: Run check

```bash
pnpm check 2>&1 | head -100
```

### Step 2: Run daemon tests if any

```bash
pnpm -F @myboteam/daemon test 2>&1 | head -100
```

### Step 3: Commit

```bash
git add -A
git commit -m "test(whatsapp): verify build passes (MAO-119)"
```

---

## Task 10: Final Review and Summary

### Step 1: Review all changes

```bash
git log --oneline -20
git diff --stat HEAD~10..HEAD
```

### Step 2: Verify no placeholder issues

Check that all TODO/FIXME comments are resolved and no placeholders remain.

---

## Summary of Changes

| Task | Files | What Changed |
|------|-------|--------------|
| 1 | baileys-types.ts, whatsapp-types.ts | Expanded types for all message types |
| 2 | whatsapp-store.ts | Complete rewrite with new API |
| 3 | whatsapp-store-persistence.ts | Deleted |
| 4 | service-store.ts | Updated to use new store API |
| 5 | service-sync.ts | isLatest signal + 90s timeout |
| 6 | baileys-types.ts | Updated BaileysStore interface |
| 7 | WhatsAppService.ts, service-lifecycle.ts | Soft resync implementation |
| 8 | (various) | Typecheck fixes |
| 9 | (various) | Build verification |