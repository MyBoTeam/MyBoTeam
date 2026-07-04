# Data Model: Local LLM Provider (Ollama/LMStudio)

**Feature**: 010-local-llm-provider  
**Date**: 2026-07-02  
**Status**: Complete

## Entities

### LocalProviderConfig

**Purpose**: Configuration for local LLM providers

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | User-assigned unique identifier |
| type | 'ollama' \| 'lmstudio' | Yes | - | Provider type enum value |
| endpoint | string | Yes | - | Provider URL (e.g., http://localhost:11434) |
| apiKey | string | No | undefined | Optional API key for secured instances |
| headers | Record<string, string> | No | {} | Custom HTTP headers |
| timeout | number | No | 120000 | Request timeout in milliseconds |
| enabled | boolean | No | true | Whether provider is active |

**Validation Rules**:
- `name`: 1-128 characters, unique across providers
- `endpoint`: Valid URL, must be localhost or private IP for auto-discovered providers
- `timeout`: Positive integer, minimum 1000ms

**Relationships**:
- Belongs to one Provider (via Provider.id)
- Has many Models (via ModelInfo.provider)

### DiscoveredProvider

**Purpose**: Result of auto-discovery scan

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| type | 'ollama' \| 'lmstudio' | Yes | - | Provider type enum value |
| port | number | Yes | - | Discovered port |
| available | boolean | Yes | - | Whether provider responded to health check |
| models | ModelInfo[] | No | [] | Available models (if discovered) |

**State Transitions**:
```
Discovered → Available (health check passes)
Discovered → Unavailable (health check fails)
```

### ProviderCapability

**Purpose**: Detected capabilities of a local provider

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| streaming | boolean | Yes | true | Supports streaming responses |
| tools | boolean | Yes | false | Supports tool/function calling |
| vision | boolean | Yes | false | Supports image inputs |
| maxContextWindow | number | No | undefined | Maximum context window size |

**Detection Logic**:
- Probe `/v1/models` and check response format
- Test streaming with minimal request
- Check model capabilities from model metadata

## Data Flow

### Provider Configuration Flow

```
User Configures Provider
        ↓
Create LocalProviderConfig
        ↓
Validate Config Schema
        ↓
Store in Settings System
        ↓
Provider Ready for Use
```

### Request/Response Flow

```
ChatRequest
        ↓
Validate Request Schema
        ↓
Map to OpenAI Format
        ↓
Send to Provider Endpoint
        ↓
Receive Response
        ↓
Validate Response Schema
        ↓
Map to ChatResponse/StreamingChunk
        ↓
Return to Caller
```

### Auto-Discovery Flow

```
Discovery Triggered
        ↓
Scan Known Ports (11434, 1234)
        ↓
Health Check Each Port
        ↓
Create DiscoveredProvider Results
        ↓
Filter Available Providers
        ↓
Return to UI for User Selection
```

## Schema Definitions

### Zod Schemas

```typescript
import { z } from 'zod';

export const LocalProviderConfigSchema = z.object({
  name: z.string().min(1).max(128),
  type: z.enum(['ollama', 'lmstudio']),
  endpoint: z.string().url(),
  apiKey: z.string().optional(),
  headers: z.record(z.string()).default({}),
  timeout: z.number().positive().default(120_000),
  enabled: z.boolean().default(true),
});

export const DiscoveredProviderSchema = z.object({
  type: z.enum(['ollama', 'lmstudio']),
  port: z.number().int().positive(),
  available: z.boolean(),
  models: z.array(ModelInfoSchema).default([]),
});

export const ProviderCapabilitySchema = z.object({
  streaming: z.boolean().default(true),
  tools: z.boolean().default(false),
  vision: z.boolean().default(false),
  maxContextWindow: z.number().positive().optional(),
});
```

## Storage

**Location**: Application settings system (existing infrastructure)

**Format**: JSON file in user config directory

**Migration**: No migration needed - new feature adds to existing settings

## Constraints

- Provider name must be unique across all providers
- Endpoint must be valid URL
- Timeout must be positive integer
- Auto-discovered providers must be on localhost or private IPs
