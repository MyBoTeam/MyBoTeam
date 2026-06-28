# Contract: PathResolver Interface

## Overview

This contract defines the public interface for the PathResolver module, which provides path resolution for the data directory and its subdirectories.

## Interface

### PathResolver

```typescript
interface PathResolver {
  /**
   * Get the data directory path.
   * @returns The resolved data directory path
   */
  getDataDir(): string;

  /**
   * Get the socket path for daemon communication.
   * @param dataDir - Optional data directory path (uses default if not provided)
   * @returns The resolved socket path
   */
  getSocketPath(dataDir?: string): string;

  /**
   * Get the skills directory path.
   * @param dataDir - Optional data directory path (uses default if not provided)
   * @returns The resolved skills directory path
   */
  getSkillsDir(dataDir?: string): string;

  /**
   * Get the PID file path.
   * @param dataDir - Optional data directory path (uses default if not provided)
   * @returns The resolved PID file path
   */
  getPidFilePath(dataDir?: string): string;
}
```

## Contract Tests

### Test: getDataDir() returns valid path

**Input**: None
**Expected Output**: 
- Returns a non-empty string
- Path is valid for the current platform
- Path ends with `.myboteam` or custom directory name

### Test: getDataDir() respects MYBOTEAM_DATA_DIR

**Input**: `MYBOTEAM_DATA_DIR=/custom/path`
**Expected Output**:
- Returns `/custom/path`

### Test: getSocketPath() returns valid path

**Input**: None
**Expected Output**:
- On Unix: Returns path ending with `daemon.sock`
- On Windows: Returns named pipe path starting with `\\.\pipe\myboteam-daemon-`

### Test: getSkillsDir() returns valid path

**Input**: None
**Expected Output**:
- Returns path ending with `skills`

### Test: getPidFilePath() returns valid path

**Input**: None
**Expected Output**:
- Returns path ending with `daemon.pid`

## Error Cases

### Error: Invalid MYBOTEAM_DATA_DIR

**Input**: `MYBOTEAM_DATA_DIR=`
**Expected Behavior**: Throws error with descriptive message

### Error: Permission denied

**Input**: `MYBOTEAM_DATA_DIR=/root/protected`
**Expected Behavior**: Throws error with descriptive message

## Edge Cases

### Edge Case: Symlink in path

**Input**: Data directory path contains symlink
**Expected Behavior**: Follows symlink and resolves to actual path

### Edge Case: Special characters in path

**Input**: `MYBOTEAM_DATA_DIR=/path with spaces/and-dashes`
**Expected Behavior**: Handles path correctly
