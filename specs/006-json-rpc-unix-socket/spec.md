# Feature Specification: JSON-RPC Unix Socket Server

**Feature Branch**: `006-json-rpc-unix-socket`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-147/m3-1-json-rpc-server-unix-socket"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send request and receive response (Priority: P1)

A client process sends a JSON-RPC request over a Unix domain socket to the daemon and receives a response with the same correlation ID.

**Why this priority**: Core functionality of the JSON-RPC server; without this, no communication is possible.

**Independent Test**: Can be fully tested by sending a single request and verifying the response contains the same correlation ID and correct result.

**Acceptance Scenarios**:

1. **Given** a daemon listening on a Unix socket, **When** a client sends a valid JSON-RPC request with a correlation ID, **Then** the daemon responds with a JSON-RPC response containing the same correlation ID and the result from the handler.
2. **Given** a daemon listening on a Unix socket, **When** a client sends a request with a missing correlation ID, **Then** the daemon still processes the request and returns a response (correlation ID can be null).

---

### User Story 2 - Method routing (Priority: P2)

The daemon routes incoming requests to the appropriate handler function based on the `method` field in the JSON-RPC request.

**Why this priority**: Enables the daemon to execute different operations based on client intent.

**Independent Test**: Can be tested by registering two different handler methods and verifying each request is dispatched to the correct handler.

**Acceptance Scenarios**:

1. **Given** the daemon has registered handler functions for methods "list_agents" and "get_status", **When** a client sends a request with method "list_agents", **Then** the daemon invokes the "list_agents" handler and returns its result.
2. **Given** a daemon has no handler for method "unknown_method", **When** a client sends a request with that method, **Then** the daemon returns a JSON-RPC error with code -32601 (Method not found).

---

### User Story 3 - Structured error responses (Priority: P3)

The daemon returns structured error responses following JSON-RPC 2.0 error codes for various failure conditions.

**Why this priority**: Provides predictable error handling for clients and aids debugging.

**Independent Test**: Can be tested by sending malformed requests, unknown methods, and invalid parameters to verify correct error codes are returned.

**Acceptance Scenarios**:

1. **Given** a daemon listening on a Unix socket, **When** a client sends an invalid JSON string, **Then** the daemon responds with error code -32700 (Parse error).
2. **Given** a daemon listening on a Unix socket, **When** a client sends a valid JSON object that is not a valid JSON-RPC request (missing "jsonrpc" field), **Then** the daemon responds with error code -32600 (Invalid request).
3. **Given** a daemon listening on a Unix socket, **When** a client sends a request with invalid parameters (e.g., wrong type), **Then** the daemon responds with error code -32602 (Invalid params).

---

### Edge Cases

- What happens when the Unix socket file already exists? The daemon should either reuse it or fail gracefully with clear error.
- How does the system handle a client disconnecting mid-request? The daemon should clean up resources and continue serving other clients.
- What happens when a handler function throws an exception? The daemon should catch it and return a JSON-RPC error with code -32603 (Internal error).
- How does the system handle concurrent requests from multiple clients? The daemon should process them concurrently without blocking.
- What happens when a client sends a notification (message without `id`)? The daemon should invoke the handler but not send a response (JSON-RPC 2.0 notification semantics).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement a JSON-RPC 2.0 server over Unix domain socket (with Windows named pipe support).
- **FR-002**: System MUST associate each request with a unique correlation ID and include it in the response.
- **FR-003**: System MUST route incoming requests to registered handler functions based on the `method` field.
- **FR-004**: System MUST return error responses with structured codes per JSON-RPC 2.0 specification (e.g., -32700 Parse error, -32600 Invalid request, -32601 Method not found, -32602 Invalid params, -32603 Internal error).
- **FR-005**: System MUST handle concurrent requests from multiple clients simultaneously (async handlers supported).
- **FR-006**: System MUST validate incoming messages against JSON-RPC 2.0 schema before processing.
- **FR-007**: System MUST use v0.5.0 method names directly (no adaptation from v0.2.0 required — methods are registered by the consumer, not the server).
- **FR-008**: System MUST provide unit, integration, and contract tests for all RPC methods.
- **FR-009**: System MUST log using `pino` structured logger with configurable levels (matching plan.md dependency).
- **FR-010**: System MUST clean up socket file on graceful shutdown to avoid stale files (separate from FR-021 which controls close behavior).
- **FR-011**: System MUST enforce 1 MB maximum message size limit (matching Accomplish).
- **FR-012**: System MUST use newline-delimited JSON (NDJSON) framing protocol.
- **FR-013**: System MUST support `registerMethod()` API for handler registration (like Accomplish).
- **FR-014**: System MUST support `notify()` method for server-to-client notifications.
- **FR-022**: System MUST treat incoming messages without an `id` field as JSON-RPC 2.0 notifications: process the method but do NOT send a response. This enables fire-and-forget message passing.
- **FR-015**: System MUST include built-in `daemon.ping` health check method.
- **FR-016**: System MUST expose `hasConnectedClients()` utility method.
- **FR-017**: System MUST support `onConnection` and `onDisconnection` lifecycle callbacks (signatures: `(clientId: string) => void`, matching Accomplish pattern).
- **FR-018**: System MUST use a `DaemonTransport` interface for transport abstraction (methods: `send()`, `onMessage()`, `onDisconnect()`, `close()` — matching v0.2.0 socket-transport.ts lines 3-8).
- **FR-019**: System MUST resolve default socket path from dataDir using pattern `{dataDir}/daemon.sock` (matching v0.2.0 PathResolver and Accomplish). If dataDir is not provided, fallback to `process.env.DATA_DIR` or `{cwd}/data`.
- **FR-020**: System MUST catch all errors in RPC handler and return JSON-RPC error responses.
- **FR-021**: System MUST perform immediate close on graceful shutdown (destroy sockets without waiting for pending writes, matching Accomplish behavior).

### Key Entities

- **JSON-RPC Request**: A JSON object with fields "jsonrpc" (string, "2.0"), "method" (string), "params" (optional), "id" (correlation ID, nullable).
- **JSON-RPC Response**: A JSON object with fields "jsonrpc" (string, "2.0"), "result" (on success) or "error" (on failure), "id" (correlation ID matching request).
- **Correlation ID**: Unique identifier (string, number, or null) used to match requests with responses.
- **Notification**: A JSON-RPC 2.0 message without an `id` field. The method is invoked but no response is sent back.
- **Handler Function**: An async-capable function registered to handle a specific JSON-RPC method name.
- **Error Code**: Integer code following JSON-RPC 2.0 standard error codes.
- **DaemonTransport**: Interface abstracting socket communication (supports Unix sockets and Windows named pipes).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clients can successfully send requests and receive responses with matching correlation IDs 100% of the time.
- **SC-002**: Method routing correctly dispatches to appropriate handler functions with zero misrouting.
- **SC-003**: Error responses follow JSON-RPC 2.0 error code specification for all defined error conditions.
- **SC-004**: Unit, integration, and contract tests pass for all RPC methods (existing v0.2.0 methods adapted to v0.5.0).
- **SC-005**: Server can handle at least 100 concurrent connections without performance degradation (response time remains under 100ms for simple requests).
- **SC-006**: All acceptance scenarios from user stories are satisfied.
- **SC-007**: Server enforces 1 MB maximum message size limit with appropriate error response for oversized messages.
- **SC-008**: Server correctly handles both Unix domain sockets and Windows named pipes.
- **SC-009**: Server supports `registerMethod()`, `notify()`, `hasConnectedClients()`, and lifecycle callbacks.
- **SC-011**: Server correctly handles JSON-RPC 2.0 notifications (messages without `id`): method is invoked but no response is sent.
- **SC-010**: TypeScript types exported in `/packages/types` for client consumption.

## Assumptions

- Unix socket transport is sufficient for local inter-process communication; network transport is not required.
- Existing handler functions from v0.2.0 daemon can be adapted with minimal changes.
- No authentication or authorization is required for socket communication (local trust model).
- The daemon runs on POSIX-compliant systems (Linux, macOS) and Windows (via named pipes).
- JSON-RPC 2.0 specification is the authoritative standard for message format and error codes.
- Contract tests will be written using a testing framework already present in the project (e.g., Vitest/Jest).
- Implementation follows Accomplish patterns (socket-transport.ts, rpc-server.ts) for consistency.
- Types are exported in `/packages/types` for client consumption.
- Standard TypeScript imports are used (v0.5.0 follows ESM convention with .js extensions).
- Structured logger is used for logging (not console-based).
- Error responses include detailed error messages for debugging.
- Graceful shutdown performs immediate close (like Accomplish).

## Clarifications

### Session 2026-06-28

- Q: Who are the primary clients of this JSON-RPC server? → A: Both daemon processes and CLI tools
- Q: What is the maximum message size the server should accept? → A: Same as in Accomplish (1 MB buffer limit)
- Q: What message framing protocol should the server use? → A: Newline-delimited JSON (NDJSON)
- Q: How should handler functions be registered with the server? → A: Same as Accomplish (registerMethod() API)
- Q: Should the server support sending notifications to connected clients? → A: Yes, include notify() method
- Q: Should the server include built-in health check methods? → A: Yes, include daemon.ping
- Q: Should the server expose a method to check if any clients are connected? → A: Yes, include hasConnectedClients()
- Q: Should the server support connection/disconnection lifecycle callbacks? → A: Yes, include both
- Q: Should handler functions support async operations? → A: Yes, async handlers supported
- Q: Should the server support Windows named pipes? → A: Yes, both Unix sockets and Windows named pipes
- Q: Should the server use a transport abstraction layer? → A: Yes, use DaemonTransport interface
- Q: How should the default socket path be resolved? → A: Same as Accomplish (derive from dataDir)
- Q: Should the server include PID lock management? → A: Already implemented in 004-pid-lock-manager
- Q: How should the server handle errors in the RPC message handler? → A: Catch all, return error responses
- Q: What logging approach should the server use? → A: Structured logger
- Q: What testing approach should be used for the RPC server? → A: All test types
- Q: How should the server handle graceful shutdown? → A: Same as Accomplish (immediate close)
- Q: Should the server export TypeScript types? → A: Yes, export in /packages/types
- Q: Where should the RPC server implementation live? → A: packages/agent-core/src/daemon/
- Q: Should the server use ESM modules with .js extensions? → A: Yes, v0.5.0 follows ESM convention with .js extensions (matching reference implementations v0.2.0 and Accomplish)
- Q: How much detail should error responses include? → A: Include error details