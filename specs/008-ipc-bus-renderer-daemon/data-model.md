# Data Model: IPC Bus Renderer Daemon

## Entities

### Rendering Request
- **requestId**: string (unique identifier)
- **rendererType**: string (e.g., "pdf", "image", "markdown")
- **documentData**: binary | string (content to render)
- **options**: Record<string, any> (renderer-specific options)
- **timestamp**: number (creation time)
- **priority**: number (optional, for queue management)

**Validation Rules**:
- requestId MUST be unique per client session
- rendererType MUST be supported by loaded plugins
- documentData MUST NOT exceed 1MB (FR-008)

### Rendering Plugin
- **name**: string (unique identifier)
- **version**: string (semantic version)
- **supportedTypes**: string[] (renderer types this plugin handles)
- **capabilities**: Record<string, any> (optional feature flags)
- **instance**: (internal) plugin implementation

**Lifecycle**:
- REGISTERED → ACTIVE → ERROR → UNREGISTERED
- Plugin crashes should not affect daemon (FR-005)

### IPC Bus
- **protocol**: "jsonrpc-2.0"
- **transport**: Unix domain socket | Windows named pipe
- **maxMessageSize**: 1MB
- **framing**: NDJSON (newline-delimited JSON)

**Connections**:
- Multiple concurrent clients allowed (SC-003)
- Each connection has unique sessionId

### Daemon
- **status**: "starting" | "running" | "shutting-down" | "stopped"
- **uptime**: number (seconds since start)
- **loadedPlugins**: Rendering Plugin[]
- **activeConnections**: number
- **metrics**: MetricsSnapshot

**Lifecycle**:
- START → RUNNING → SHUTTING_DOWN → STOPPED
- Must shut down within 1 second of termination signal (SC-002)

### Preload Bridge (Electron)
- **contextBridge**: exposes typed API to renderer
- **ipcRenderer**: sends messages to main process
- **eventListeners**: Map<string, Function>

### Main Process Bridge (Electron)
- **ipcMain**: handles messages from renderer
- **daemonClient**: connects to daemon IPC bus
- **eventForwarder**: forwards daemon events to renderer

## Relationships

```
Rendering Request 1..* → Rendering Plugin (via rendererType)
Rendering Plugin 1..* → Daemon (loaded plugins)
Daemon 1..* → IPC Bus (listens on)
IPC Bus 1..* → Client Connection (multiple clients)
Preload Bridge → Main Process Bridge (via Electron IPC)
Main Process Bridge → IPC Bus (via daemon client)
```

## State Transitions

### Rendering Request Flow
1. Renderer creates request → Preload Bridge
2. Preload Bridge forwards → Main Process Bridge
3. Main Process Bridge sends → Daemon via IPC Bus
4. Daemon routes → appropriate Rendering Plugin
5. Plugin processes → returns result
6. Result flows back through chain → Renderer

### Event Forwarding Flow
1. Daemon generates event → IPC Bus
2. Main Process Bridge receives → forwards via Electron IPC
3. Preload Bridge receives → invokes registered listeners
4. Renderer receives event

## Constraints

- Renderer MUST NOT have direct access to Node.js APIs
- Renderer MUST NOT access filesystem directly
- All communication MUST go through preload→main→daemon chain
- Messages MUST NOT exceed 1MB
- Daemon MUST handle 100+ concurrent requests (SC-003)