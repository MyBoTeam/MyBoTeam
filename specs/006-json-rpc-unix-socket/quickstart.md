# Quickstart: JSON-RPC Unix Socket Server

**Feature**: 006-json-rpc-unix-socket
**Date**: 2026-06-28

## Overview

This guide helps you get started with the JSON-RPC Unix Socket Server for MyBot Team daemon IPC.

## Prerequisites

- Node.js 18+
- TypeScript 5.7+
- pnpm (package manager)

## Installation

```bash
# From repository root
pnpm install
```

## Basic Usage

### Creating a Server

```typescript
import { DaemonRpcServer } from '@myboteam/agent-core/daemon';

const server = new DaemonRpcServer({
  socketPath: '/tmp/myboteam-daemon.sock',
  onConnection: (clientId) => {
    console.log(`Client connected: ${clientId}`);
  },
  onDisconnection: (clientId) => {
    console.log(`Client disconnected: ${clientId}`);
  }
});
```

### Registering Methods

```typescript
// Simple method
server.registerMethod('greet', (params: { name: string }) => {
  return { message: `Hello, ${params.name}!` };
});

// Async method
server.registerMethod('fetch.data', async (params: { id: string }) => {
  const data = await fetchData(params.id);
  return data;
});
```

### Starting the Server

```typescript
await server.start();
console.log('Server listening on socket');
```

### Connecting as a Client

```typescript
import { createSocketTransport } from '@myboteam/agent-core/daemon';

const transport = await createSocketTransport({
  socketPath: '/tmp/myboteam-daemon.sock'
});

// Send a request
transport.send({
  jsonrpc: '2.0',
  id: '1',
  method: 'greet',
  params: { name: 'World' }
});

// Listen for responses
transport.onMessage((message) => {
  console.log('Received:', message);
});
```

## Testing

### Unit Tests

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage
```

### Integration Tests

```bash
# Run integration tests
pnpm test -- --grep "integration"
```

### Contract Tests

```bash
# Run contract tests
pnpm test -- --grep "contract"
```

## Configuration

### Socket Path

Default socket path is derived from data directory. Override with:

```typescript
const server = new DaemonRpcServer({
  socketPath: '/custom/path/to/socket.sock'
});
```

### Buffer Size

Maximum message size is 1 MB (hardcoded). Messages exceeding this limit will cause connection termination.

## Error Handling

Server catches all handler errors and returns JSON-RPC error responses:

```typescript
server.registerMethod('risky.method', () => {
  throw new Error('Something went wrong');
  // Client receives: { error: { code: -32603, message: 'Something went wrong' } }
});
```

## Monitoring

### Health Check

The `daemon.ping` method is registered automatically by the server as a built-in health check endpoint. No manual registration is needed.

### Connection Status

```typescript
if (server.hasConnectedClients()) {
  console.log('Clients are connected');
}
```

## Production Considerations

1. **Graceful Shutdown**: Call `server.stop()` on process termination
2. **Stale Socket Cleanup**: Server removes stale socket files on start
3. **Logging**: Use structured logger (pino) for production logs
4. **Monitoring**: Implement health check endpoints for load balancers

## Troubleshooting

### Server Won't Start

- Check if socket file already exists (server removes it automatically)
- Verify directory permissions for socket location
- Ensure no other process is using the socket

### Client Can't Connect

- Verify socket path matches server configuration
- Check file permissions on socket file
- Ensure server is running and listening

### Messages Not Received

- Verify NDJSON framing (each message ends with `\n`)
- Check message size (must be < 1 MB)
- Ensure valid JSON-RPC 2.0 format

## API Reference

See [contracts/rpc-server.md](./contracts/rpc-server.md) for complete API documentation.