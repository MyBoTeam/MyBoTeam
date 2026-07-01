# Quickstart: IPC Bus Renderer Daemon

## Overview

The IPC Bus Renderer Daemon provides rendering services to the Electron renderer process via a secure 4-link chain: React → preload → main → daemon.

## Architecture

```
┌─────────────┐     Electron IPC     ┌─────────────┐     JSON-RPC 2.0     ┌─────────────┐
│   Renderer  │ ◄──────────────────► │     Main    │ ◄──────────────────► │   Daemon    │
│  (React UI) │                      │   Process   │                      │   Process   │
└─────────────┘                      └─────────────┘                      └─────────────┘
       ▲                                    ▲                                    ▲
       │                                    │                                    │
       └────────────── Preload ─────────────┘                                    │
                    (contextBridge)                                               │
                                                                                 │
                                                                    ┌────────────┴────────────┐
                                                                    │   Rendering Plugins     │
                                                                    │   (PDF, Image, etc.)    │
                                                                    └─────────────────────────┘
```

## Development Setup

### Prerequisites
- Node.js 18+
- pnpm
- Electron (for desktop app)

### Running the Daemon
```bash
# From monorepo root
pnpm --filter @myboteam/daemon dev
```

### Running the Desktop App
```bash
pnpm --filter @myboteam/desktop dev
```

## Testing

### Contract Tests
```bash
pnpm --filter @myboteam/daemon test:contract
```

### Integration Tests
```bash
pnpm --filter @myboteam/desktop test:integration
```

### Unit Tests
```bash
pnpm test
```

## API Reference

### Renderer → Daemon Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `render` | Render document | `rendererType`, `documentData`, `options?` | `RenderResult` |
| `daemon.ping` | Health check | none | `PingResult` |
| `daemon.getPlugins` | List loaded plugins | none | `GetPluginsResult` |

### Daemon → Renderer Events

| Event | Description | Parameters |
|-------|-------------|------------|
| `event.render.progress` | Rendering progress | `requestId`, `progress`, `status` |
| `event.render.complete` | Rendering completed | `requestId`, `output`, `mimeType` |
| `event.render.error` | Rendering failed | `requestId`, `error` |

## Security Model

- **Renderer**: Zero Node.js/filesystem access
- **Communication**: All via preload→main→daemon chain
- **Authentication**: Local trust model (none required)
- **Message Size**: Maximum 1MB

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `maxMessageSize` | 1MB | Maximum IPC message size |
| `requestTimeout` | 30s | Rendering request timeout |
| `pluginCrashIsolation` | true | Isolate plugin crashes |

## Monitoring

Structured logs and metrics are available:
- Request counts and latency
- Plugin performance
- Connection statistics
- Error rates

## Troubleshooting

### Common Issues

1. **Daemon not starting**: Check port availability and permissions
2. **Renderer not receiving events**: Verify preload script is loaded
3. **Plugin crashes**: Check plugin logs; daemon remains operational

### Debug Mode
```bash
DEBUG=myboteam:* pnpm --filter @myboteam/daemon dev
```