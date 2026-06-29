# Quickstart: M3.4 Login Item Auto-Start

## Overview

This feature enables the daemon to automatically start on macOS login using Accomplish defaults as the primary approach, with Service Management framework as fallback.

## Key Concepts

1. **Accomplish Defaults**: Primary approach for login item management
2. **Service Management Framework**: Fallback for macOS 13+ compatibility
3. **Three-State Model**: Disabled, Enabled, Error states with clear transitions
4. **External State Sync**: Query system state on app launch

## Development Setup

### Prerequisites
- macOS 12+ (Monterey or later)
- Node.js 20+
- TypeScript 5.x

### Installation
```bash
# Clone and install dependencies
git clone <repository-url>
cd myboteam_v0.5.0
pnpm install
```

### Running Tests
```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# All tests
pnpm test
```

## Implementation Guide

### 1. Login Item Manager

Location: `packages/agent-core/src/daemon/login-item-manager.ts`

```typescript
// Example usage
import { LoginItemManager } from './login-item-manager';

const manager = new LoginItemManager();

// Enable auto-start
await manager.enable({
  applicationPath: '/path/to/daemon',
  label: 'com.mybot.daemon'
});

// Disable auto-start
await manager.disable('com.mybot.daemon');

// Check status
const status = await manager.getStatus('com.mybot.daemon');
```

### 2. State Machine

Location: `packages/agent-core/src/daemon/login-item-state.ts`

```typescript
// State transitions
import { LoginItemStateMachine } from './login-item-state';

const stateMachine = new LoginItemStateMachine();

// Transition to Enabled
await stateMachine.transition('login-item-id', 'Enabled');

// Transition to Error on failure
await stateMachine.transition('login-item-id', 'Error', {
  errorCode: 'PERMISSION_DENIED',
  errorMessage: 'User denied login item permission'
});
```

### 3. Logging

Location: `packages/agent-core/src/daemon/login-item-logger.ts`

```typescript
// Log events
import { LoginItemLogger } from './login-item-logger';

const logger = new LoginItemLogger();

// Log successful registration
await logger.logRegistration('login-item-id', 'success');

// Log failure
await logger.logRegistration('login-item-id', 'failure', {
  errorCode: 'SYSTEM_ERROR',
  details: 'Failed to register with Service Management'
});
```

## Testing

### Unit Tests

Location: `tests/unit/daemon/`

```bash
# Run specific test file
pnpm test:unit -- login-item-manager.test.ts

# Run all daemon tests
pnpm test:unit -- daemon/
```

### Integration Tests

Location: `tests/integration/daemon/`

```bash
# Run integration tests
pnpm test:integration -- auto-start-integration.test.ts
```

## Common Patterns

### 1. Accomplish Defaults Pattern

```typescript
// Primary approach
const isEnabled = await checkAccomplishDefaults();
if (isEnabled) {
  await registerWithAccomplishDefaults();
} else {
  // Fallback
  await registerWithServiceManagement();
}
```

### 2. Error Handling

```typescript
try {
  await registerLoginItem();
} catch (error) {
  // Retry once
  try {
    await registerLoginItem();
  } catch (retryError) {
    // Show manual setup instructions
    await showManualSetupInstructions();
  }
}
```

### 3. State Synchronization

```typescript
// On app launch
const systemState = await querySystemState();
const storedState = await getStoredState();

if (systemState !== storedState) {
  await updateStoredState(systemState);
  await updateUI(systemState);
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: User must approve login item in System Preferences
2. **Path Not Found**: Daemon binary path has changed, update registration
3. **State Mismatch**: External changes via System Preferences, sync on next launch

### Debug Logging

Enable debug logging to see detailed login item operations:

```bash
# Set debug environment variable
export DEBUG=login-item:*

# Run application
pnpm start
```

## Next Steps

1. Review the data model in `data-model.md`
2. Check the research findings in `research.md`
3. Examine the contracts in `contracts/`
4. Start implementing tasks in `tasks.md`
