# Research: IPC Bus Renderer Daemon

## Decisions

### IPC Protocol between Renderer and Daemon

**Decision**: JSON-RPC 2.0 over Unix domain socket (or Windows named pipe) for daemon IPC, with Electron IPC (ipcRenderer/ipcMain) for renderer↔main communication.

**Rationale**: 
- Daemon already uses JSON-RPC 2.0 (from v0.3.0 reference)
- Electron IPC is the standard secure bridge between renderer and main processes
- Maintains separation of concerns: renderer never directly accesses daemon

**Alternatives considered**:
- Direct WebSocket between renderer and daemon: Rejected due to security constraints (renderer zero Node.js/filesystem access)
- Custom binary protocol: Rejected for complexity and maintainability

### Typed API Exposure

**Decision**: Use `contextBridge.exposeInMainWorld()` with TypeScript interfaces for type safety.

**Rationale**: Follows v0.3.0 preload handler pattern, ensures compile-time type checking across process boundaries.

### Event Forwarding

**Decision**: Daemon events → main process → renderer via Electron IPC event forwarding.

**Rationale**: Maintains security boundary; renderer only receives events through approved channel.

### Testing Strategy

**Decision**: Contract tests for IPC methods, integration tests for full chain, unit tests for individual components.

**Rationale**: Aligns with Constitution Principle II (Test-First Quality) and existing test patterns.

### Performance Targets

**Decision**: 100+ concurrent rendering requests, <500ms response time for typical documents.

**Rationale**: Based on SC-003 and SC-004 from specification; reasonable for desktop application.

### Security Model

**Decision**: Local trust model only; no authentication required. Renderer has zero Node.js/filesystem access.

**Rationale**: Matches existing assumptions and security constraints; simplifies implementation.

## Research Tasks Completed

1. Analyzed v0.3.0 preload handler pattern (apps/desktop/src/preload/index.ts)
2. Reviewed existing daemon IPC implementation (packages/agent-core/src/daemon/rpc-server.ts)
3. Examined Electron security model for renderer isolation
4. Verified TypeScript type sharing patterns across processes

## Open Questions

None - all technical unknowns resolved.