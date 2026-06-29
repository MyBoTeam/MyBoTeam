# Research: M3.4 Login Item Auto-Start

## Phase 0: Research Findings

### 1. Accomplish Defaults Pattern

**Decision**: Use Accomplish defaults as primary approach for login item management.

**Rationale**: 
- Accomplish project provides proven patterns for daemon management
- Existing codebase already follows Accomplish conventions
- Reduces implementation risk by leveraging tested patterns

**Alternatives Considered**:
- Native macOS Service Management framework only (rejected: Accomplish defaults provide better cross-version compatibility)
- LaunchAgent plist approach (rejected: more complex installation and maintenance)

### 2. macOS Login Item Implementation

**Decision**: Use Accomplish defaults pattern with Service Management framework fallback.

**Rationale**:
- Accomplish defaults handle version differences automatically
- Service Management framework provides modern API for macOS 13+
- Fallback ensures compatibility with older macOS versions

**Implementation Pattern** (from Accomplish reference):
```typescript
// Primary: Accomplish defaults
const loginItemEnabled = await checkAccomplishDefaults();
if (loginItemEnabled) {
  await registerWithAccomplishDefaults();
} else {
  // Fallback: Service Management framework
  await registerWithServiceManagement();
}
```

### 3. State Management

**Decision**: Three-state model (Disabled, Enabled, Error) with Accomplish defaults.

**Rationale**:
- Accomplish defaults define standard state transitions
- Error state allows graceful degradation
- Clear state machine simplifies debugging

**State Transitions**:
- Disabled → Enabled: User enables auto-start
- Enabled → Disabled: User disables auto-start
- Any → Error: Registration failure occurs
- Error → Disabled: Manual reset or retry success

### 4. Logging Strategy

**Decision**: Log registration success/failure with timestamps and error codes.

**Rationale**:
- Sufficient for debugging without excessive overhead
- Error codes enable automated monitoring
- Timestamps help correlate with system events

**Implementation**:
```typescript
interface LoginItemLogEntry {
  timestamp: string;
  event: 'register' | 'unregister' | 'check' | 'error';
  status: 'success' | 'failure';
  errorCode?: string;
  details?: string;
}
```

### 5. Error Handling

**Decision**: Accomplish defaults as primary, retry once then show error message.

**Rationale**:
- Accomplish defaults handle most error scenarios
- Single retry balances reliability with user experience
- Manual setup instructions provide escape hatch

**Error Scenarios**:
- Permission denied: Show System Preferences instructions
- System error: Retry once, then show generic error
- Path not found: Update path and retry registration

### 6. External State Synchronization

**Decision**: Query system state on app launch and sync.

**Rationale**:
- Ensures UI accurately reflects actual login item status
- Handles external changes via System Preferences
- Provides consistent user experience

**Implementation**:
- On app launch: Query macOS for current login item state
- Compare with stored preference
- Update UI and internal state if mismatch detected

## Research Summary

| Area | Decision | Confidence |
|------|----------|------------|
| Primary Approach | Accomplish defaults | High |
| Fallback | Service Management framework | High |
| State Model | Three states (Disabled/Enabled/Error) | High |
| Logging | Success/failure with timestamps and error codes | High |
| Error Handling | Accomplish defaults + retry + manual instructions | High |
| External Sync | Query on app launch | Medium |

## Open Questions

None. All technical decisions have been resolved using Accomplish defaults as primary approach with Service Management framework as fallback.
