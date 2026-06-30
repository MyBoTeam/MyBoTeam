# Quickstart: M3.4 Login Item Auto-Start

## Overview

This feature enables the daemon to automatically start on macOS login using MyBoTeam defaults as the primary approach, with Service Management framework as fallback.

## Key Concepts

1. **MyBoTeam Defaults**: Primary approach for login item management
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

### 1. Auto-Start Service (Recommended)

Location: `packages/agent-core/src/services/auto-start-service.ts`

```typescript
// Example usage
import { AutoStartService } from './services/auto-start-service';

const service = new AutoStartService();

// Enable auto-start
await service.enable({
  applicationPath: '/path/to/daemon',
  label: 'com.mybot.daemon'
});

// Disable auto-start
await service.disable('com.mybot.daemon');

// Check status
const status = await service.getStatus('com.mybot.daemon');

// Sync with system state
const syncedStatus = await service.syncWithSystem('com.mybot.daemon');
```

### 2. Login Item Manager (Lower Level)

Location: `packages/agent-core/src/daemon/login-item-manager.ts`

```typescript
// Example usage
import { LoginItemManager } from './daemon/login-item-manager';

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

// Detect reinstallation
const reinstalled = manager.detectReinstallation('com.mybot.daemon', '/new/path/daemon');

// Update path after reinstallation
await manager.updatePath('com.mybot.daemon', '/new/path/daemon');
```

### 3. State Machine

Location: `packages/agent-core/src/daemon/login-item-state.ts`

```typescript
// State transitions
import { LoginItemStateMachine } from './daemon/login-item-state';

const stateMachine = new LoginItemStateMachine();

// Check current state
const currentState = stateMachine.getCurrentState();

// Transition to new state
stateMachine.transition('Enabled');

// Force transition (for error recovery)
stateMachine.forceTransition('Error');

// Get state history
const history = stateMachine.getStateHistory();
```

### 4. Logging

Location: `packages/agent-core/src/daemon/login-item-logger.ts`

```typescript
// Log events
import { LoginItemLogger } from './daemon/login-item-logger';

const logger = new LoginItemLogger();

// Log successful registration
logger.logRegistration({
  label: 'com.mybot.daemon',
  method: 'MyBoTeamDefaults',
  success: true,
  durationMs: 150
});

// Log failure
logger.logRegistration({
  label: 'com.mybot.daemon',
  method: 'MyBoTeamDefaults',
  success: false,
  errorCode: 'SYSTEM_ERROR',
  errorMessage: 'Failed to register with Service Management'
});

// Get logs
const logs = logger.getLogs();
const labelLogs = logger.getLogsByLabel('com.mybot.daemon');
```

### 5. Validation

Location: `packages/agent-core/src/daemon/login-item-validator.ts`

```typescript
// Validate inputs
import { validatePath, validateLabel } from './daemon/login-item-validator';

// Validate application path
const pathResult = validatePath('/usr/local/bin/daemon');
if (!pathResult.valid) {
  console.error(pathResult.error);
}

// Validate login item label
const labelResult = validateLabel('com.mybot.daemon');
if (!labelResult.valid) {
  console.error(labelResult.error);
}
```

### 6. System Query (macOS)

Location: `packages/agent-core/src/daemon/login-item-system-query.ts`

```typescript
// Query macOS for login item registration state
import { querySystemLoginItem, buildStatusFromSystemQuery } from './daemon/login-item-system-query';

// Query system state
const result = await querySystemLoginItem('com.mybot.daemon');
console.log('Registered:', result.registered);
console.log('Method:', result.method);

// Build status from query
const status = buildStatusFromSystemQuery(result, localEnabled);
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
pnpm test:integration -- auto-start-enable.test.ts
```

## Common Patterns

### 1. MyBoTeam Defaults Pattern

```typescript
// Primary approach
const isEnabled = await checkMyBoTeamDefaults();
if (isEnabled) {
  await registerWithMyBoTeamDefaults();
} else {
  // Fallback
  await registerWithServiceManagement();
}
```

### 2. Error Handling with Retry

```typescript
import { RetryHandler } from './daemon/login-item-errors';

const retryHandler = new RetryHandler(1, 1000); // 1 retry, 1 second delay

try {
  await retryHandler.execute(async () => {
    await registerLoginItem();
  });
} catch (error) {
  // Show manual setup instructions
  console.log(error.toUserMessage());
  console.log(error.getManualSetupInstructions());
}
```

### 3. State Synchronization

```typescript
// On app launch
const systemState = await service.syncWithSystem('com.mybot.daemon');
const storedState = await service.getStatus('com.mybot.daemon');

if (systemState.enabled !== storedState.enabled) {
  // Update UI to reflect system state
  updateUI(systemState);
}
```

### 4. Reinstallation Detection

```typescript
// Check if application has been reinstalled
const currentPath = '/new/path/to/daemon';
if (manager.detectReinstallation('com.mybot.daemon', currentPath)) {
  // Update registration with new path
  await manager.updatePath('com.mybot.daemon', currentPath);
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: User must approve login item in System Preferences
2. **Path Not Found**: Daemon binary path has changed, update registration
3. **State Mismatch**: External changes via System Preferences, sync on next launch
4. **Duplicate Registration**: Check if login item is already registered

### Debug Logging

Enable debug logging to see detailed login item operations:

```typescript
const logger = new LoginItemLogger(true); // Enable console logging
const service = new AutoStartService();
// All operations will be logged to console
```

## API Reference

### Types

- `LoginItemState`: Disabled, Enabled, Error
- `AutoStartMethod`: MyBoTeamDefaults, ServiceManagement
- `LoginItemErrorCode`: REGISTRATION_FAILED, UNREGISTRATION_FAILED, etc.

### Interfaces

- `EnableOptions`: Options for enabling auto-start
- `RegistrationResult`: Result of registration operation
- `UnregistrationResult`: Result of unregistration operation
- `LoginItemStatus`: Current status of login item

## Next Steps

1. Review the data model in `data-model.md`
2. Check the research findings in `research.md`
3. Examine the contracts in `contracts/`
4. Review the implementation in `packages/agent-core/src/daemon/`
