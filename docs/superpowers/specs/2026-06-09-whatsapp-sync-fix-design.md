# WhatsApp Sync Fix & Resync Design

## Problem

Pressing "Connect WhatsApp" in the UI, scanning the QR code, causes the sync state to immediately jump from "syncing" to "sync complete (43 chats, 0 messages)" while the iPhone is still syncing. 1-2 minutes later, the connection disappears from the UI (while the phone still shows connected).

Root causes:

1. **Stale-store shortcut** (`service-sync.ts:28-33`): Persisted store data from previous sessions triggers immediate `syncState = 'complete'` with stale "0 messages" counts.
2. **`syncFullHistory: false`** (`whatsapp-service-init.ts:52`): Baileys fires `isLatest: true` almost immediately, signaling sync completion before the phone has finished pushing history.
3. **Premature idle timeout** (`service-sync.ts:49`): A 5-second timeout force-completes sync during quiet periods while the phone is still pushing data.
4. **Watchdog kills connection during sync** (`service-watchdog.ts:12-14`): 120s timeout disconnects during sync, when transport may appear quiet despite active data processing.

## Fix: Targeted Bug Fixes per Component

### 1. Sync State Machine — `apps/daemon/src/whatsapp/service-sync.ts`

Remove the stale-store shortcut and the 5-second idle timeout entirely. Sync should only complete when Baileys signals `isLatest: true`.

- Remove lines 28-33 (the "if store already has data, immediately complete" shortcut)
- Remove lines 40-49 (the 5-second idle timeout via `resetSyncTimeout`)
- Always set `syncState = 'syncing'` on attach, emit initial progress
- On `messaging-history.set`: update counters and emit progress. If `isLatest === true`, set `complete` and clean up listeners.
- On `messages.upsert`: update message counters, re-emit progress (keeps UI showing activity during slow sync).
- Call `touchTransport(state)` on each sync event to keep the watchdog happy.

### 2. Full History Sync — `apps/daemon/src/whatsapp/whatsapp-service-init.ts`

Change `syncFullHistory: false` to `syncFullHistory: true`. This tells Baileys to request the full message history from the phone, and only fire `isLatest: true` when all data has been received.

### 3. Watchdog Fix — `apps/daemon/src/whatsapp/service-watchdog.ts`

- Skip watchdog checks entirely while `syncState === 'syncing'`.
- Bump idle timeout from 120s to 300s (5 minutes) to match openclaw's transport timeout.
- Keep check interval at 60s.

### 4. Transport Activity Tracking — `apps/daemon/src/whatsapp/service-sync.ts`

Call `touchTransport(state)` for each `messaging-history.set` and `messages.upsert` event in `syncAttachListeners`. Import `touchTransport` from `service-lifecycle.ts`.

### 5. Resync Function

**`WhatsAppService.ts`**: Add a `resync()` method:
- If connected (socket exists, status is `connected`): Reset `syncState` to `'syncing'`, reset `syncProgress` counters, re-attach sync listeners (call `syncAttachListeners` again after removing old ones), emit progress event.
- If disconnected: Call `lifecycleConnect()` (same as initial connect).

**`WhatsAppDaemonService`** (`apps/daemon/src/whatsapp-service.ts`): Update `resync()` to call `WhatsAppService.resync()` when service exists.

**`service-reconnect.ts`**: Keep `lifecycleReconnect()` for actual reconnection scenarios (disconnect + reconnect). It remains unchanged — it's for when the socket dies, not for data resync.

### 6. Reconnection Improvements — `apps/daemon/src/whatsapp/reconnection.ts`

- Increase `MAX_RECONNECT_ATTEMPTS` from 5 to 12.
- Cap delay at 30s (`MAX_RECONNECT_DELAY_MS = 30_000`).
- Apply jitter like openclaw (±25%).

### 7. UI Changes

**`WhatsAppCard.tsx`**:
- Rename "Reconnect" button to "Resync".
- Show "Resync" button when connected AND (`syncState === 'complete'` OR `syncState === 'idle'`).
- Show syncing progress (progress bar + counters) when `syncState === 'syncing'`.

**`useWhatsAppCard.ts`**:
- Remove the 30-second `connectTimeoutRef` — status events handle connection state properly, and the timeout was masking real issues.
- Keep `handleResync` calling `myboteam.resyncWhatsApp()`.

### 8. `LifecycleState` — `apps/daemon/src/whatsapp/service-lifecycle.ts`

No structural changes. `syncAttachListeners` already receives `state` which has `syncState` and `syncProgress` fields. The function signature changes slightly to accept the state directly (it already does).

## Files Changed

| File | Change |
|------|--------|
| `apps/daemon/src/whatsapp/service-sync.ts` | Remove stale-store shortcut, remove 5s idle timeout, add `touchTransport` calls, clean up listeners on complete |
| `apps/daemon/src/whatsapp/whatsapp-service-init.ts` | `syncFullHistory: false` → `syncFullHistory: true` |
| `apps/daemon/src/whatsapp/service-watchdog.ts` | Skip checks during sync, bump timeout to 300s |
| `apps/daemon/src/whatsapp/reconnection.ts` | Max attempts 5→12, cap delay 30s, add jitter |
| `apps/daemon/src/whatsapp/WhatsAppService.ts` | Add `resync()` method |
| `apps/daemon/src/whatsapp/whatsapp-service.ts` | Update `resync()` to call `service.resync()` |
| `apps/web/.../WhatsAppCard.tsx` | Rename button, show resync in idle state |
| `apps/web/.../useWhatsAppCard.ts` | Remove connect timeout |

## Success Criteria

- Scanning QR code → status changes to "connected" with `syncState = 'syncing'`
- Sync progress updates in real time (chats count increases, messages count increases)
- Sync only completes when Baileys sends `isLatest: true` (full history received)
- "Resync" button re-triggers sync without reconnecting
- Watchdog does not kill connection during sync
- Connection remains stable for hours after successful sync