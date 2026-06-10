# WhatsApp Message Reading Fix - Design Spec

**Date:** 2026-06-10
**Issue:** MAO-119
**Status:** Approved

## Overview

Fix WhatsApp message reading to work seamlessly. User scans QR to connect, data syncs, agent can create and read messages via MCP tools.

## Problems Fixed

1. `makeInMemoryStore` removed in Baileys v7 - PR #17 replaced with custom store but had bugs
2. `messaging-history.set` handler did not clear messages - caused duplicates
3. Persistence loading added to existing Maps instead of replacing - caused duplicates
4. `getMessages()` only captured text messages - images/videos/audio/discards were silently discarded
5. Sync completion used 15s debounce instead of Baileys `isLatest` signal
6. `resync()` did full reconnect instead of soft resync

## New Store Architecture

Replace `whatsapp-store.ts` with a cleaner explicit API:

```typescript
interface WhatsAppStore {
  bind(ev: BaileysEventEmitter): void;

  // Chat operations
  getChats(): ChatSummary[];
  getChat(jid: string): ChatSummary | undefined;

  // Message operations
  getMessages(jid: string, limit: number, before?: number): MessageSummary[];
  addMessage(msg: WAMessage): void;

  // Sync control
  clearMessages(): void;
  clearChats(): void;

  // Persistence
  save(): void;
  load(): void;
}
```

**Key changes:**
- Explicit `addMessage()` instead of relying on event handlers to directly mutate Maps
- `getMessages(jid, limit, before?)` - supports pagination with `before` timestamp
- `clearMessages()` called explicitly on history sync to avoid duplicates
- `load()` replaces existing data, not adds to it
- Deduplication by `key.id` - if message ID already exists, skip

## Message Type Support

`MessageSummary.messageType` field:

| Type | Description | Content |
|------|-------------|---------|
| `text` | Plain text message | The text content |
| `image` | Image with optional caption | `"📷 Image: <caption>"` or `"📷 Image"` |
| `video` | Video with optional caption | `"🎥 Video: <caption>"` or `"🎥 Video"` |
| `audio` | Audio/voice note | `"🎤 Audio"` |
| `document` | Document/file | `"📄 <filename>"` |
| `sticker` | Sticker | `"😊 Sticker"` |
| `reaction` | Reaction to another message | `"<emoji> react"` |
| `location` | Location pin | `"📍 Location"` |
| `contact` | Contact card | `"👤 Contact: <name>"` |
| `system` | System message | The system text |

Media placeholders are descriptive strings. Actual media can be downloaded via `downloadMedia()`.

## Sync Completion Logic

**Trigger:** Baileys `messaging-history.set` with `isLatest: true`

```typescript
socket.ev.on('messaging-history.set', (data: {
  chats?: Chat[];
  messages?: WAMessage[];
  isLatest?: boolean;
}) => {
  if (data.isLatest) {
    markSyncComplete();
  }
  // Process all data with deduplication
});
```

**Fallback:** If `isLatest: true` never arrives, force-complete after 90 seconds.

**Soft Resync:** `resync()` clears messages and chats, resets `syncState = 'idle'`, re-attaches sync listeners. No socket reconnect.

## File Changes

### New Files
- None

### Deleted Files
- `apps/daemon/src/whatsapp/whatsapp-store-persistence.ts` (replaced by simpler persistence in new store)

### Modified Files

| File | Changes |
|------|---------|
| `apps/daemon/src/whatsapp/whatsapp-store.ts` | Complete rewrite with new API |
| `apps/daemon/src/whatsapp/service-store.ts` | Update to use new store API, support all message types |
| `apps/daemon/src/whatsapp/service-sync.ts` | Use `isLatest` signal, remove debounce, implement soft resync |
| `apps/daemon/src/whatsapp/baileys-types.ts` | Expand `BaileysMessage` interface for all message types |
| `apps/daemon/src/whatsapp/WhatsAppService.ts` | Update `resync()` for soft resync |
| `apps/daemon/src/whatsapp/whatsapp-service-init.ts` | Minor adjustments if needed |

### MCP Tools
No changes to MCP tools - same `GetWhatsAppMessages`, `ListWhatsAppChats`, etc. They just work better now.

## Data Flow

```
WhatsApp Server sends history
    ↓
messaging-history.set event (isLatest=true)
    ↓
store.clearMessages() + store.clearChats()
    ↓
Process each message with deduplication
    ↓
store.addMessage() → deduped by key.id
    ↓
markSyncComplete()
    ↓
MCP GetWhatsAppMessages → store.getMessages()
```

## Testing

1. Connect WhatsApp via QR
2. Verify sync completes (check syncState = 'complete')
3. Verify messages from multiple chats are retrievable
4. Verify all message types are returned (not just text)
5. Verify no duplicate messages after reconnect
6. Verify resync clears and re-syncs without disconnecting