# Research: JSON-RPC Unix Socket Server

**Date**: 2026-06-28
**Feature**: 006-json-rpc-unix-socket
**Source Reference**: v0.2.0 (`../../myboteam_V0.2.0/packages/daemon/src/`) and Accomplish (`../../../Accomplish/accomplish/packages/agent-core/src/daemon/`)

## Source Reference Analysis (MANDATORY)

### v0.2.0 Reference Implementation

**Source Location**: `../../myboteam_V0.2.0/packages/daemon/src/`

#### Files Analyzed

1. **rpc-server.ts** (310 lines) - Main RPC server implementation
   - Lines 27-60: `DaemonRpcServer` class constructor with `registerMethod()`, `daemon.ping`
   - Lines 62-64: `registerMethod()` implementation
   - Lines 66-78: `resolveHandler()` with method aliases
   - Lines 98-103: `hasConnectedClients()` implementation
   - Lines 123-130: `notify()` method for server-to-client notifications
   - Lines 132-203: `start()` method with socket cleanup and server creation
   - Lines 205-220: `stop()` method with graceful shutdown
   - Lines 222-297: `handleMessage()` with JSON-RPC parsing and error handling
   - Lines 299-309: `sendResponse()` helper

2. **socket-transport.ts** (89 lines) - Client-side transport
   - Lines 3-8: `DaemonTransport` interface definition
   - Lines 10-89: `createSocketTransport()` function with connection handling

3. **socket-path.ts** (29 lines) - Path resolution
   - Lines 5-28: `PathResolver` class with `getSocketPath()` supporting Windows named pipes

4. **json-rpc-client.ts** (103 lines) - Client implementation
   - Lines 5-62: `JSONRPCClient` class with request/response handling
   - Lines 64-98: `call()` method with timeout

5. **rpc-auth.ts** (24 lines) - Authentication handshake
   - Lines 3-24: `handleAuthHandshake()` function

6. **rate-limiter.ts** (20 lines) - Token bucket rate limiting
   - Lines 1-20: `TokenBucket` interface and `tryConsumeToken()` function

#### Key Patterns from v0.2.0

1. **DaemonRpcServer class** with:
   - `registerMethod(method, handler)` - Register handler for JSON-RPC method
   - `notify(method, params)` - Push notification to all connected clients
   - `hasConnectedClients()` - Check if any clients are connected
   - `start(socketPath?)` - Start listening on socket
   - `stop()` - Graceful shutdown

2. **SocketTransport interface** with:
   - `send(message)` - Send message to server
   - `onMessage(handler)` - Register message handler
   - `onDisconnect(handler)` - Register disconnect handler
   - `close()` - Close connection

3. **PathResolver class** with:
   - `getSocketPath(dataDir?)` - Get socket path (Unix) or named pipe (Windows)
   - `getDataDir()` - Get data directory from environment or default

4. **JSON-RPC 2.0 error codes**:
   - `-32700` PARSE_ERROR: Invalid JSON
   - `-32600` INVALID_REQUEST: Not a valid JSON-RPC request
   - `-32601` METHOD_NOT_FOUND: Method does not exist
   - `-32602` INVALID_PARAMS: Invalid method parameters
   - `-32603` INTERNAL_ERROR: Internal server error

5. **NDJSON framing**: Messages delimited by `\n`

6. **1MB buffer limit** with connection destruction on overflow

#### Patterns NOT to Adopt (not needed for v0.5.0)

- **Authentication** (rpc-auth.ts) - Local trust model, no auth required
- **Rate limiting** (rate-limiter.ts) - Not required for v0.5.0
- **Method aliases** - Not needed for new implementation

### Accomplish Reference Implementation

**Source Location**: `../../../Accomplish/accomplish/packages/agent-core/src/daemon/`

#### Files Analyzed

1. **rpc-server.ts** (165 lines) - Cleaner server with lifecycle callbacks
   - Lines 20-25: `DaemonRpcServerOptions` interface
   - Lines 33-54: `DaemonRpcServer` constructor with options
   - Lines 59-62: `registerMethod()` implementation
   - Lines 67-74: `hasConnectedClients()` implementation
   - Lines 80-88: `notify()` method
   - Lines 94-136: `start()` method with stale socket removal
   - Lines 141-155: `stop()` method
   - Lines 157-164: `removeStaleSocket()` helper

2. **rpc-message-handler.ts** (86 lines) - Separate message handling
   - Lines 10-17: `AnyMethodHandler` type and `RpcClient` interface
   - Lines 22-27: `sendResult()` helper
   - Lines 32-41: `sendError()` helper
   - Lines 46-86: `handleRpcLine()` function for message parsing

3. **common/types/daemon.ts** (790 lines) - TypeScript type definitions
   - Lines 56-87: JSON-RPC 2.0 base types (`JsonRpcRequest`, `JsonRpcResponse`, etc.)
   - Lines 93-105: `JSON_RPC_ERRORS` constants
   - Lines 392-701: `DaemonMethodMap` interface
   - Lines 778-787: `DaemonTransport` interface

#### Key Patterns from Accomplish

1. **DaemonRpcServerOptions interface** with:
   - `socketPath?` - Override default socket path
   - `onConnection?` - Callback for client connections
   - `onDisconnection?` - Callback for client disconnections

2. **Lifecycle callbacks** for connection/disconnection events

3. **Separate message handler** (`handleRpcLine()`) for cleaner separation of concerns

4. **TypeScript types** exported in `common/types/daemon.ts`

5. **Built-in `daemon.ping`** method with status, uptime, buildId

6. **No authentication or rate limiting** (local trust model)

## Key Design Decisions

### 1. Server Architecture

**Decision**: DaemonRpcServer class with method registration API
**Rationale**: Loose typing allows serving any JSON-RPC method without pre-declaring all methods in a type map
**Source Reference**: 
- v0.2.0: `rpc-server.ts` lines 27-60
- Accomplish: `rpc-server.ts` lines 33-54

### 2. Transport Protocol

**Decision**: Newline-delimited JSON (NDJSON) over Unix sockets / Windows named pipes
**Rationale**: Simple parsing, compatible with standard I/O, supports streaming
**Source Reference**: 
- v0.2.0: `rpc-server.ts` lines 164-172 (NDJSON parsing)
- Accomplish: `rpc-server.ts` lines 107-117 (NDJSON parsing)

### 3. Buffer Management

**Decision**: 1 MB maximum buffer size with connection destruction on overflow
**Rationale**: Prevents memory exhaustion attacks, matches typical IPC payload sizes
**Source Reference**: 
- v0.2.0: `rpc-server.ts` lines 158-163

### 4. Error Handling

**Decision**: Catch all errors in handler, return JSON-RPC error responses
**Rationale**: Server must never crash due to handler errors, maintains connection stability
**Source Reference**: 
- v0.2.0: `rpc-server.ts` lines 284-296
- Accomplish: `rpc-message-handler.ts` lines 75-85

### 5. Client Management

**Decision**: UUID-based client IDs with connection/disconnection callbacks
**Rationale**: Enables tracking, notification broadcasting, and connection state queries
**Source Reference**: 
- v0.2.0: `rpc-server.ts` lines 146-154
- Accomplish: `rpc-server.ts` lines 99-103

### 6. Message Parsing

**Decision**: Fire-and-forget async handler dispatch with void return
**Rationale**: Non-blocking, allows concurrent request processing
**Source Reference**: 
- v0.2.0: `rpc-server.ts` lines 169-172
- Accomplish: `rpc-message-handler.ts` lines 46-86

## Recommendations for MyBot Team

1. **Follow Accomplish patterns exactly** - Proven in production, consistent with codebase
2. **Reuse TypeScript types** - Export in packages/types/src/daemon.ts
3. **Implement incrementally** - Server → Transport → Handler → Tests
4. **Prioritize error handling** - Server must be resilient to malformed input
5. **Include health check** - daemon.ping for monitoring and load balancers
6. **Add lifecycle callbacks** - onConnection/onDisconnection for monitoring
7. **Support Windows named pipes** - Cross-platform compatibility

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cross-platform compatibility | Medium | High | Test on both Unix and Windows |
| Buffer overflow attacks | Low | High | 1MB limit with connection cleanup |
| Handler memory leaks | Medium | Medium | Async handlers with timeout |
| Stale socket files | High | Low | Remove on server start |

## Conclusion

The v0.2.0 and Accomplish reference implementations provide a solid foundation. The key is to maintain consistency with existing patterns while adapting method names from v0.2.0 to v0.5.0 naming conventions. The v0.5.0 implementation should follow Accomplish patterns (simpler, no auth/rate limiting) while incorporating the best practices from v0.2.0 (comprehensive error handling, NDJSON framing).
