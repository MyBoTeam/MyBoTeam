# RPC Server Contract

**Feature**: 006-json-rpc-unix-socket
**Version**: 1.0.0
**Date**: 2026-06-28

## Overview

This contract defines the JSON-RPC 2.0 protocol for communication between clients and the MyBot Team daemon server.

## Transport

- **Protocol**: JSON-RPC 2.0 over Unix domain socket / Windows named pipe
- **Framing**: Newline-delimited JSON (NDJSON)
- **Maximum Message Size**: 1 MB
- **Encoding**: UTF-8

## Message Types

### Request (Client → Server)

```json
{
  "jsonrpc": "2.0",
  "id": "string|number",
  "method": "string",
  "params": {}
}
```

### Response (Server → Client)

```json
{
  "jsonrpc": "2.0",
  "id": "string|number",
  "result": {}
}
```

### Error Response (Server → Client)

```json
{
  "jsonrpc": "2.0",
  "id": "string|number",
  "error": {
    "code": -32600,
    "message": "Invalid request",
    "data": {}
  }
}
```

### Notification (Server → Client)

```json
{
  "jsonrpc": "2.0",
  "method": "string",
  "params": {}
}
```

## Standard Error Codes

| Code | Name | Description |
|------|------|-------------|
| -32700 | PARSE_ERROR | Invalid JSON |
| -32600 | INVALID_REQUEST | Not a valid JSON-RPC request |
| -32601 | METHOD_NOT_FOUND | Method does not exist |
| -32602 | INVALID_PARAMS | Invalid method parameters |
| -32603 | INTERNAL_ERROR | Internal server error |

## Built-in Methods

### daemon.ping

Health check endpoint.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "daemon.ping"
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "status": "ok",
    "uptime": 12345,
    "buildId": "abc123"
  }
}
```

## Client API

### Server Creation

```typescript
const server = new DaemonRpcServer({
  socketPath: '/path/to/socket.sock', // Optional
  onConnection: (clientId) => {},     // Optional
  onDisconnection: (clientId) => {}   // Optional
});
```

### Method Registration

```typescript
server.registerMethod('my.method', async (params) => {
  // Handle method
  return { result: 'success' };
});
```

### Notification Broadcasting

```typescript
server.notify('event.name', { data: 'value' });
```

### Client Status Check

```typescript
const hasClients = server.hasConnectedClients();
```

### Server Lifecycle

```typescript
await server.start();  // Start listening
await server.stop();   // Stop and cleanup
```

## Contract Tests

### Test Case: Valid Request/Response

1. Client sends valid JSON-RPC request
2. Server processes request with registered handler
3. Server returns response with matching correlation ID
4. Response contains expected result

### Test Case: Method Not Found

1. Client sends request with unknown method
2. Server returns error with code -32601
3. Error message includes method name

### Test Case: Invalid JSON

1. Client sends malformed JSON
2. Server returns error with code -32700
3. Connection remains open for next request

### Test Case: Buffer Overflow

1. Client sends message > 1 MB
2. Server destroys connection
3. Server logs buffer overflow error

### Test Case: Concurrent Connections

1. Multiple clients connect simultaneously
2. Each client sends independent requests
3. Server processes all requests concurrently
4. Each client receives correct response

## Compliance

This contract follows JSON-RPC 2.0 specification: https://www.jsonrpc.org/specification