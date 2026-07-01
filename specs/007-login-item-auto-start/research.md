# Research: M3.4 Login Item Auto-Start

## Phase 0: Research Findings

### 1. MyBoTeam Defaults Pattern

**Decision**: Use MyBoTeam defaults as primary approach for login item management.

**Rationale**: 
- MyBoTeam project provides proven patterns for daemon management
- Existing codebase already follows MyBoTeam conventions
- Reduces implementation risk by leveraging tested patterns

**Alternatives Considered**:
- Native macOS Service Management framework only (rejected: MyBoTeam defaults provide better cross-version compatibility)
- LaunchAgent plist approach (rejected: more complex installation and maintenance)

### 2. macOS Login Item Implementation

**Decision**: Use MyBoTeam defaults pattern with Service Management framework fallback.

**Rationale**:
- MyBoTeam defaults handle version differences automatically
- Service Management framework provides modern API for macOS 13+
- Fallback ensures compatibility with older macOS versions

**Implementation Pattern** (from MyBoTeam reference):
```typescript
// Primary: MyBoTeam defaults
const loginItemEnabled = await checkMyBoTeamDefaults();
if (loginItemEnabled) {
  await registerWithMyBoTeamDefaults();
} else {
  // Fallback: Service Management framework
  await registerWithServiceManagement();
}
```

### 3. State Management

**Decision**: Three-state model (Disabled, Enabled, Error) with MyBoTeam defaults.

**Rationale**:
- MyBoTeam defaults define standard state transitions
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

**Decision**: MyBoTeam defaults as primary, retry once then show error message.

**Rationale**:
- MyBoTeam defaults handle most error scenarios
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
| Primary Approach | MyBoTeam defaults | High |
| Fallback | Service Management framework | High |
| State Model | Three states (Disabled/Enabled/Error) | High |
| Logging | Success/failure with timestamps and error codes | High |
| Error Handling | MyBoTeam defaults + retry + manual instructions | High |
| External Sync | Query on app launch | Medium |

## Open Questions

None. All technical decisions have been resolved using MyBoTeam defaults as primary approach with Service Management framework as fallback.
