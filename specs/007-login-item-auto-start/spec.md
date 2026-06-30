# Feature Specification: M3.4 Login Item Auto-Start

**Feature Branch**: `007-login-item-auto-start`

**Created**: 2026-06-29

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-150/m3-4-login-item-auto-start use MyBoTeam defaults"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enable Auto-Start on Login (Priority: P1)

As a user, I want the daemon to automatically start when I log in to macOS, so I don't have to manually start it each time.

**Why this priority**: This is the core functionality — without auto-start, users must manually launch the daemon after every login, which is a poor user experience and defeats the purpose of a background service.

**Independent Test**: Can be fully tested by enabling the login item setting and verifying the daemon starts automatically on next login. Delivers reliable background service availability.

**Acceptance Scenarios**:

1. **Given** the user has the application installed, **When** the user enables auto-start in settings, **Then** the system registers the daemon as a login item
2. **Given** the daemon is registered as a login item, **When** the user logs out and logs back in, **Then** the daemon starts automatically within 5 seconds of login completion
3. **Given** the daemon is registered as a login item, **When** macOS starts up and the user logs in, **Then** the daemon starts automatically without user intervention

---

### User Story 2 - Disable Auto-Start on Login (Priority: P2)

As a user, I want to disable auto-start when I no longer want the daemon to run automatically, so I can control when the service is active.

**Why this priority**: Users need to be able to opt out of auto-start for troubleshooting, resource management, or privacy reasons.

**Independent Test**: Can be tested by disabling the login item setting and verifying the daemon does not start on next login.

**Acceptance Scenarios**:

1. **Given** the daemon is registered as a login item, **When** the user disables auto-start in settings, **Then** the system removes the daemon from login items
2. **Given** auto-start is disabled, **When** the user logs out and logs back in, **Then** the daemon does not start automatically
3. **Given** the daemon is running, **When** auto-start is disabled, **Then** the currently running daemon continues until explicitly stopped

---

### User Story 3 - Check Auto-Start Status (Priority: P3)

As a user, I want to see whether auto-start is currently enabled, so I can verify my configuration.

**Why this priority**: Provides visibility into the current state, which is important for troubleshooting and user confidence.

**Independent Test**: Can be tested by checking the settings UI or system preferences to confirm the displayed status matches the actual login item registration.

**Acceptance Scenarios**:

1. **Given** auto-start is enabled, **When** the user views the settings, **Then** the status shows "Auto-start enabled"
2. **Given** auto-start is disabled, **When** the user views the settings, **Then** the status shows "Auto-start disabled"
3. **Given** the login item registration state changes externally (e.g., via System Preferences), **When** the user views the settings, **Then** the displayed status reflects the actual state

---

### Edge Cases

- What happens if the user reinstalls the application? The login item should be re-registered automatically on first launch (handled by T014/T015: enable() checks existing registration and re-registers if path changed or registration missing)
- What happens if macOS permissions are revoked for login items? The system should gracefully handle the failure and notify the user (handled by T007, T035, T038: error codes and retry logic)
- What happens if the daemon binary path changes after an update? The login item should be updated to point to the new path (handled by T037, T040: path update logic)
- What happens if multiple instances attempt to register the same login item? Only one registration should exist; duplicates should be prevented (handled by T036, T039: duplicate prevention)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST register the daemon as a macOS login item when auto-start is enabled
- **FR-002**: System MUST remove the daemon from macOS login items when auto-start is disabled
- **FR-003**: System MUST persist the auto-start preference across application restarts
- **FR-004**: System MUST start the daemon automatically within 5 seconds of user login (measurement: time from macOS login completion to daemon process start, excluding system startup time)
- **FR-005**: System MUST query the current login item registration state on application launch using `sfltool dumpbtm` (macOS 13+) with `osascript` fallback, and sync local state with any external changes detected
- **FR-006**: System MUST handle macOS permission dialogs gracefully using MyBoTeam defaults as primary approach, with Service Management framework as fallback (permission acquisition phase)
- **FR-007**: System MUST update the login item path if the application is relocated or updated
- **FR-008**: System MUST prevent duplicate login item registrations
- **FR-009**: System MUST provide clear status indication of auto-start state to the user
- **FR-010**: System MUST log registration success/failure events with timestamps and error codes for debugging and monitoring
- **FR-011**: System MUST handle registration failures (post-permission) using MyBoTeam defaults as primary, with fallback to retry once then show user-friendly error message with manual setup instructions (error recovery phase, distinct from FR-006 permission acquisition)

### Key Entities

- **LoginItem**: Represents a macOS login item registration with properties: application path, enabled state (Disabled/Enabled/Error), label, last updated timestamp
- **AutoStartPreference**: User preference for whether the daemon should auto-start on login
- **LoginItemState**: Valid states (using MyBoTeam defaults as primary, fallback to three states: Disabled, Enabled, Error) with allowed transitions: Disabled→Enabled, Enabled→Disabled, any state→Error on failure

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can enable auto-start with a single action (toggle switch in settings UI)
- **SC-002**: Daemon starts automatically within 5 seconds of user login on 100% of macOS versions 13+
- **SC-003**: Auto-start state persists correctly across 100% of application restarts
- **SC-004**: Users can verify auto-start status in settings with 100% accuracy
- **SC-005**: Login item registration succeeds on first attempt for 95% of fresh installations (fresh installation = clean install without previous login item registration)

## Assumptions

- Target platform is macOS 13.4 (Ventura) or later for full `sfltool dumpbtm` support
- Users have administrative privileges to modify login items (or the application uses the Service Management framework which handles permissions)
- The daemon binary path remains stable within a major version
- The application uses MyBoTeam defaults for overlapping fields (as specified in the user request)
- macOS login item APIs (Service Management framework or LaunchAgent) are available and functional
- The daemon process name and bundle identifier are consistent across installations

## Clarifications

### Session 2026-06-29

- Q: What specific macOS permissions are required for login item registration, and how should the application request them? → A: Use MyBoTeam defaults as primary approach, Service Management framework as fallback
- Q: What logging and observability should be implemented for login item registration events? → A: Log registration success/failure with timestamps and error codes
- Q: What should happen if login item registration fails (e.g., permission denied, system error)? → A: Use MyBoTeam defaults as primary, retry once then show error message with manual setup instructions as fallback
- Q: What are the valid states for a login item, and what transitions are allowed? → A: Use MyBoTeam defaults as primary, three states (Disabled, Enabled, Error) as fallback with transitions: Disabled→Enabled, Enabled→Disabled, any state→Error on failure
- Q: Should the application detect and sync with external changes to the login item (e.g., via System Preferences)? → A: Yes, query system state on app launch and sync with external changes
