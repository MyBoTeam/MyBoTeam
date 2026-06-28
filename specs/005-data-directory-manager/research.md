# Research: Data Directory Manager

## Research Questions

### 1. Cross-platform path resolution

**Decision**: Use Node.js built-in `os.homedir()` and `path.join()` for cross-platform path resolution.

**Rationale**: 
- `os.homedir()` returns the home directory on all platforms
- `path.join()` handles path separators correctly on all platforms
- This is the same pattern used in v0.2.0 PathResolver

**Alternatives considered**:
- Manual path construction: Rejected because it's error-prone and platform-specific
- Third-party libraries: Rejected because Node.js built-ins are sufficient

### 2. Directory creation strategy

**Decision**: Use `fs.mkdirSync()` with `{ recursive: true }` option.

**Rationale**:
- Creates parent directories if they don't exist
- Does nothing if directory already exists (idempotent)
- Simple and reliable

**Alternatives considered**:
- Manual directory creation: Rejected because it's more complex and error-prone
- Async operations: Rejected because initialization should be synchronous

### 3. File locking for concurrent access

**Decision**: Use `proper-lockfile` npm package for file locking.

**Rationale**:
- Well-tested solution for file locking in Node.js
- Handles cross-platform differences
- Provides timeout and retry mechanisms

**Alternatives considered**:
- Manual lock files: Rejected because it's error-prone and platform-specific
- No locking: Rejected because concurrent access could cause data corruption

### 4. Error handling strategy

**Decision**: Fail fast with descriptive error messages.

**Rationale**:
- Matches user clarification from spec
- Prevents partial initialization
- Makes debugging easier

**Alternatives considered**:
- Fallback to defaults: Rejected because it could hide permission issues
- Retry logic: Rejected because permission issues won't resolve themselves

### 5. Logging strategy

**Decision**: Use structured logging with `console.log()` for now, with option to add file logging later.

**Rationale**:
- Matches user clarification from spec (log creation events)
- Simple and visible in development
- Can be extended to file logging later

**Alternatives considered**:
- File-only logging: Rejected because it's harder to debug during development
- Third-party logging library: Rejected because it's overkill for this feature

## Source Code Analysis

### v0.2.0 PathResolver Pattern

The existing PathResolver in v0.2.0 provides:
- `getDataDir()`: Returns data directory path (default: `~/.myboteam/` or `MYBOTEAM_DATA_DIR`)
- `getSocketPath()`: Returns socket path (Unix socket or named pipe on Windows)
- `getSkillsDir()`: Returns skills directory path
- `getPidFilePath()`: Returns PID file path

**Key observations**:
- Uses `process.env.MYBOTEAM_DATA_DIR ?? join(homedir(), '.myboteam')` for path resolution
- Handles Windows named pipes with hash-based path
- Simple class structure with no directory creation

**Extension plan**:
- Add `ensureDirectories()` method to create subdirectories
- Add file locking for concurrent access
- Add logging for directory operations
- Keep the same API surface for backward compatibility

## Technology Choices

### Node.js Built-in Modules

- `fs`: File system operations (mkdirSync, rmSync, existsSync)
- `path`: Path manipulation (join, resolve)
- `os`: OS information (homedir, platform)
- `crypto`: Hash generation for Windows named pipes

### Testing Framework

- Vitest: Already used in the project
- Node.js `assert`: For simple assertions
- `fs` operations in tests: To verify directory creation

## Risk Assessment

### Low Risk
- Directory creation: Well-understood, simple operations
- Path resolution: Standard Node.js patterns
- Logging: Simple console output

### Medium Risk
- Cross-platform compatibility: Requires testing on all platforms
- File locking: Edge cases with concurrent access

### High Risk
- None identified for this feature

## Dependencies

### External Dependencies
- `proper-lockfile`: File locking (if used)

### Internal Dependencies
- Existing PathResolver pattern from v0.2.0
- Test framework (Vitest)
- Build system (pnpm)

## Validation Approach

### Unit Tests
- Test path resolution on different platforms (mocked)
- Test directory creation logic
- Test error handling scenarios
- Test file locking behavior

### Integration Tests
- Test actual directory creation on filesystem
- Test clean command behavior
- Test concurrent access scenarios

### Manual Testing
- Test on Windows, macOS, and Linux
- Test with different permissions
- Test with symlinks
- Test with special characters in paths
