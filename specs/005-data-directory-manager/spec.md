# Feature Specification: Data Directory Manager

**Feature Branch**: `005-data-directory-manager`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-146/m2-5-data-directory-manager"

## Mission Brief

**Goal**: Implement a data directory manager that resolves and creates the data directory with standard subdirectories (data/, logs/, vault/) at ~/.myboteam/ or a custom location via MYBOTEAM_DATA_DIR environment variable.

**Success Criteria**:
- Default data dir at ~/.myboteam/
- Configurable via MYBOTEAM_DATA_DIR env
- Subdirs created on first run
- Cross-platform path resolution
- `pnpm dev:clean` deletes entire data directory

**Constraints**:
- Must work on Windows, macOS, and Linux
- Source reference from v0.2.0 PathResolver

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize Data Directory (Priority: P1)

As a user running MyBoteam for the first time, I want the system to automatically create a data directory at `~/.myboteam/` with standard subdirectories so that I don't need to manually set up the file structure.

**Why this priority**: This is the foundation for all data storage operations. Without a properly initialized data directory, no other features can function.

**Independent Test**: Can be fully tested by running the application for the first time and verifying the directory structure is created correctly.

**Acceptance Scenarios**:

1. **Given** no existing data directory, **When** the application starts, **Then** `~/.myboteam/` directory is created with `data/`, `logs/`, and `vault/` subdirectories
2. **Given** the `~/.myboteam/` directory already exists, **When** the application starts, **Then** the directory is not recreated and existing contents are preserved
3. **Given** the `~/.myboteam/data/` subdirectory already exists, **When** the application starts, **Then** the subdirectory is not recreated

---

### User Story 2 - Configure Custom Data Directory (Priority: P2)

As a user with specific storage requirements, I want to configure a custom data directory location via the `MYBOTEAM_DATA_DIR` environment variable so that I can store data in a location of my choice.

**Why this priority**: This provides flexibility for users who need to store data in specific locations (e.g., cloud storage, encrypted volumes, or custom paths).

**Independent Test**: Can be tested by setting the `MYBOTEAM_DATA_DIR` environment variable and verifying the application uses the custom path.

**Acceptance Scenarios**:

1. **Given** `MYBOTEAM_DATA_DIR` is set to `/custom/path`, **When** the application starts, **Then** data directory is created at `/custom/path/`
2. **Given** `MYBOTEAM_DATA_DIR` is set to a relative path, **When** the application starts, **Then** the path is resolved relative to the current working directory
3. **Given** `MYBOTEAM_DATA_DIR` is set to a path with insufficient permissions, **When** the application starts, **Then** an appropriate error message is displayed

---

### User Story 3 - Cross-Platform Path Resolution (Priority: P3)

As a user on Windows, macOS, or Linux, I want the data directory to be created at the appropriate location for my operating system so that the application works consistently across platforms.

**Why this priority**: This ensures the application works correctly on all supported platforms without requiring platform-specific configuration.

**Independent Test**: Can be tested by running the application on different operating systems and verifying the correct default path is used.

**Acceptance Scenarios**:

1. **Given** the application runs on macOS, **When** the data directory is resolved, **Then** the path is `~/.myboteam/`
2. **Given** the application runs on Linux, **When** the data directory is resolved, **Then** the path is `~/.myboteam/`
3. **Given** the application runs on Windows, **When** the data directory is resolved, **Then** the path is `%USERPROFILE%\.myboteam\`
4. **Given** the application runs on Windows, **When** the socket path is resolved, **Then** a named pipe path is used instead of a Unix socket

---

### User Story 4 - Clean Data Directory (Priority: P4)

As a developer, I want the `pnpm dev:clean` command to delete the entire data directory so that I can reset the application state during development.

**Why this priority**: This is essential for development workflows but not critical for production use.

**Independent Test**: Can be tested by running `pnpm dev:clean` and verifying the data directory is completely removed.

**Acceptance Scenarios**:

1. **Given** the data directory exists at `~/.myboteam/`, **When** `pnpm dev:clean` is executed, **Then** the entire `~/.myboteam/` directory is removed
2. **Given** the data directory exists at a custom location, **When** `pnpm dev:clean` is executed, **Then** the entire custom directory is removed
3. **Given** the data directory does not exist, **When** `pnpm dev:clean` is executed, **Then** the command completes without error

---

### Edge Cases

- What happens when the data directory is a symlink? → Follow the symlink and create subdirectories at the target location
- What happens when the data directory is on a read-only filesystem? → Fail fast with error message and exit
- What happens when the disk is full during directory creation? → Fail fast with error message and exit
- What happens when the user has insufficient permissions to create the directory? → Fail fast with error message and exit
- What happens when the data directory path contains special characters? → Handle paths with special characters correctly across platforms

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST resolve the data directory path using `~/.myboteam/` as the default location
- **FR-002**: System MUST support custom data directory paths via the `MYBOTEAM_DATA_DIR` environment variable
- **FR-003**: System MUST create the data directory and required subdirectories (`data/`, `logs/`, `vault/`) on first run
- **FR-004**: System MUST NOT recreate existing directories or subdirectories
- **FR-005**: System MUST resolve paths correctly on Windows, macOS, and Linux
- **FR-006**: System MUST use named pipes for socket paths on Windows
- **FR-007**: System MUST provide clear error messages when directory creation fails due to permissions or other issues
- **FR-008**: System MUST support the `pnpm dev:clean` command to remove the entire data directory
- **FR-009**: System MUST log directory creation events and path resolution operations
- **FR-010**: System MUST use file locks to prevent concurrent directory modifications

### Key Entities

- **Data Directory**: The root directory where all MyBoteam data is stored (default: `~/.myboteam/`)
- **Subdirectories**: Standard directories within the data directory:
  - `data/`: Application data storage
  - `logs/`: Application logs
  - `vault/`: Secure storage for sensitive data

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Application creates data directory with subdirectories within 2 seconds on first run (aspirational target; actual time depends on filesystem and platform)
- **SC-002**: Application correctly resolves data directory path on Windows, macOS, and Linux
- **SC-003**: Application handles custom data directory paths without errors
- **SC-004**: `pnpm dev:clean` command removes the entire data directory within 2 seconds
- **SC-005**: Application provides clear error messages for permission denied scenarios

## Clarifications

### Session 2026-06-27

- Q: What security measures should be applied to protect sensitive data in the vault directory? → A: Vault security is handled by MAO-144 (Encrypted secrets vault AES-256-GCM) - the data directory manager only creates the directory structure.
- Q: Should the data directory manager log initialization events (directory creation, path resolution) or only log errors? → A: Log creation events.
- Q: When the data directory cannot be created (e.g., permission denied, disk full), what should the system do? → A: Fail fast with error message and exit.
- Q: The spec assumes no concurrent access, but what if multiple MyBoteam instances start simultaneously? Should the directory manager handle this case? → A: Use file locks to prevent concurrent modifications.
- Q: Should we add an explicit 'Out of Scope' section to clarify what this feature does NOT cover (e.g., data migration, backup/restore)? → A: Keep implicit scope from requirements.

## Assumptions

- Users have write permissions to their home directory or the custom data directory location
- The application runs on Windows, macOS, or Linux
- The `pnpm dev:clean` command is only used during development
- The data directory does not need to be shared between multiple users
