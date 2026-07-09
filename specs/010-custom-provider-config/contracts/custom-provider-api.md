# Custom Provider API Contract

## Overview

This contract defines the interface for custom LLM provider configuration management.

**Entity Definitions**: See `data-model.md` for full entity schemas (CustomProvider, ConnectionTestResult, CustomProviderConfig). This contract defines request/response types only.

**Naming Note**: Our `CustomProviderConfig` (validation state) is different from upstream's `ProviderConfig` (SDK configuration) in `provider-config.ts`. Do not confuse them.

**Error Codes**: Reuses upstream's error codes from `provider-errors.ts` where applicable. Custom provider-specific codes are defined below.

## Operations

### 1. Create Provider Configuration

**Input**:
```typescript
interface CreateProviderRequest {
  name: string;          // User-provided name (1-100 chars)
  url: string;           // Base URL (valid HTTP/HTTPS)
  apiKey?: string;       // API key (optional, max 1024 chars)
  modelName: string;     // Default model name (1-256 chars)
}
```

**Output**:
```typescript
interface CreateProviderResponse {
  success: boolean;
  provider?: CustomProvider;
  error?: string;
}
```

**Validation**:
- `name` must be unique per user
- `url` must be valid HTTP/HTTPS URL
- `apiKey` format validated if provided
- `modelName` must not be empty

### 2. Update Provider Configuration

**Input**:
```typescript
interface UpdateProviderRequest {
  providerId: string;    // UUID of existing provider
  name?: string;         // Updated name
  url?: string;          // Updated URL
  apiKey?: string;       // Updated API key
  modelName?: string;    // Updated model name
  status?: 'Active' | 'Inactive';  // Status update (cannot set to Error directly)
}
```

**Output**:
```typescript
interface UpdateProviderResponse {
  success: boolean;
  provider?: CustomProvider;
  error?: string;
}
```

**Validation**:
- `providerId` must reference existing provider
- If `name` changed, must remain unique per user
- If `url` changed, must be valid HTTP/HTTPS URL
- Cannot directly set status to 'Error' (only via failed test)

### 3. Delete Provider Configuration

**Input**:
```typescript
interface DeleteProviderRequest {
  providerId: string;    // UUID of provider to delete
}
```

**Output**:
```typescript
interface DeleteProviderResponse {
  success: boolean;
  error?: string;
}
```

**Behavior**:
- Soft delete (marks as inactive)
- Hard delete only via admin operation
- Associated test results retained for 30 days

### 4. Test Provider Connection

**Input**:
```typescript
interface TestConnectionRequest {
  providerId: string;    // UUID of provider to test
  timeout?: number;      // Optional timeout in ms (default: 10000)
}
```

**Output**:
```typescript
interface TestConnectionResponse {
  success: boolean;
  result?: ConnectionTestResult;
  error?: string;
}
```

**Behavior**:
- Tests connectivity to provider URL
- Validates API key if provided
- Returns available models if successful
- Updates provider status based on result
- Stores test result in history

### 5. List Provider Configurations

**Input**:
```typescript
interface ListProvidersRequest {
  status?: 'Active' | 'Inactive' | 'Error';  // Optional filter
  limit?: number;       // Optional pagination limit (default: 50)
  offset?: number;      // Optional pagination offset
}
```

**Output**:
```typescript
interface ListProvidersResponse {
  success: boolean;
  providers?: CustomProvider[];
  total?: number;
  error?: string;
}
```

**Behavior**:
- Returns providers sorted by name
- Excludes API keys from response (masked)
- Supports pagination
- Filters by status if provided

### 6. Get Provider Configuration

**Input**:
```typescript
interface GetProviderRequest {
  providerId: string;    // UUID of provider
}
```

**Output**:
```typescript
interface GetProviderResponse {
  success: boolean;
  provider?: CustomProvider;
  error?: string;
}
```

**Behavior**:
- Returns full provider details
- API key masked in response
- Includes latest test result

## Error Codes

**Reused from upstream `provider-errors.ts`**:
| Code | Description | Source |
|------|-------------|--------|
| `AUTHENTICATION_ERROR` | API key is invalid or missing | upstream provider-errors.ts |
| `RATE_LIMIT_ERROR` | Provider is rate limiting requests (HTTP 429) | upstream provider-errors.ts |
| `TIMEOUT_ERROR` | Connection test timed out | upstream provider-errors.ts |
| `CONNECTION_ERROR` | Cannot connect to provider endpoint | upstream provider-errors.ts |

**Custom provider-specific codes**:
| Code | Description |
|------|-------------|
| `PROVIDER_NOT_FOUND` | Provider with given ID not found |
| `PROVIDER_NAME_EXISTS` | Provider name already exists for user |
| `INVALID_URL` | URL format is invalid |
| `INVALID_API_KEY` | API key format is invalid |
| `MODEL_NOT_FOUND` | Specified model not available on endpoint |
| `VALIDATION_FAILED` | Configuration validation failed |

## Security Considerations

- API keys are never returned in plaintext
- API keys are encrypted at rest in vault
- Connection tests use HTTPS when possible
- Rate limiting protection for test endpoints
- Input validation on all fields
- No sensitive data in logs