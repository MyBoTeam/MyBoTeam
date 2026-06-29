# Contract: Login Item Manager API

## Overview

This contract defines the public API for the Login Item Manager, which handles macOS login item registration and management.

## API Surface

### LoginItemManager

```typescript
interface LoginItemManager {
  /**
   * Enable auto-start for the daemon
   * @param options - Registration options
   * @returns Promise resolving to registration result
   */
  enable(options: EnableOptions): Promise<RegistrationResult>;

  /**
   * Disable auto-start for the daemon
   * @param label - Login item label
   * @returns Promise resolving to unregistration result
   */
  disable(label: string): Promise<UnregistrationResult>;

  /**
   * Get current status of a login item
   * @param label - Login item label
   * @returns Promise resolving to current status
   */
  getStatus(label: string): Promise<LoginItemStatus>;

  /**
   * Sync with system state (query macOS for actual registration)
   * @param label - Login item label
   * @returns Promise resolving to synced status
   */
  syncWithSystem(label: string): Promise<LoginItemStatus>;
}
```

### Types

```typescript
interface EnableOptions {
  applicationPath: string;
  label: string;
  method?: 'accomplishDefaults' | 'serviceManagement';
}

interface RegistrationResult {
  success: boolean;
  method: 'accomplishDefaults' | 'serviceManagement';
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

interface UnregistrationResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

interface LoginItemStatus {
  registered: boolean;
  state: 'Disabled' | 'Enabled' | 'Error';
  method: 'accomplishDefaults' | 'serviceManagement' | 'unknown';
  lastChecked: string;
  error?: {
    code: string;
    message: string;
  };
}
```

## Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| PERMISSION_DENIED | User denied login item permission | No |
| PATH_NOT_FOUND | Daemon binary path not found | Yes |
| SYSTEM_ERROR | macOS system error | Yes |
| ALREADY_REGISTERED | Login item already registered | No |
| NOT_REGISTERED | Login item not registered | No |

## Behavior

### Enable Flow

1. Check Accomplish defaults availability
2. If available, register using Accomplish defaults
3. If not available, fallback to Service Management framework
4. Log registration attempt with result
5. Return registration result with method used

### Disable Flow

1. Check current registration state
2. If registered, unregister using appropriate method
3. Log unregistration attempt with result
4. Return unregistration result

### Status Check Flow

1. Query stored state from preferences
2. Query system state from macOS
3. Compare and sync if mismatch detected
4. Return current status

## Testing Requirements

- Unit tests for all API methods
- Integration tests for macOS API integration
- Error handling tests for all error codes
- State transition tests for all valid transitions

## Security Considerations

- No sensitive data stored in login item registration
- User permission required for login item modifications
- Path validation to prevent arbitrary binary execution
