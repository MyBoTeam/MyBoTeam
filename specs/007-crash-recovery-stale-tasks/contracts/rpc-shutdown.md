# RPC Contract: daemon.shutdown

**Date**: 2026-06-29
**Feature**: 007-crash-recovery-stale-tasks
**Status**: Complete

## Method: daemon.shutdown

**Purpose**: Initiate graceful shutdown of the daemon with task drain

**Protocol**: JSON-RPC over Unix domain socket

### Request

```json
{
  "jsonrpc": "2.0",
  "method": "daemon.shutdown",
  "id": "request-uuid",
  "params": {
    "timeoutMs": 30000
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timeoutMs` | number | No | 30000 | Drain timeout in milliseconds |

### Success Response

```json
{
  "jsonrpc": "2.0",
  "id": "request-uuid",
  "result": {
    "success": true,
    "drainTimeout": 30000
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether shutdown was initiated |
| `drainTimeout` | number | Drain timeout in milliseconds |

### Idempotent Response (Already Shutting Down)

When `daemon.shutdown` is called while shutdown is already in progress, the handler returns a success response:

```json
{
  "jsonrpc": "2.0",
  "id": "request-uuid",
  "result": {
    "success": true,
    "message": "Shutdown already in progress"
  }
}
```

### Validation Error

If `timeoutMs` is invalid (negative, non-finite, or not a number):

```json
{
  "jsonrpc": "2.0",
  "id": "request-uuid",
  "result": {
    "success": false,
    "error": "Invalid timeoutMs: must be a finite non-negative number"
  }
}
```

### Behavior

1. **Immediate**: Set `isShuttingDown = true`
2. **Immediate**: Stop scheduler (reject new tasks)
3. **Immediate**: Return response to caller (don't wait for drain)
4. **Background**: Drain active tasks (wait up to `timeoutMs`)
5. **Background**: Force-stop remaining tasks if timeout reached
6. **Background**: Terminate agent child processes
7. **Background**: Release lock file
8. **Background**: Exit process

### Idempotency

- Multiple calls to `daemon.shutdown` return the same response
- If `isShuttingDown` is already `true`, return success without re-initiating

### Cross-Platform

- Works on Windows, macOS, and Linux
- Uses RPC method (not OS signals)
- No platform-specific code required

## Method: daemon.getShutdownStatus

**Purpose**: Check current shutdown status

**Protocol**: JSON-RPC over Unix domain socket

### Request

```json
{
  "jsonrpc": "2.0",
  "method": "daemon.getShutdownStatus",
  "id": "request-uuid",
  "params": {}
}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "id": "request-uuid",
  "result": {
    "isShuttingDown": false,
    "shutdownStartTime": null,
    "drainTimeoutMs": 30000
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `isShuttingDown` | boolean | Whether shutdown is in progress |
| `shutdownStartTime` | string \| null | ISO 8601 timestamp when shutdown started |
| `drainTimeoutMs` | number | Current drain timeout |

## Implementation Notes

- Shutdown method MUST be registered before any other RPC methods
- Shutdown response MUST be returned immediately (don't block for drain)
- Agent processes MUST be terminated with SIGTERM (not SIGKILL)
- Lock file MUST be released after all cleanup is complete
- Drain timeout MUST be configurable via `MYBOTEAM_DRAIN_TIMEOUT_MS` env var
