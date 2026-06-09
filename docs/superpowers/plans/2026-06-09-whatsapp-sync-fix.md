# WhatsApp Sync Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix WhatsApp sync so it completes fully with real data, stays connected, and supports a proper resync action.

**Architecture:** Fix 4 root-cause bugs (premature sync completion, `syncFullHistory: false`, watchdog killing sync, stale-store shortcut), add a proper `resync()` method, rename UI button from "Reconnect" to "Resync", and increase reconnection resilience.

**Tech Stack:** TypeScript, Vitest, React, Electron IPC

---

### Task 1: Fix sync state machine — remove stale-store shortcut and idle timeout

**Files:**
- Modify: `apps/daemon/src/whatsapp/service-sync.ts`

- [ ] **Step 1: Rewrite `syncAttachListeners` to remove bugs and add `touchTransport`**

Replace the entire content of `service-sync.ts` with:

```typescript
import type { LifecycleState } from './service-lifecycle.js';
import { touchTransport } from './service-lifecycle.js';

export function syncAttachListeners(
  state: LifecycleState,
  emit: (event: string, ...args: unknown[]) => void,
): void {
  if (!state.socket) return;

  const countStoreMessages = (): { chats: number; messages: number } => ({
    chats: state.store?.chats?.all()?.length ?? 0,
    messages: state.store?.messages
      ? Object.values(state.store.messages).reduce(
          (sum, msgMap) => sum + (msgMap?.all()?.length ?? 0),
          0,
        )
      : 0,
  });

  const checkStoreAndEmit = () => {
    const counts = countStoreMessages();
    state.syncProgress = {
      chatsProcessed: Math.max(state.syncProgress.chatsProcessed, counts.chats),
      messagesProcessed: Math.max(state.syncProgress.messagesProcessed, counts.messages),
    };
    emit('syncProgress', { ...state.syncProgress, syncState: state.syncState });
  };

  state.syncState = 'syncing';
  state.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
  emit('syncProgress', { ...state.syncProgress, syncState: 'syncing' });

  state.socket.ev.on('messaging-history.set', (raw: unknown) => {
    const data = raw as { chats?: unknown[]; messages?: unknown[]; isLatest?: boolean } | undefined;
    touchTransport(state);
    if (data?.isLatest) {
      state.syncState = 'complete';
      checkStoreAndEmit();
      cleanupSyncListeners(state);
      return;
    }
    checkStoreAndEmit();
  });

  state.socket.ev.on('messages.upsert', () => {
    touchTransport(state);
    checkStoreAndEmit();
  });
}

export function cleanupSyncListeners(state: LifecycleState): void {
  if (!state.socket) return;
  state.socket.ev.removeAllListeners('messaging-history.set');
  state.socket.ev.removeAllListeners('messages.upsert');
}
```

Key changes:
- Removed the stale-store shortcut (lines 28-33 of original) that immediately set `syncState = 'complete'` based on persisted data
- Removed the 5-second idle timeout (lines 40-49 of original)
- Added `touchTransport(state)` calls on every sync event to keep the watchdog happy
- Exported `cleanupSyncListeners` for use by resync and lifecycle disconnect
- Sync now only completes when Baileys sends `isLatest: true`

- [ ] **Step 2: Verify `touchTransport` is exported from `service-lifecycle.ts`**

Check that `service-lifecycle.ts` already exports `touchTransport`. It does on line 156. No change needed.

- [ ] **Step 3: Update imports in `service-lifecycle.ts` to use `cleanupSyncListeners`**

In `service-lifecycle.ts`, add the import and use `cleanupSyncListeners` in `lifecycleDisconnect` and `lifecycleDispose`. The existing `removeAllListeners('messaging-history.set')` and `removeAllListeners('messages.upsert')` calls are now handled by this function.

- [ ] **Step 4: Commit**

```bash
git add apps/daemon/src/whatsapp/service-sync.ts apps/daemon/src/whatsapp/service-lifecycle.ts
git commit -m "fix: remove stale-store shortcut and idle timeout from WhatsApp sync"
```

---

### Task 2: Enable full history sync

**Files:**
- Modify: `apps/daemon/src/whatsapp/whatsapp-service-init.ts`

- [ ] **Step 1: Change `syncFullHistory` to `true`**

In `whatsapp-service-init.ts`, change the `makeWASocket` call at line 52:

```typescript
syncFullHistory: true,
```

This tells Baileys to request full message history and only fire `isLatest: true` when all data is received.

- [ ] **Step 2: Commit**

```bash
git add apps/daemon/src/whatsapp/whatsapp-service-init.ts
git commit -m "fix: enable syncFullHistory for complete WhatsApp message sync"
```

---

### Task 3: Fix watchdog — skip during sync, bump timeout

**Files:**
- Modify: `apps/daemon/src/whatsapp/service-watchdog.ts`

- [ ] **Step 1: Rewrite watchdog to skip during sync and bump timeout**

Replace the entire content of `service-watchdog.ts`:

```typescript
import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';
import type { LifecycleState } from './service-lifecycle.js';

const WATCHDOG_CHECK_INTERVAL_MS = 60_000;
const WATCHDOG_IDLE_TIMEOUT_MS = 300_000;

export function startWatchdog(
  state: LifecycleState,
  setStatus: (s: MessagingConnectionStatus) => void,
): void {
  stopWatchdog(state);
  state.watchdogTimer = setInterval(() => {
    if (!state.socket) return;
    if (state.syncState === 'syncing') return;
    if (Date.now() - state.lastTransportActivity > WATCHDOG_IDLE_TIMEOUT_MS) {
      setStatus('disconnected');
    }
  }, WATCHDOG_CHECK_INTERVAL_MS);
}

export function stopWatchdog(state: LifecycleState): void {
  if (state.watchdogTimer) {
    clearInterval(state.watchdogTimer);
    state.watchdogTimer = null;
  }
}
```

Key changes:
- Removed `emit` parameter — watchdog only sets status, doesn't need to emit
- Skip watchdog entirely when `syncState === 'syncing'` — during sync, the phone may be pushing data without visible transport activity
- Bumped timeout from 120s to 300s (5 minutes) — matches openclaw's transport timeout
- Check interval stays at 60s

- [ ] **Step 2: Update `startWatchdog` call sites to remove `emit` argument**

In `service-lifecycle.ts`, find the call to `startWatchdog` (line 89) and change it from:
```typescript
startWatchdog(state, setStatus, emit);
```
to:
```typescript
startWatchdog(state, setStatus);
```

- [ ] **Step 3: Commit**

```bash
git add apps/daemon/src/whatsapp/service-watchdog.ts apps/daemon/src/whatsapp/service-lifecycle.ts
git commit -m "fix: skip watchdog during WhatsApp sync and bump idle timeout to 5min"
```

---

### Task 4: Add `resync()` method to WhatsAppService

**Files:**
- Modify: `apps/daemon/src/whatsapp/WhatsAppService.ts`
- Modify: `apps/daemon/src/whatsapp/whatsapp-service.ts`

- [ ] **Step 1: Add `resync()` method to `WhatsAppService`**

Add this method to the `WhatsAppService` class in `WhatsAppService.ts`, after the `reconnect()` method:

```typescript
  resync(): void {
    if (!this.l.socket || this.l.status !== 'connected') {
      return;
    }
    cleanupSyncListeners(this.l);
    this.l.syncState = 'syncing';
    this.l.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
    syncAttachListeners(this.l, (e, ...a) => this.emit(e, ...a));
  }
```

Add the import at the top of `WhatsAppService.ts`:

```typescript
import { cleanupSyncListeners, syncAttachListeners } from './service-sync.js';
```

- [ ] **Step 2: Update `WhatsAppDaemonService.resync()` to call `service.resync()` when connected**

In `whatsapp-service.ts`, change the `resync()` method from:

```typescript
  async resync(): Promise<void> {
    if (this.service) {
      await this.service.reconnect();
    } else {
      await this.connect();
    }
  }
```

to:

```typescript
  async resync(): Promise<void> {
    if (this.service && this.service.getStatus() === 'connected') {
      this.service.resync();
    } else if (this.service) {
      await this.service.reconnect();
    } else {
      await this.connect();
    }
  }
```

This way:
- If connected: just re-attach sync listeners without dropping the connection
- If service exists but disconnected: full reconnect
- If no service: fresh connect

- [ ] **Step 3: Commit**

```bash
git add apps/daemon/src/whatsapp/WhatsAppService.ts apps/daemon/src/whatsapp/whatsapp-service.ts
git commit -m "feat: add resync method for WhatsApp data re-sync without reconnection"
```

---

### Task 5: Improve reconnection resilience

**Files:**
- Modify: `apps/daemon/src/whatsapp/reconnection.ts`

- [ ] **Step 1: Increase max attempts, cap delay, add jitter**

Replace the content of `reconnection.ts`:

```typescript
import { log } from '../logger.js';

export const MAX_RECONNECT_ATTEMPTS = 12;
export const INITIAL_RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const JITTER_FACTOR = 0.25;

export interface ReconnectState {
  attempts: number;
  scheduled: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

export function createReconnectState(): ReconnectState {
  return { attempts: 0, scheduled: false, timer: null };
}

export function clearReconnectTimer(state: ReconnectState): void {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

export function scheduleReconnect(
  state: ReconnectState,
  onConnect: () => Promise<void>,
  onMaxReached: () => void,
): void {
  if (state.scheduled) {
    return;
  }

  if (state.attempts >= MAX_RECONNECT_ATTEMPTS) {
    log.warn('[WhatsApp] Max reconnect attempts reached');
    onMaxReached();
    return;
  }

  state.attempts++;
  state.scheduled = true;

  const baseDelay = Math.min(
    INITIAL_RECONNECT_DELAY_MS * 2 ** (state.attempts - 1),
    MAX_RECONNECT_DELAY_MS,
  );
  const jitter = baseDelay * JITTER_FACTOR * (Math.random() * 2 - 1);
  const delay = Math.max(INITIAL_RECONNECT_DELAY_MS, baseDelay + jitter);

  log.warn(
    `[WhatsApp] Reconnecting in ${Math.round(delay)}ms (attempt ${state.attempts}/${MAX_RECONNECT_ATTEMPTS})`,
  );

  clearReconnectTimer(state);
  state.timer = setTimeout(() => {
    state.scheduled = false;
    onConnect().catch((err) => log.error('[WhatsApp] Reconnect failed:', err));
  }, delay);
}
```

Key changes:
- `MAX_RECONNECT_ATTEMPTS`: 5 → 12 (matches openclaw)
- Added `MAX_RECONNECT_DELAY_MS = 30_000` cap
- Added `JITTER_FACTOR = 0.25` (±25% randomization like openclaw)
- Delay formula: `baseDelay + jitter` with floor at `INITIAL_RECONNECT_DELAY_MS`

- [ ] **Step 2: Commit**

```bash
git add apps/daemon/src/whatsapp/reconnection.ts
git commit -m "fix: increase WhatsApp reconnect attempts to 12, cap delay at 30s, add jitter"
```

---

### Task 6: Update `lifecycleDisconnect` and `lifecycleDispose` to use `cleanupSyncListeners`

**Files:**
- Modify: `apps/daemon/src/whatsapp/service-lifecycle.ts`

- [ ] **Step 1: Import and use `cleanupSyncListeners` in disconnect and dispose**

In `service-lifecycle.ts`, add the import:

```typescript
import { cleanupSyncListeners } from './service-sync.js';
```

In `lifecycleDisconnect`, add before the existing `removeAllListeners` calls:

```typescript
  cleanupSyncListeners(state);
```

In `lifecycleDispose`, add after `stopWatchdog(state)`:

```typescript
  cleanupSyncListeners(state);
```

Remove the explicit `removeAllListeners('messaging-history.set')` and `removeAllListeners('messages.upsert')` calls from both functions since `cleanupSyncListeners` handles them.

- [ ] **Step 2: Verify the updated `lifecycleDisconnect` function**

The function should look like:

```typescript
export async function lifecycleDisconnect(
  state: LifecycleState,
  setStatus: (s: MessagingConnectionStatus) => void,
): Promise<void> {
  state.manualDisconnect = true;
  state.reconnect.scheduled = false;
  state.reconnect.attempts = 0;
  clearReconnectTimer(state.reconnect);
  stopWatchdog(state);
  cleanupSyncListeners(state);
  if (state.socket) {
    state.socket.ev.removeAllListeners('creds.update');
    state.socket.ev.removeAllListeners('connection.update');
    state.socket.ev.removeAllListeners('messages.upsert');
    await state.socket.logout().catch(() => {});
    state.socket.end(new Error('User requested disconnect'));
    state.socket = null;
  }
  state.qrCode = null;
  state.qrIssuedAt = null;
  state.store = null;
  state.syncState = 'idle';
  state.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
  cleanupAuthState(state.authStatePath);
  setStatus('disconnected');
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/daemon/src/whatsapp/service-lifecycle.ts
git commit -m "refactor: use cleanupSyncListeners in WhatsApp disconnect/dispose"
```

---

### Task 7: Update UI — rename Reconnect to Resync, show resync when idle, remove connect timeout

**Files:**
- Modify: `apps/web/src/client/pages/settings/integrations/components/WhatsAppCard.tsx`
- Modify: `apps/web/src/client/pages/settings/integrations/components/useWhatsAppCard.ts`

- [ ] **Step 1: Update WhatsAppCard.tsx**

In `WhatsAppCard.tsx`, change the "Reconnect" button:

Replace:
```tsx
{syncState === 'complete' && (
  <div className="mt-2">
    <div className="flex justify-between text-xs text-muted-foreground mb-1">
      <span>Sync complete</span>
      <span>
        {syncProgress.chatsProcessed} chats, {syncProgress.messagesProcessed} messages
      </span>
    </div>
    <Button variant="outline" size="sm" onClick={handleResync} className="mt-1">
      Reconnect
    </Button>
  </div>
)}
```

With:
```tsx
{(syncState === 'complete' || syncState === 'idle') && (
  <div className="mt-2">
    <div className="flex justify-between text-xs text-muted-foreground mb-1">
      <span>{syncState === 'syncing' ? 'Syncing messages…' : 'Sync complete'}</span>
      <span>
        {syncProgress.chatsProcessed} chats, {syncProgress.messagesProcessed} messages
      </span>
    </div>
    <Button variant="outline" size="sm" onClick={handleResync} className="mt-1">
      Resync
    </Button>
  </div>
)}
```

- [ ] **Step 2: Remove the 30-second connect timeout from `useWhatsAppCard.ts`**

Remove the `connectTimeoutRef` and its associated logic:

1. Remove `const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);`
2. Remove the cleanup in the useEffect: `if (connectTimeoutRef.current) { clearTimeout(connectTimeoutRef.current); }`
3. Remove the timeout setup in `handleConnect`:
   ```typescript
   if (connectTimeoutRef.current) {
     clearTimeout(connectTimeoutRef.current);
   }
   connectTimeoutRef.current = setTimeout(() => {
     setConnecting((prev) => {
       if (prev) {
         setError('Connection timed out. Please try again.');
       }
       return false;
     });
   }, 30_000);
   ```
4. Remove the timeout clear in the `handleConnect` catch block:
   ```typescript
   if (connectTimeoutRef.current) {
     clearTimeout(connectTimeoutRef.current);
     connectTimeoutRef.current = null;
   }
   ```
5. Remove `connectTimeoutRef` from the `useWhatsAppSubscriptions` call.

- [ ] **Step 3: Update `useWhatsAppSubscriptions.ts` to remove `connectTimeoutRef`**

In the `UseWhatsAppSubscriptionsOptions` interface, remove:
```typescript
connectTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
```

In the `clearTimers` function, remove:
```typescript
if (connectTimeoutRef.current) {
  clearTimeout(connectTimeoutRef.current);
  connectTimeoutRef.current = null;
}
```

In the `unsubQR` callback, remove:
```typescript
if (connectTimeoutRef.current) {
  clearTimeout(connectTimeoutRef.current);
  connectTimeoutRef.current = null;
}
```

In the `useEffect` dependency array, remove `connectTimeoutRef`.

In the destructured params, remove `connectTimeoutRef`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/client/pages/settings/integrations/components/WhatsAppCard.tsx apps/web/src/client/pages/settings/integrations/components/useWhatsAppCard.ts apps/web/src/client/pages/settings/integrations/components/useWhatsAppSubscriptions.ts
git commit -m "fix: rename Reconnect to Resync, show resync when idle, remove connect timeout"
```

---

### Task 8: Update `service-reconnect.ts` to use `cleanupSyncListeners`

**Files:**
- Modify: `apps/daemon/src/whatsapp/service-reconnect.ts`

- [ ] **Step 1: Import and use `cleanupSyncListeners` in reconnect**

Replace the content of `service-reconnect.ts`:

```typescript
import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';
import { type LifecycleState, lifecycleConnect } from './service-lifecycle.js';
import { cleanupSyncListeners } from './service-sync.js';
import { stopWatchdog } from './service-watchdog.js';

export async function lifecycleReconnect(
  state: LifecycleState,
  setStatus: (s: MessagingConnectionStatus) => void,
  emit: (event: string, ...args: unknown[]) => void,
): Promise<void> {
  state.manualDisconnect = false;
  stopWatchdog(state);
  cleanupSyncListeners(state);
  if (state.socket) {
    state.socket.ev.removeAllListeners('creds.update');
    state.socket.ev.removeAllListeners('connection.update');
    state.socket.ev.removeAllListeners('messages.upsert');
    state.socket.end(new Error('Reconnecting'));
    state.socket = null;
  }
  state.qrCode = null;
  state.qrIssuedAt = null;
  state.syncState = 'idle';
  state.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
  setStatus('disconnected');
  await lifecycleConnect(state, setStatus, emit);
}
```

Key changes:
- Import and call `cleanupSyncListeners` instead of manual `removeAllListeners('messaging-history.set')` and `removeAllListeners('messages.upsert')`
- Removed the duplicate `removeAllListeners('messages.upsert')` (was there twice in original)
- Removed `state.socket.ev.removeAllListeners('messaging-history.set')` since `cleanupSyncListeners` handles it

- [ ] **Step 2: Commit**

```bash
git add apps/daemon/src/whatsapp/service-reconnect.ts
git commit -m "refactor: use cleanupSyncListeners in WhatsApp reconnect"
```

---

### Task 9: Add unit tests for sync fix

**Files:**
- Create: `apps/daemon/__tests__/unit/whatsapp/whatsapp-sync.test.ts`

- [ ] **Step 1: Write tests for `syncAttachListeners` and `cleanupSyncListeners`**

Create `apps/daemon/__tests__/unit/whatsapp/whatsapp-sync.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupSyncListeners, syncAttachListeners } from '../../../src/whatsapp/service-sync.js';
import type { LifecycleState } from '../../../src/whatsapp/service-lifecycle.js';
import { createReconnectState } from '../../../src/whatsapp/reconnection.js';

function createMockSocket() {
  const handlers = new Map<string, Set<(data: unknown) => void>>();
  return {
    ev: {
      on(event: string, handler: (data: unknown) => void) {
        if (!handlers.has(event)) handlers.set(event, new Set());
        handlers.get(event)!.add(handler);
      },
      removeAllListeners(event: string) {
        handlers.delete(event);
      },
    },
    emit(event: string, data: unknown) {
      handlers.get(event)?.forEach((h) => h(data));
    },
  };
}

function createMockEmit() {
  return vi.fn();
}

function createState(socket: ReturnType<typeof createMockSocket>): LifecycleState {
  return {
    socket: socket as unknown as LifecycleState['socket'],
    store: null,
    status: 'connected',
    reconnect: createReconnectState(),
    disposed: false,
    manualDisconnect: false,
    qrCode: null,
    qrIssuedAt: null,
    sentMessageIds: { has: vi.fn(), add: vi.fn(), remove: vi.fn() } as any,
    phoneNumber: null,
    authStatePath: '/tmp/test-auth',
    storePath: '/tmp/test-store.json',
    lastTransportActivity: Date.now(),
    watchdogTimer: null,
    syncState: 'idle',
    syncProgress: { chatsProcessed: 0, messagesProcessed: 0 },
  };
}

describe('syncAttachListeners', () => {
  it('sets syncState to syncing and emits initial progress', () => {
    const socket = createMockSocket();
    const state = createState(socket);
    const emit = createMockEmit();

    syncAttachListeners(state, emit);

    expect(state.syncState).toBe('syncing');
    expect(state.syncProgress).toEqual({ chatsProcessed: 0, messagesProcessed: 0 });
    expect(emit).toHaveBeenCalledWith('syncProgress', {
      chatsProcessed: 0,
      messagesProcessed: 0,
      syncState: 'syncing',
    });
  });

  it('completes sync on isLatest=true from messaging-history.set', () => {
    const socket = createMockSocket();
    const state = createState(socket);
    const emit = createMockEmit();

    syncAttachListeners(state, emit);
    emit.mockClear();

    socket.emit('messaging-history.set', {
      chats: [{ id: 'chat1', name: 'A', conversationTimestamp: 1000 }],
      messages: [
        {
          key: { remoteJid: 'chat1', fromMe: false, id: 'm1' },
          message: { conversation: 'hi' },
          messageTimestamp: 1000,
        },
      ],
      isLatest: true,
    });

    expect(state.syncState).toBe('complete');
    expect(emit).toHaveBeenCalledWith('syncProgress', expect.objectContaining({ syncState: 'complete' }));
  });

  it('updates progress but does not complete on isLatest=false', () => {
    const socket = createMockSocket();
    const state = createState(socket);
    const emit = createMockEmit();

    syncAttachListeners(state, emit);
    emit.mockClear();

    socket.emit('messaging-history.set', {
      chats: [{ id: 'chat1', name: 'A', conversationTimestamp: 1000 }],
      messages: [],
      isLatest: false,
    });

    expect(state.syncState).toBe('syncing');
    expect(emit).toHaveBeenCalledWith('syncProgress', expect.objectContaining({ syncState: 'syncing' }));
  });

  it('updates progress on messages.upsert', () => {
    const socket = createMockSocket();
    const state = createState(socket);
    const emit = createMockEmit();

    syncAttachListeners(state, emit);
    emit.mockClear();

    socket.emit('messages.upsert', {
      messages: [
        {
          key: { remoteJid: 'chat1', fromMe: false, id: 'm1' },
          message: { conversation: 'hello' },
          messageTimestamp: 1000,
        },
      ],
    });

    expect(emit).toHaveBeenCalledWith('syncProgress', expect.objectContaining({ chatsProcessed: 0 }));
  });

  it('does not use persisted store data to premature-complete sync', () => {
    const socket = createMockSocket();
    const state = createState(socket);
    state.store = {
      chats: { all: () => [{ id: 'c1' }] } as any,
      messages: { c1: { all: () => [{ key: { id: 'm1' } }] } } as any,
    } as any;
    const emit = createMockEmit();

    syncAttachListeners(state, emit);

    expect(state.syncState).toBe('syncing');
    expect(state.syncProgress.chatsProcessed).toBe(0);
    expect(state.syncProgress.messagesProcessed).toBe(0);
  });

  it('touches transport activity on each sync event', () => {
    const socket = createMockSocket();
    const state = createState(socket);
    state.lastTransportActivity = 0;
    const emit = createMockEmit();
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    syncAttachListeners(state, emit);

    socket.emit('messaging-history.set', { chats: [], messages: [], isLatest: false });
    expect(state.lastTransportActivity).toBe(now);

    vi.spyOn(Date, 'now').mockReturnValue(now + 1000);
    socket.emit('messages.upsert', { messages: [] });
    expect(state.lastTransportActivity).toBe(now + 1000);

    vi.restoreAllMocks();
  });

  it('cleans up listeners on complete via isLatest', () => {
    const socket = createMockSocket();
    const state = createState(socket);
    const emit = createMockEmit();

    syncAttachListeners(state, emit);

    expect(state.syncState).toBe('syncing');

    socket.emit('messaging-history.set', { chats: [], messages: [], isLatest: true });
    expect(state.syncState).toBe('complete');

    emit.mockClear();
    socket.emit('messaging-history.set', { chats: [], messages: [], isLatest: false });
    expect(emit).not.toHaveBeenCalled();
  });
});

describe('cleanupSyncListeners', () => {
  it('removes sync event listeners', () => {
    const socket = createMockSocket();
    const state = createState(socket);
    const emit = createMockEmit();

    syncAttachListeners(state, emit);
    expect(state.syncState).toBe('syncing');

    cleanupSyncListeners(state);

    emit.mockClear();
    socket.emit('messaging-history.set', { chats: [], messages: [], isLatest: true });
    expect(emit).not.toHaveBeenCalled();
  });

  it('does nothing when socket is null', () => {
    const state = createState(createMockSocket());
    state.socket = null;
    expect(() => cleanupSyncListeners(state)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests and verify they pass**

Run: `pnpm -F @myboteam/daemon test -- whatsapp-sync`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/daemon/__tests__/unit/whatsapp/whatsapp-sync.test.ts
git commit -m "test: add unit tests for WhatsApp sync listener logic"
```

---

### Task 10: Add tests for watchdog sync-skipping

**Files:**
- Create: `apps/daemon/__tests__/unit/whatsapp/whatsapp-watchdog.test.ts`

- [ ] **Step 1: Write watchdog tests**

Create `apps/daemon/__tests__/unit/whatsapp/whatsapp-watchdog.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startWatchdog, stopWatchdog } from '../../../src/whatsapp/service-watchdog.js';
import type { LifecycleState } from '../../../src/whatsapp/service-lifecycle.js';
import { createReconnectState } from '../../../src/whatsapp/reconnection.js';

function createState(): LifecycleState {
  return {
    socket: {} as any,
    store: null,
    status: 'connected',
    reconnect: createReconnectState(),
    disposed: false,
    manualDisconnect: false,
    qrCode: null,
    qrIssuedAt: null,
    sentMessageIds: { has: vi.fn(), add: vi.fn(), remove: vi.fn() } as any,
    phoneNumber: null,
    authStatePath: '/tmp/test-auth',
    storePath: '/tmp/test-store.json',
    lastTransportActivity: Date.now(),
    watchdogTimer: null,
    syncState: 'idle',
    syncProgress: { chatsProcessed: 0, messagesProcessed: 0 },
  };
}

describe('startWatchdog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not disconnect when transport activity is recent', () => {
    const state = createState();
    const setStatus = vi.fn();

    startWatchdog(state, setStatus);

    vi.advanceTimersByTime(60_000);
    expect(setStatus).not.toHaveBeenCalled();

    stopWatchdog(state);
  });

  it('disconnects after 5 minutes of no transport activity', () => {
    const state = createState();
    state.lastTransportActivity = Date.now() - 300_001;
    const setStatus = vi.fn();

    startWatchdog(state, setStatus);

    vi.advanceTimersByTime(60_000);
    expect(setStatus).toHaveBeenCalledWith('disconnected');

    stopWatchdog(state);
  });

  it('does not disconnect during sync even with stale transport', () => {
    const state = createState();
    state.syncState = 'syncing';
    state.lastTransportActivity = Date.now() - 300_001;
    const setStatus = vi.fn();

    startWatchdog(state, setStatus);

    vi.advanceTimersByTime(60_000);
    expect(setStatus).not.toHaveBeenCalled();

    stopWatchdog(state);
  });

  it('resumes disconnection checks after sync completes', () => {
    const state = createState();
    state.lastTransportActivity = Date.now() - 300_001;
    const setStatus = vi.fn();

    startWatchdog(state, setStatus);

    state.syncState = 'syncing';
    vi.advanceTimersByTime(60_000);
    expect(setStatus).not.toHaveBeenCalled();

    state.syncState = 'complete';
    vi.advanceTimersByTime(60_000);
    expect(setStatus).toHaveBeenCalledWith('disconnected');

    stopWatchdog(state);
  });
});

describe('stopWatchdog', () => {
  it('clears the watchdog timer', () => {
    const state = createState();
    vi.useFakeTimers();
    const setStatus = vi.fn();

    startWatchdog(state, setStatus);
    expect(state.watchdogTimer).not.toBeNull();

    stopWatchdog(state);
    expect(state.watchdogTimer).toBeNull();

    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run tests and verify they pass**

Run: `pnpm -F @myboteam/daemon test -- whatsapp-watchdog`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/daemon/__tests__/unit/whatsapp/whatsapp-watchdog.test.ts
git commit -m "test: add watchdog unit tests for sync-skipping and timeout"
```

---

### Task 11: Run full validation

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 2: Run lint check**

Run: `pnpm check`
Expected: No errors

- [ ] **Step 3: Run daemon tests**

Run: `pnpm -F @myboteam/daemon test`
Expected: All tests pass

- [ ] **Step 4: Run web tests**

Run: `pnpm -F @myboteam/web test`
Expected: All tests pass

- [ ] **Step 5: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address validation issues"
```
---

### Task 12: Fix CI — `tsc` not found for `@myboteam/whatsapp-mcp`

**Problem:** E2E Tests (Docker) and Windows CI both fail with `tsc: not found` when building `@myboteam/whatsapp-mcp`. The package has `typescript` in devDependencies but pnpm isn't installing it properly in the workspace.

**Files:**
- Modify: `packages/mcp-servers/whatsapp/package.json`

- [ ] **Step 1: Add explicit typescript dependency resolution**

The `typescript` dependency is listed at `^6.0.2` which may not resolve in Docker/Windows CI. Check if there's a pnpm workspace setting that's preventing hoisting, or if the root `package.json` needs a matching version. The simplest fix is changing the version to match the root workspace's typescript version.

Check the root workspace typescript version:
```bash
cat package.json | grep typescript
```

Then update `packages/mcp-servers/whatsapp/package.json` to use the same version range as the root monorepo.

- [ ] **Step 2: Verify the Docker build script installs dependencies correctly**

Check `apps/desktop/e2e/docker/run-e2e.sh` to see if it runs `pnpm install` before `pnpm build`. The `tsc` binary needs to be available via `node_modules/.bin/tsc` in the workspace.

- [ ] **Step 3: Push and verify CI passes**

Push the change and verify E2E Tests and Windows CI pass.

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-servers/whatsapp/package.json
git commit -m "fix: align typescript version for whatsapp-mcp CI build"
```

---

### Task 13: MCP tool handlers — add try/catch and validation fixes

**Review items:** Multiple MCP tool handlers lack try/catch around `callApi`, poll options aren't validated as strings, `get-messages` has braceless if and redundant `?? undefined`, `api-client.ts` doesn't include response body in error messages, `api-client.test.ts` doesn't use try/finally for env cleanup.

**Files:**
- Modify: `packages/mcp-servers/whatsapp/src/tools/send.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/send-reaction.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/send-poll.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/send-typing.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/list-groups.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/list-chats.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/get-group-info.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/download-media.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/mark-read.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/get-status.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/logout.ts`
- Modify: `packages/mcp-servers/whatsapp/src/tools/get-messages.ts`
- Modify: `packages/mcp-servers/whatsapp/src/api-client.ts`
- Modify: `packages/mcp-servers/whatsapp/src/api-client.test.ts`

- [ ] **Step 1: Fix `api-client.ts` — include response body in error**

```typescript
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WhatsApp API returned ${response.status}: ${text}`);
  }
```

- [ ] **Step 2: Fix `api-client.test.ts` — try/finally for env cleanup**

Change the env var test:
```typescript
  it('throws when MYBOTEAM_WHATSAPP_API_PORT is not set', async () => {
    const oldPort = process.env.MYBOTEAM_WHATSAPP_API_PORT;
    try {
      delete process.env.MYBOTEAM_WHATSAPP_API_PORT;
      const { callApi } = await import('./api-client.js');
      await expect(callApi('/test', {})).rejects.toThrow('MYBOTEAM_WHATSAPP_API_PORT');
    } finally {
      if (oldPort) process.env.MYBOTEAM_WHATSAPP_API_PORT = oldPort;
    }
  });
```

- [ ] **Step 3: Add try/catch to each MCP tool handler**

For each tool handler (`sendToolHandler`, `sendReactionToolHandler`, `sendPollToolHandler`, `sendTypingToolHandler`, `listGroupsToolHandler`, `listChatsToolHandler`, `getGroupInfoToolHandler`, `downloadMediaToolHandler`, `markReadToolHandler`, `getStatusToolHandler`, `logoutToolHandler`, `getMessagesToolHandler`), wrap the `callApi` call in try/catch:

```typescript
  try {
    const result = await callApi('/path', { ... });
    // ... existing result handling
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: message }], isError: true };
  }
```

Note: The `send` tool already has a try/catch for connection loss. Restructure it to also catch `callApi` errors.

- [ ] **Step 4: Fix `send-poll.ts` — validate options are strings**

Add after the `Array.isArray(options)` check:
```typescript
  if (!options.every((opt): opt is string => typeof opt === 'string'))
    return {
      content: [{ type: 'text', text: 'Error: all poll options must be non-empty strings' }],
      isError: true,
    };
```

Remove the `as string[]` cast on the `svc.sendPoll` call.

- [ ] **Step 5: Fix `whatsapp-api-routes-send.ts` — validate poll options are strings**

Add after the `options.length < 2` check in `buildSendPollRoute`:
```typescript
      if (!options.every((opt): opt is string => typeof opt === 'string' && opt.trim()))
        return sendJson(res, {
          success: false,
          error: 'invalid_options',
          message: 'All poll options must be non-empty strings.',
        });
```

Remove the `as string[]` cast on `svc.sendPoll`.

- [ ] **Step 6: Fix `get-messages.ts` — braces for if, remove `?? undefined`, defensive nulls**

```typescript
  if (!jid) {
    return { content: [{ type: 'text', text: 'Error: jid is required' }], isError: true };
  }

  const result = await callApi('/messages', { jid, limit: args.limit });
  // ... rest unchanged, but fix message formatting:
  const sender = m.fromMe ? 'me' : (m.senderJid ?? 'unknown');
  const text = m.text ?? '(no text)';
  return `[${ts}] ${sender}: ${text}`;
```

- [ ] **Step 7: Remove redundant `?? undefined` from `list-chats.ts` and `list-groups.ts`**

In `list-chats.ts`:
```typescript
  const result = await callApi('/chats', { limit: args.limit });
```

In `list-groups.ts`:
```typescript
  const result = await callApi('/groups', { limit: args.limit });
```

- [ ] **Step 8: Run MCP server tests**

Run: `pnpm -F @myboteam/whatsapp-mcp test`
Expected: All tests pass

- [ ] **Step 9: Commit**

```bash
git add packages/mcp-servers/whatsapp/src/ apps/daemon/src/whatsapp/whatsapp-api-routes-send.ts
git commit -m "fix: add try/catch, validation, and error handling to MCP tool handlers"
```

---

### Task 14: Fix `config-generator.ts` — warn when WhatsApp MCP dist missing

**Files:**
- Modify: `packages/agent-core/src/opencode/config-generator.ts`

- [ ] **Step 1: Add log.warn when whatsappMcpPath exists but dist/index.js is missing**

After the `hasWhatsApp` check (around line 131-135), add:

```typescript
  if (whatsappMcpPath && !fs.existsSync(path.join(whatsappMcpPath, 'dist', 'index.js'))) {
    log.warn(`[WhatsApp MCP] dist/index.js not found at ${whatsappMcpPath}. Run: pnpm -F @myboteam/whatsapp-mcp build`);
  }
```

Check if `log` is already imported in the file. If not, add the import.

- [ ] **Step 2: Commit**

```bash
git add packages/agent-core/src/opencode/config-generator.ts
git commit -m "fix: warn when WhatsApp MCP dist is missing"
```

---

### Task 15: Fix `toNumber` in `whatsapp-store-persistence.ts`

**Files:**
- Modify: `apps/daemon/src/whatsapp/whatsapp-store-persistence.ts`

- [ ] **Step 1: Simplify `toNumber` type guard**

Replace lines 30-34:

```typescript
export function toNumber(val: unknown): number | null | undefined {
  if (typeof val === 'number') return val;
  if (val != null && typeof val === 'object' && 'toNumber' in val && typeof val.toNumber === 'function') {
    return val.toNumber();
  }
  return val as number | null | undefined;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/daemon/src/whatsapp/whatsapp-store-persistence.ts
git commit -m "fix: simplify toNumber type guard in whatsapp store persistence"
```

---

### Task 16: Run full validation after all review fixes

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 2: Run biome check**

Run: `pnpm check`
Expected: No errors (note: existing rule overrides for `__tests__` dirs should allow the test files)

- [ ] **Step 3: Run all tests**

Run: `pnpm -F @myboteam/daemon test && pnpm -F @myboteam/web test && pnpm -F @myboteam/whatsapp-mcp test`
Expected: All tests pass

- [ ] **Step 4: Commit any necessary fixes**
