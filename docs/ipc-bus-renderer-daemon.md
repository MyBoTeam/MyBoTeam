# IPC Bus Renderer Daemon

## Overview

The IPC Bus Renderer Daemon provides inter-process communication between the Electron renderer process and a background daemon process. It establishes a 4-link chain: React → preload → main → daemon, using JSON-RPC 2.0 over Unix sockets.

## Architecture

```
React (Renderer) → contextBridge (Preload) → ipcMain.handle (Main) → Unix Socket → Daemon
```

### Components

- **Preload Bridge** (`apps/desktop/src/preload/`): Exposes typed API to renderer via `contextBridge.exposeInMainWorld()`
- **Main Process Bridge** (`apps/desktop/src/main/ipc-bridge.ts`): Routes IPC calls between preload and daemon
- **IPC Bus Server** (`apps/daemon/src/ipc/ipc-bus-server.ts`): Listens on Unix socket for daemon connections
- **IPC Bus Client** (`apps/daemon/src/ipc/ipc-bus-client.ts`): Connects to daemon via Unix socket
- **Daemon** (`apps/daemon/src/index.ts`): Long-running process managing rendering requests and plugins

## API

### Rendering

```typescript
// Send a rendering request
const result = await window.myboteam.render.process({
  content: 'document content',
  format: 'pdf',
  options: { pageSize: 'A4' },
});
```

### Plugin Management

```typescript
// List available plugins
const plugins = await window.myboteam.plugins.list();

// Get plugin health status
const health = await window.myboteam.plugins.health();
```

### Daemon Lifecycle

```typescript
// Check daemon status
const status = await window.myboteam.daemon.status();

// Initiate graceful shutdown
await window.myboteam.daemon.shutdown({ timeoutMs: 5000 });
```

## Configuration

### Socket Path

Default: `~/.myboteam/daemon.sock` (Unix) or `\\.\pipe\myboteam-daemon-{hash}` (Windows)

Override via `IpcBusClientOptions.socketPath`.

### Request Size Limit

Maximum message size: 1 MiB (1,048,576 bytes). Oversized requests are rejected with an error.

## Testing

### Contract Tests

```bash
npx vitest run apps/daemon/tests/contract/
```

### Integration Tests

```bash
npx vitest run apps/daemon/tests/integration/
```

### Performance Tests

```bash
npx vitest run apps/daemon/tests/performance/
```

## Source Reference

This implementation follows patterns from v0.3.0:
- JSON-RPC 2.0 over Unix sockets (line-delimited JSON)
- `DaemonTransport` interface (`send()`, `onMessage()`, `close()`)
- `contextBridge.exposeInMainWorld()` for typed API exposure
- `ipcMain.handle()` / `ipcRenderer.invoke()` for Electron IPC bridge
- Reconnection with exponential backoff (200ms initial, 2x backoff, 5s max)
- PID lock file with stale detection
- `safeHandler()` wrapper for error sanitization
