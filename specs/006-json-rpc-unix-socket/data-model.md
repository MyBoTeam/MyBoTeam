# Data Model: JSON-RPC Unix Socket Server

**Date**: 2026-06-28
**Feature**: 006-json-rpc-unix-socket

## Core Entities

### JsonRpcRequest

Represents a client-initiated RPC request.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jsonrpc | string | Yes | Must be "2.0" |
| id | string \| number | Yes | Correlation ID for matching responses |
| method | string | Yes | Name of the method to invoke |
| params | unknown | No | Method parameters |

**Validation Rules**:
- `jsonrpc` must equal "2.0"
- `id` must be present (string or number)
- `method` must be non-empty string
- `params` type depends on method definition

### JsonRpcResponse

Represents a server response to a request.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jsonrpc | string | Yes | Must be "2.0" |
| id | string \| number | Yes | Matches request correlation ID |
| result | unknown | Conditional | Present on success |
| error | JsonRpcError | Conditional | Present on failure |

**Validation Rules**:
- Exactly one of `result` or `error` must be present
- `id` must match the request's correlation ID

### JsonRpcNotification

Represents a server-to-client push message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jsonrpc | string | Yes | Must be "2.0" |
| method | string | Yes | Notification method name |
| params | unknown | No | Notification parameters |

**Note**: Notifications do not have an `id` field and do not expect a response.

### JsonRpcError

Structured error information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | number | Yes | Standard or custom error code |
| message | string | Yes | Human-readable error description |
| data | unknown | No | Additional error details |

**Standard Error Codes**:
- `-32700` PARSE_ERROR: Invalid JSON
- `-32600` INVALID_REQUEST: Not a valid JSON-RPC request
- `-32601` METHOD_NOT_FOUND: Method does not exist
- `-32602` INVALID_PARAMS: Invalid method parameters
- `-32603` INTERNAL_ERROR: Internal server error

### ConnectedClient

Tracks connected client state.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | UUID identifying the client |
| socket | Socket | Yes | Underlying network socket |
| buffer | NdjsonBuffer | Yes | Incomplete message buffer (from `./ndjson-buffer.js`) |

**Lifecycle**:
1. Created on socket connection
2. Updated as data arrives
3. Deleted on socket close or error

### HandlerFunction

Registered method handler.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| method | string | Yes | Method name to handle |
| handler | Function | Yes | Async or sync handler function |

**Signature**:
```typescript
type AnyMethodHandler = (params: any) => Promise<unknown> | unknown;
```

## Relationships

```
JsonRpcRequest ──(correlates with)──► JsonRpcResponse
     │
     ▼
HandlerFunction ──(processes)──► JsonRpcRequest
     │
     ▼
ConnectedClient ──(receives)──► JsonRpcResponse
     │
     ▼
DaemonRpcServer ──(manages)──► ConnectedClient[]
     │
     ▼
DaemonRpcServer ──(registers)──► HandlerFunction[]
```

## State Transitions

### Client Connection State

```
[Disconnected] ──(connect)──► [Connected] ──(close)──► [Disconnected]
                              │
                              └──(error)──► [Disconnected]
```

### Server State

```
[Stopped] ──(start)──► [Listening] ──(stop)──► [Stopped]
                         │
                         └──(error)──► [Error] ──(restart)──► [Listening]
```

## Data Volume Assumptions

- **Concurrent clients**: Up to 100 simultaneous connections
- **Message size**: Maximum 1 MB per message
- **Message rate**: Depends on handler complexity, target <100ms response time
- **Buffer usage**: Each client maintains up to 1 MB buffer for incomplete messages

## Storage

This is a stateless IPC transport layer. No persistent storage required.

**In-Memory State**:
- Connected clients map
- Registered handlers map
- Server start time (for uptime calculation)

## Validation Summary

| Entity | Validation | Error Response |
|--------|------------|----------------|
| JsonRpcRequest | Schema validation | INVALID_REQUEST (-32600) |
| JsonRpcRequest.method | Handler lookup | METHOD_NOT_FOUND (-32601) |
| JsonRpcRequest.params | Handler validation | INVALID_PARAMS (-32602) |
| JSON parsing | Syntax validation | PARSE_ERROR (-32700) |
| Handler execution | Try-catch | INTERNAL_ERROR (-32603) |