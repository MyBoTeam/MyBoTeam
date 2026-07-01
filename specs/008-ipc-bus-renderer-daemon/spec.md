# Feature Specification: IPC Bus Renderer Daemon

**Feature Branch**: `008-ipc-bus-renderer-daemon`

**Created**: 2026-06-30

**Status**: Complete

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-151/m3-5-ipc-bus-renderer-daemon don't forget to check source reference"

**Goal**: Implement IPC bus for communication between renderer and daemon, establishing a 4-link chain (React → preload → main → daemon) with typed API exposure and event forwarding.

**Success Criteria**:
- contextBridge exposes typed API to renderer
- 4-link chain: React → preload → main → daemon
- Renderer has zero Node.js/filesystem access
- Event forwarding (daemon → main → renderer)
- Contract tests for IPC methods

**Constraints**:
- Blocked by M3-1, M11-1
- Must follow v0.3.0 preload handler pattern (source reference)
- Must ensure renderer has zero Node.js/filesystem access (see data-model.md for detailed constraints)

## Source Reference Analysis *(mandatory)*

> Per Constitution Principle VII and FR-010. Detailed analysis in [plan.md Source Reference Analysis](plan.md#source-reference-analysis-mandatory).

**Referenced Versions**: v0.3.0
**Key Patterns Adopted**: JSON-RPC 2.0 over Unix sockets, DaemonTransport interface, contextBridge.exposeInMainWorld(), ipcMain.handle()/ipcRenderer.invoke(), typed RPC calls with timeout, reconnection with exponential backoff, PID lock file, safeHandler() wrapper, notification forwarding.
**Patterns NOT Adopted**: Node.js/filesystem access in renderer, direct daemon communication from renderer, in-process transport, IPC envelope wrapper.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rendering Request via IPC Bus (Priority: P1)

As a renderer, I want to send rendering requests to the daemon via IPC bus and receive rendered output, so that I can offload rendering tasks to a specialized service.

**Why this priority**: This is the core functionality of the daemon; without it, the daemon provides no value.

**Independent Test**: Can be fully tested by sending a mock rendering request via IPC and verifying the daemon returns a rendered result.

**Acceptance Scenarios**:

1. **Given** the daemon is running and listening on IPC bus, **When** a renderer sends a valid rendering request with document data, **Then** the daemon processes the request and returns the rendered output (e.g., PDF, image) within 500ms (per SC-004).
2. **Given** the daemon is running, **When** a renderer sends a malformed request, **Then** the daemon returns a clear error response and continues operating.
3. **Given** the daemon is running, **When** a renderer disconnects mid-request, **Then** the daemon cleans up resources and remains ready for new requests.

---

### User Story 2 - Daemon Lifecycle Management (Priority: P2)

As a system administrator, I want the daemon to start automatically on system boot and shut down gracefully on termination signals, ensuring reliable operation without manual intervention.

**Why this priority**: Reliable lifecycle management is critical for production deployment and prevents resource leaks.

**Independent Test**: Can be tested by starting the daemon, sending a termination signal, and verifying it shuts down within 1 second without hanging.

**Acceptance Scenarios**:

1. **Given** the daemon is configured to start on boot, **When** the system boots, **Then** the daemon starts automatically and begins listening on IPC bus.
2. **Given** the daemon is running, **When** a termination signal is received, **Then** the daemon immediately destroys all client sockets and exits cleanly within 1 second.
3. **Given** the daemon is shutting down, **When** there are pending rendering requests, **Then** the daemon abandons pending writes and closes immediately (no graceful close).

---

### User Story 3 - Plugin Extensibility (Priority: P3)

As a developer, I want to extend the daemon with new rendering plugins (e.g., Markdown, HTML) without modifying core code, enabling rapid feature additions.

**Why this priority**: Extensibility reduces maintenance overhead and allows independent development of rendering capabilities.

**Independent Test**: Can be tested by adding a simple plugin that renders plain text and verifying it works via IPC request.

**Acceptance Scenarios**:

1. **Given** the daemon is running, **When** a new rendering plugin is registered, **Then** the daemon accepts requests for the new renderer type.
2. **Given** a plugin fails to load, **When** the daemon starts, **Then** the daemon logs the error and continues with available plugins.
3. **Given** multiple plugins are loaded, **When** a request specifies a renderer type, **Then** the daemon routes to the appropriate plugin.

---

### Edge Cases

- What happens when the IPC bus connection is lost mid-request? → **Resolved by FR-011**: Daemon returns error to renderer and cleans up.
- How does the daemon handle a plugin that crashes during rendering? → **Resolved by FR-012**: Daemon isolates crash via try/catch, returns error, and remains operational.
- What happens when the daemon receives a request while shutting down? → **Resolved by FR-005**: Daemon rejects new requests with a shutdown error.
- How does the daemon handle extremely large rendering requests? → **Resolved by FR-008**: Daemon enforces 1 MiB size limit and rejects oversized requests.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** *(T004, T005, T006)*: System MUST accept rendering requests via IPC bus (Unix socket transport) using JSON-RPC 2.0 protocol.
- **FR-002** *(T015, T035)*: System MUST support at least one rendering plugin out of the box.
- **FR-003** *(T015, T016)*: System MUST route requests to the appropriate rendering plugin based on request type.
- **FR-004** *(T016, T017)*: System MUST return rendered output or error response to the renderer.
- **FR-005** *(T024, T025, T026)*: System MUST clean up resources immediately on shutdown and reject new requests with a shutdown error.
- **FR-006** *(T027)*: System MUST start automatically on system boot via platform-specific mechanisms (launchd for macOS, systemd for Linux, Windows Service for Windows).
- **FR-007** *(T009, T010)*: System MUST provide structured logs in JSON format using pino with levels (trace, debug, info, warn, error, fatal) and metrics for request counts and latency (request_duration_ms, request_count, error_count).
- **FR-008** *(T017)*: System MUST enforce request size limits (1 MiB / 1,048,576 bytes maximum) to prevent oversized requests.
- **FR-009** *(T014, T015, T031-T033)*: System MUST be extensible via plugins that can be registered at runtime.
- **FR-010** *(plan.md)*: System MUST include a "Source Reference Analysis" section in its plan.md per Constitution Principle VII.
- **FR-011** *(T017)*: System MUST return error to renderer and clean up when IPC bus connection is lost mid-request.
- **FR-012** *(T032)*: System MUST isolate plugin crashes via try/catch with error wrapping, return error to renderer, and remain operational.

### Key Entities

- **Rendering Request**: A request containing document data, renderer type, and options.
- **Rendering Plugin**: A module that implements a specific rendering algorithm (e.g., PDF, image).
- **IPC Bus**: The inter-process communication channel (Unix socket transport) used for renderer-daemon communication.
- **Daemon**: The long-running process that manages rendering requests and plugins.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** *(T044)*: Daemon starts and begins listening within 1 second (p99) of system boot.
- **SC-002** *(T022)*: Daemon shuts down within 1 second (p99) of receiving a termination signal.
- **SC-003** *(T042)*: Daemon can process at least 100 concurrent rendering requests with response times remaining <500ms for 99% of requests.
- **SC-004** *(T043)*: 99% of valid rendering requests complete within 500ms (for documents up to 10 pages or 1 MiB).
- **SC-005** *(T032)*: Daemon remains operational after a plugin crash (no full restart required).
- **SC-006** *(T031, T035)*: New rendering plugins can be added without modifying core daemon code.
- **SC-007** *(post-launch)*: Daemon maintains 99.9% uptime when system load is below 80% and no hardware failures occur. *(Post-launch metric — monitored via deployment observability, not buildable test)*

## Assumptions

- The IPC bus infrastructure (Unix socket transport) is already implemented and available in the system.
- Existing rendering engines (e.g., PDF generation libraries) are available for integration.
- The daemon will run on systems that support inter-process communication mechanisms.
- Source reference analysis from previous versions (v0.2.0, v0.3.0, v0.4.0) will be conducted during planning.
- The daemon does not require authentication (local trust model).
- Rate limiting is not a priority for initial implementation but may be added later.
- Authentication is out-of-scope for this feature.

## Clarifications

### Session 2026-06-30

- Q: What specific IPC protocol should be used for communication between renderer and daemon? → A: JSON-RPC 2.0 over Unix sockets (line-delimited JSON)
- Q: What are the reliability/availability targets for the daemon? → A: 99.9% uptime
- Q: What logging and metrics requirements apply to the daemon? → A: Both structured logs and metrics
- Q: What security threat model applies to the daemon? → A: Local trust only (no external threats)
- Q: What explicit out-of-scope items should be declared for this feature? → A: Authentication only