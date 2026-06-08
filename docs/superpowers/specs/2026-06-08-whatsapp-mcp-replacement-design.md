# Replace WhatsApp Integration with OpenClaw WhatsApp Engine

**Date:** 2026-06-08
**Issue:** [MAO-119](https://linear.app/maor-innovations-ltd/issue/MAO-119/whatsapp-fix)
**Status:** Draft

## Motivation

The current WhatsApp integration has limited functionality — only 3 MCP tools (Send, List Chats, Get Messages) with a basic Baileys wrapper that lacks proper connection management, auth persistence, and advanced features like reactions, polls, media handling, and typing indicators. OpenClaw's WhatsApp extension is a battle-tested implementation with 86 tests, full connection lifecycle, and comprehensive WhatsApp protocol coverage. We copy its source into myboteam to get all capabilities.

## Scope

- Replace the daemon's WhatsApp backend with code copied from OpenClaw's `extensions/whatsapp/src/`
- Create a new MCP server package at `packages/mcp-servers/whatsapp` with 12 tools
- Extend the daemon's internal HTTP API from 3 to 12 endpoints
- Keep the existing Settings UI (QR code scan, connect/disconnect) — only backend changes
- Keep the existing TaskBridge (incoming messages -> tasks) — adapt to new inbound pipeline
- Full test coverage matching or exceeding current tests
- Remove existing Baileys dependency (Baileys comes through openclaw copied code)

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│ Daemon Process                                                │
│                                                               │
│  ┌──────────────────────┐   ┌────────────────────────────┐   │
│  │ WhatsAppDaemonService │   │ WhatsAppApi (HTTP server)  │   │
│  │ (openclaw source)     │◄──┤ POST /send, /chats, ...    │   │
│  │  ┌─────────────────┐  │   │ /send-reaction, /polls,   │   │
│  │  │ ConnectionCtrl   │  │   │ /groups, /media, /status, │   │
│  │  │ AuthStore        │  │   │ /logout, /mark-read       │   │
│  │  │ SendService      │  │   └───────────┬──────────────┘   │
│  │  │ InboundMonitor   │  │               │                   │
│  │  └─────────────────┘  │               │                   │
│  └──────────────────────┘               │                   │
│         │                                │                   │
│         ▼                                ▼                   │
│  ┌──────────────┐         ┌──────────────────────────┐      │
│  │ TaskBridge    │         │ MCP: whatsapp (stdio)    │      │
│  │ (msg → task)  │         │ packages/mcp-servers/    │      │
│  └──────────────┘         │ whatsapp/                 │      │
│                           └──────────────────────────┘      │
│                                      │                       │
└──────────────────────────────────────┼───────────────────────┘
         │ IPC (JSON-RPC)              │ MCP stdio
         ▼                              ▼
┌──────────────────┐     ┌──────────────────────────┐
│ Desktop (Elect)  │     │ opencode serve (per-task) │
│ └─ Web UI        │     │                          │
└──────────────────┘     └──────────────────────────┘
```

### Communication Flow

1. **Web UI ↔ Daemon**: Via Electron IPC → JSON-RPC (no change). QR code, status, connect/disconnect handled same as today.
2. **MCP Server ↔ Daemon**: Stdio from `opencode serve` → stdio to MCP server → HTTP to daemon's WhatsAppApi. Same pattern as today, extended to 12 endpoints.
3. **WhatsApp Inbound → Task**: OpenClaw's inbound monitor pipes to existing TaskBridge.

## Daemon Backend: OpenClaw Source Integration

### Files Copied from OpenClaw

The following files from OpenClaw's `extensions/whatsapp/src/` are copied into `apps/daemon/src/whatsapp/`:

#### Connection & Auth (replaces current WhatsAppService.ts)
| File | Purpose |
|------|---------|
| `session.ts` | Baileys socket creation via `createWaSocket()` |
| `session.runtime.ts` | Re-exports: DisconnectReason, makeWASocket, useMultiFileAuthState |
| `session-errors.ts` | Error code extraction from Baileys |
| `auth-store.ts` | Auth state management: read, write, logout, age detection |
| `auth-store.runtime.ts` | Auth directory resolution |
| `creds-files.ts` | Credential file I/O |
| `creds-persistence.ts` | Atomic creds save with queue |
| `login.ts` | Full login flow: socket creation, QR generation, post-pairing restart |
| `login-qr.ts` | QR login API: startWebLoginWithQr, waitForWebLogin |
| `connection-controller.ts` | Full connection lifecycle: open/close, reconnect, watchdog timers, heartbeat |
| `connection-controller-registry.ts` | Registry mapping accountId to connection handle |
| `reconnect.ts` | Reconnect policy with exponential backoff |
| `heartbeat.ts` | Connection health checks |
| `socket-timing.ts` | Socket timing configuration |
| `auth-presence.ts` | Auth presence detection |
| `identity.ts` | WhatsAppIdentity, WhatsAppSelfIdentity types |

#### Sending (extends current sendMessage)
| File | Purpose |
|------|---------|
| `send.ts` | sendMessageWhatsApp, sendTypingWhatsApp, sendReactionWhatsApp, sendPollWhatsApp |
| `outbound-base.ts` | Text chunking (4K chars), quoting, payload normalization |
| `outbound-media-contract.ts` | Outbound media preparation |
| `outbound-media.runtime.ts` | Media loading from URL |
| `outbound-send-deps.ts` | Send dependency keys |
| `media.ts` | Media loading with optimization |
| `normalize.ts` | JID normalization |
| `normalize-target.ts` | Target normalization (phone → JID) |
| `quoted-message.ts` | Quoted message caching |
| `document-filename.ts` | Document filename resolution |
| `text-runtime.ts` | Markdown conversion, E164 conversion |

#### Inbound (for TaskBridge integration)
| File | Purpose |
|------|---------|
| `inbound/monitor.ts` | Inbound message pipeline: dedup, debounce, media download, reply context |
| `inbound/extract.ts` | Extract text, media placeholder, location, contact context |
| `inbound/dedupe.ts` | In-memory message deduplication |
| `inbound/media.ts` | Download media from inbound messages |
| `inbound/types.ts` | ActiveWebListener, WebInboundMessage types |
| `inbound/send-api.ts` | Outbound send API for replies |
| `inbound/lifecycle.ts` | Socket lifecycle utilities |
| `inbound/access-control.ts` | Inbound access control (allow/pairing) |

### Files Adapted (not copied directly)

The following files are rewritten to integrate openclaw code into the daemon's architecture:

- `apps/daemon/src/whatsapp-service.ts` (`WhatsAppDaemonService`) — Rewritten to use openclaw's `ConnectionController`, `AuthStore`, `sendMessageWhatsApp()`, etc. instead of the current `WhatsAppService`.
- `apps/daemon/src/whatsapp/WhatsAppService.ts` — DELETED (replaced by openclaw code)
- `apps/daemon/src/whatsapp/whatsapp-service-init.ts` — DELETED (replaced by openclaw session.ts)
- `apps/daemon/src/whatsapp/whatsapp-session.ts` — DELETED (replaced by openclaw connection-controller.ts)
- `apps/daemon/src/whatsapp/whatsapp-store.ts` — DELETED. OpenClaw's inbound pipeline has its own dedup + journaling. The chat/message store for MCP tools is served from the in-memory Baileys store.
- `apps/daemon/src/whatsapp/whatsapp-store-persistence.ts` — DELETED.
- `apps/daemon/src/whatsapp/normalizeMessage.ts` — DELETED (replaced by openclaw inbound/extract.ts)
- `apps/daemon/src/whatsapp/baileys-types.ts` — DELETED (types come from openclaw or @whiskeysockets/baileys directly)
- `apps/daemon/src/whatsapp/reconnection.ts` — DELETED (replaced by openclaw reconnect.ts)
- `apps/daemon/src/whatsapp/authCleanup.ts` — DELETED (replaced by openclaw auth-store.ts logout function)
- `apps/daemon/src/whatsapp/whatsapp-types.ts` — REWRITTEN (types adapted from openclaw)
- `apps/daemon/src/whatsapp/taskBridge.ts` — KEPT (same task bridge pattern, adapted to openclaw message format)
- `apps/daemon/src/whatsapp/wireTaskBridge.ts` — KEPT (same wiring pattern, adapted to openclaw inbound pipeline)

## HTTP API (WhatsAppApi)

Extends the current `WhatsAppSendApi` from 3 to 12 endpoints. All use the same `http-server-factory.ts` pattern (Route, auth middleware, rate limiting).

| Endpoint | Method | Params | Response | Description |
|----------|--------|--------|----------|-------------|
| `/send` | POST | `{ recipient, message, media?, replyToId? }` | `{ success, error? }` | Send text + optional media (image/audio/video/document) |
| `/send-reaction` | POST | `{ chatJid, messageId, emoji }` | `{ success, error? }` | React to a message |
| `/send-poll` | POST | `{ recipient, question, options[], maxAnswers? }` | `{ success, error? }` | Send a poll (2-12 options) |
| `/send-typing` | POST | `{ recipient, action }` | `{ success, error? }` | Show typing/composing indicator |
| `/chats` | POST | `{ limit? }` | `{ success, chats[] }` | List recent conversations |
| `/messages` | POST | `{ jid, limit? }` | `{ success, messages[] }` | Get messages from a chat |
| `/groups` | POST | `{ limit? }` | `{ success, groups[] }` | List group chats with metadata |
| `/group-info` | POST | `{ groupJid }` | `{ success, group }` | Get group participants & settings |
| `/download-media` | POST | `{ chatJid, messageId }` | `{ success, filePath?, mime? }` | Download media from a message |
| `/mark-read` | POST | `{ chatJid, messageIds[] }` | `{ success }` | Mark messages as read |
| `/status` | POST | `{}` | `{ success, connected, phoneNumber?, jid? }` | Get connection status |
| `/logout` | POST | `{}` | `{ success }` | Disconnect + clear auth |

### Route Handler Pattern

Each route handler follows the existing pattern from `whatsapp-routes.ts`:

```typescript
export function buildSendReactionRoute(svc: WhatsAppDaemonService): Route {
  return {
    method: 'POST',
    path: '/send-reaction',
    handler: async (data, _req, res) => {
      const { chatJid, messageId, emoji } = data as { ... };
      validateInputs(chatJid, messageId, emoji);
      checkConnection(svc);
      try {
        await svc.sendReaction(chatJid, messageId, emoji);
        sendJson(res, { success: true });
      } catch (err) {
        handleError(res, err);
      }
    },
  };
}
```

Connection-loss detection and auto-reconnect trigger follows the existing pattern.

## MCP Server (`packages/mcp-servers/whatsapp`)

New package exposing all WhatsApp capabilities as MCP tools.

### Package Structure

```
packages/mcp-servers/whatsapp/
├── package.json
│   name: "@myboteam/whatsapp-mcp"
│   type: "module"
│   deps: @modelcontextprotocol/sdk
│   scripts:
│     build: tsc
│     test: vitest run
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts              # Server setup, ListTools + CallTool handlers
│   ├── api-client.ts         # HTTP client: callApi(endpoint, body) → response
│   ├── types.ts              # Input/output types, tool definitions array
│   └── tools/
│       ├── send.ts           # SendWhatsAppMessage tool
│       ├── send-reaction.ts  # SendWhatsAppReaction tool
│       ├── send-poll.ts      # SendWhatsAppPoll tool
│       ├── send-typing.ts    # SendWhatsAppTyping tool
│       ├── list-chats.ts     # ListWhatsAppChats tool
│       ├── get-messages.ts   # GetWhatsAppMessages tool
│       ├── list-groups.ts    # ListWhatsAppGroups tool
│       ├── get-group-info.ts # GetWhatsAppGroupInfo tool
│       ├── download-media.ts # DownloadWhatsAppMedia tool
│       ├── mark-read.ts      # MarkWhatsAppRead tool
│       ├── get-status.ts     # GetWhatsAppStatus tool
│       └── logout.ts         # LogoutWhatsApp tool
│   └── __tests__/
│       ├── send.test.ts
│       ├── send-reaction.test.ts
│       ├── list-chats.test.ts
│       ├── get-messages.test.ts
│       ├── api-client.test.ts
│       └── ...
```

### Tool Definitions

Each tool definition follows the MCP SDK pattern:

```typescript
// tools/send.ts
import { z } from 'zod';

export const SendWhatsAppMessageSchema = {
  name: 'SendWhatsAppMessage',
  description: 'Send a WhatsApp message to a contact. Supports text, images, audio, video, and documents.',
  inputSchema: {
    type: 'object',
    properties: {
      recipient: {
        type: 'string',
        description: 'Phone number in international format (e.g. +15551234567)',
      },
      message: {
        type: 'string',
        description: 'Text message to send.',
      },
      mediaPath: {
        type: 'string',
        description: 'Optional path to a media file (image, audio, video, or document).',
      },
      mediaType: {
        type: 'string',
        enum: ['image', 'audio', 'video', 'document'],
        description: 'Type of media (required if mediaPath is provided).',
      },
      replyToId: {
        type: 'string',
        description: 'Optional message ID to reply to (quote).',
      },
    },
    required: ['recipient', 'message'],
  },
};
```

### API Client

Simple HTTP client shared by all tools:

```typescript
export interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  chats?: ChatSummary[];
  messages?: MessageSummary[];
  groups?: GroupSummary[];
  // ...
}

export async function callApi(path: string, body: Record<string, unknown>): Promise<ApiResponse> {
  const port = process.env.MYBOTEAM_WHATSAPP_API_PORT;
  const token = process.env.MYBOTEAM_DAEMON_AUTH_TOKEN;
  const response = await fetch(`http://localhost:${port}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`WhatsApp API returned ${response.status}`);
  }
  return response.json() as Promise<ApiResponse>;
}
```

## MCP Config Generation

### Changes to `packages/agent-core/src/opencode/generator-mcp.ts`

Add a `whatsappMcpPath` option to `BuildMcpServersOptions` and register the whatsapp MCP server:

```typescript
export interface BuildMcpServersOptions {
  // ... existing fields
  whatsappMcpPath?: string;  // NEW: path to packages/mcp-servers/whatsapp
}

export function buildMcpServers(options: BuildMcpServersOptions): Record<string, McpServerConfig> {
  const { whatsappMcpPath, whatsappApiPort, ...rest } = options;
  const mcpServers = { /* existing servers */ };

  if (whatsappMcpPath && whatsappApiPort) {
    mcpServers.whatsapp = {
      type: 'local',
      command: [nodeExe, path.join(whatsappMcpPath, 'dist/index.mjs')],
      enabled: true,
      environment: {
        MYBOTEAM_WHATSAPP_API_PORT: String(whatsappApiPort),
        MYBOTEAM_DAEMON_AUTH_TOKEN: authToken ?? '',
      },
      timeout: MCP_TOOL_TIMEOUT_MS,
    };
  }

  return mcpServers;
}
```

### Changes to Config Generator Pipeline

- `packages/agent-core/src/opencode/config-generator-types.ts`: Add `whatsappMcpPath` to `ConfigGeneratorOptions`
- `packages/agent-core/src/opencode/resolve-task-config.ts`: Pass `whatsappMcpPath` through
- `apps/daemon/src/task-config-builder.ts`: Resolve path to `packages/mcp-servers/whatsapp` and pass it

## Daemon Integration

### Changes to `apps/daemon/src/app-setup.ts`

```typescript
// Replace current:
// const whatsappService = new WhatsAppDaemonService(storage, paths.userDataPath, taskService);

// New — same interface, implementation uses openclaw code:
const whatsappService = new WhatsAppDaemonService({
  storage,
  dataDir: paths.userDataPath,
  taskService,
});
```

### Changes to `apps/daemon/src/daemon-routes-whatsapp.ts`

- `whatsapp.getConfig` — Updated to reflect richer connection status from openclaw
- `whatsapp.connect` — Now uses openclaw's `loginWeb()` + `ConnectionController`
- `whatsapp.disconnect` — Now uses openclaw's `logoutWeb()` + connection close
- `whatsapp.setEnabled` — Same pattern, no change

### WhatsApp QR & Status Notifications

The existing notification forwarding pattern in `daemon-bootstrap-config.ts` stays:
- `whatsapp.qr` → forwarded to renderer via `integrations:whatsapp:qr`
- `whatsapp.status` → forwarded to renderer via `integrations:whatsapp:status`

The `WhatsAppDaemonService` still emits `qr` and `status` events that the desktop process forwards. The web UI components (`WhatsAppCard.tsx`, `useWhatsAppCard.ts`) work without changes.

## Changes to Web UI

No changes needed to the web UI. The existing `WhatsAppCard`, `QRCodeDisplay`, `useWhatsAppCard`, and `useWhatsAppSubscriptions` all work with the existing IPC interface (JSON-RPC to daemon). The daemon's `getConfig()` response shape is updated but the fields remain compatible.

## Changes to Desktop IPC

No changes needed. The existing handlers in `whatsapp-handlers.ts` and preload bindings in `integrations.ts` work with the daemon's JSON-RPC interface unchanged.

## Files to Delete

The following files are removed (replaced by openclaw code):

- `apps/daemon/src/whatsapp/WhatsAppService.ts`
- `apps/daemon/src/whatsapp/whatsapp-service-init.ts`
- `apps/daemon/src/whatsapp/whatsapp-session.ts`
- `apps/daemon/src/whatsapp/whatsapp-store.ts`
- `apps/daemon/src/whatsapp/whatsapp-store-persistence.ts`
- `apps/daemon/src/whatsapp/normalizeMessage.ts`
- `apps/daemon/src/whatsapp/baileys-types.ts`
- `apps/daemon/src/whatsapp/reconnection.ts`
- `apps/daemon/src/whatsapp/authCleanup.ts`

### Files to Keep

The following existing files are kept and adapted:

- `apps/daemon/src/whatsapp-service.ts` — Rewritten to use openclaw code
- `apps/daemon/src/whatsapp/wireTaskBridge.ts` — Adapted to openclaw message format
- `apps/daemon/src/whatsapp/wireTaskBridge-utils.ts` — Adapted
- `apps/daemon/src/whatsapp/taskBridge.ts` — Adapted
- `apps/daemon/src/whatsapp/taskBridge-types.ts` — Adapted
- `apps/daemon/src/whatsapp/task-bridge-rate-limit.ts` — Kept
- `apps/daemon/src/whatsapp/task-bridge-rate-limit.actions.ts` — Kept
- `apps/daemon/src/whatsapp/task-bridge-rate-limit.queries.ts` — Kept
- `apps/daemon/src/whatsapp/task-bridge-rate-limit.config.ts` — Kept
- `apps/daemon/src/whatsapp/whatsapp-send-api.ts` — Extended with new endpoints
- `apps/daemon/src/whatsapp/whatsapp-routes.ts` — Extended with new routes
- `apps/daemon/src/whatsapp/whatsapp-types.ts` — REWRITTEN with openclaw types
- `apps/daemon/src/whatsapp/index.ts` — Updated exports

## Task Bridge Adaptation

The existing `TaskBridge` listens for incoming messages and creates tasks. With openclaw's inbound pipeline, the message format changes to `WebInboundMessage` instead of the current `NormalizedMessage`. The `wireTaskBridge` function is adapted to:

1. Use openclaw's `monitorWebInbox()` to listen for messages
2. Map `WebInboundMessage` → `NormalizedMessage` for backward compatibility with `TaskBridge`
3. Keep rate limiting, watermark, and session tracking unchanged

## Dependency Changes

### Kept dependencies
- `apps/daemon`: `@whiskeysockets/baileys` — already present, still needed by openclaw source code
- `packages/mcp-servers/whatsapp`: `@modelcontextprotocol/sdk` — standard MCP SDK for all MCP tools

### Removed dependencies
- `apps/desktop`: `@whiskeysockets/baileys` — desktop doesn't use baileys directly; this was a stale dependency
- Remove `apps/daemon/src/whatsapp/baileys-types.ts` — type definitions now come from `@whiskeysockets/baileys` directly

## Testing Plan

### Daemon Tests (`apps/daemon/__tests__/unit/whatsapp/`)

The existing daemon WhatsApp tests need to be rewritten to test against the openclaw-backed service:

| Test File | What It Tests | Changes |
|-----------|---------------|---------|
| `whatsapp-service.test.ts` | WhatsAppDaemonService with mocked Baileys | Rewrite to mock ConnectionController instead of WhatsAppService |
| `whatsapp-store.test.ts` | In-memory store + persistence | DELETE (store removed) |
| `whatsapp-storage-sync.test.ts` | wireStatusListeners | Adapted to new event format |

New daemon tests:

| Test File | What It Tests |
|-----------|---------------|
| `whatsapp-api.test.ts` | All 12 HTTP endpoints: success, error, auth, connection states |
| `whatsapp-service-connection.test.ts` | Connection lifecycle: connect, disconnect, reconnect, auth |
| `whatsapp-service-send.test.ts` | sendMessage, sendReaction, sendPoll, sendTyping with mocked Baileys |
| `whatsapp-service-inbound.test.ts` | Inbound message processing → TaskBridge integration |

### MCP Server Tests (`packages/mcp-servers/whatsapp/src/__tests__/`)

| Test File | What It Tests |
|-----------|---------------|
| `api-client.test.ts` | HTTP client: builds correct requests, handles errors, auth |
| `send.test.ts` | Send tool: validates input, calls API, handles responses |
| `send-reaction.test.ts` | Reaction tool: validates input, calls API |
| `send-poll.test.ts` | Poll tool: validates options (2-12), calls API |
| `send-typing.test.ts` | Typing tool: validates action param |
| `list-chats.test.ts` | Chats tool: validates limit, formats output |
| `get-messages.test.ts` | Messages tool: validates jid + limit, formats output |
| `list-groups.test.ts` | Groups tool: validates limit, formats output |
| `get-group-info.test.ts` | Group info tool: validates jid |
| `download-media.test.ts` | Media tool: validates params, formats output |
| `mark-read.test.ts` | Mark read tool: validates params |
| `get-status.test.ts` | Status tool: formats output |
| `logout.test.ts` | Logout tool: calls API |
| `index.test.ts` | Full server: ListTools + CallTool routing, unknown tool error |

### OpenClaw Source Tests

The copied openclaw code is tested through the daemon integration tests. We do NOT copy openclaw's 86 test files — the test surface changes because the integration points are different (openclaw tests the channel plugin; we test the daemon service + MCP server). The openclaw code's behavior is validated through our integration tests.

### Test Verification

Run after implementation:
```bash
pnpm check
pnpm -F @myboteam/web test                    # UI tests (should pass unchanged)
pnpm -F @myboteam/desktop test                # IPC tests (should pass with adapted handlers)
pnpm -F @myboteam/agent-core test             # Config generation tests (updated)
pnpm -F apps/daemon test                      # Daemon tests (rewritten)
pnpm -F packages/mcp-servers/whatsapp test    # MCP server tests (new)
pnpm -F @myboteam/desktop test:e2e            # E2E tests
```

## Open Items

- The `packages/mcp-servers/*` glob needs to be added to `pnpm-workspace.yaml` (currently has `packages/*` which doesn't reach nested subdirs)
- The `packages/mcp-servers` directory needs a root `package.json` (private, workspaces-not-required — just for directory structure)
- Need to verify that `resolveMcpCommand` can resolve paths outside `mcpToolsPath` — may need a new `whatsappMcpPath` option
