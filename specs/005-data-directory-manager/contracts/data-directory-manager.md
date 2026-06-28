# Contract: DataDirectoryManager Interface

## Overview

This contract defines the public interface for the DataDirectoryManager module, which handles creation and management of the data directory and its subdirectories.

## Interface

### DataDirectoryManager

```typescript
interface DataDirectoryManager {
  /**
   * Ensure the data directory and all subdirectories exist.
   * Creates them if they don't exist.
   * @throws Error if directory creation fails
   */
  ensureDirectories(): void;

  /**
   * Remove the entire data directory and all contents.
   * @throws Error if removal fails
   */
  clean(): void;

  /**
   * Check if the data directory exists.
   * @returns true if directory exists, false otherwise
   */
  exists(): boolean;

  /**
   * Get the data directory path.
   * @returns The resolved data directory path
   */
  getDataDir(): string;
}
```

## Contract Tests

### Test: ensureDirectories() creates directory structure

**Input**: None (fresh installation)
**Expected Output**:
- Creates data directory at resolved path
- Creates `data/` subdirectory
- Creates `logs/` subdirectory
- Creates `vault/` subdirectory
- All directories have appropriate permissions

### Test: ensureDirectories() is idempotent

**Input**: None (directory already exists)
**Expected Output**:
- Does not throw error
- Does not modify existing directories
- Returns successfully

### Test: clean() removes directory structure

**Input**: None (directory exists)
**Expected Output**:
- Removes entire data directory recursively
- Removes all subdirectories and files
- Returns successfully

### Test: clean() handles non-existent directory

**Input**: None (directory doesn't exist)
**Expected Output**:
- Does not throw error
- Returns successfully

### Test: exists() returns correct status

**Input**: None
**Expected Output**:
- Returns true if data directory exists
- Returns false if data directory doesn't exist

### Test: getDataDir() returns correct path

**Input**: None
**Expected Output**:
- Returns the resolved data directory path
- Path matches PathResolver.getDataDir()

## Error Cases

### Error: Permission denied on directory creation

**Input**: No write permission to parent directory
**Expected Behavior**:
- Throws error with descriptive message
- Error message includes path and permission details
- Does not create partial directory structure

### Error: Disk full during creation

**Input**: Insufficient disk space
**Expected Behavior**:
- Throws error with descriptive message
- Error message includes disk space details
- Cleans up any partially created directories

### Error: Directory is a file

**Input**: Path exists but is a file, not a directory
**Expected Behavior**:
- Throws error with descriptive message
- Error message indicates path is a file, not a directory

## Edge Cases

### Edge Case: Concurrent access

**Input**: Multiple instances calling ensureDirectories() simultaneously
**Expected Behavior**:
- Uses file locks to prevent concurrent modifications
- First instance creates directories
- Second instance waits for lock and succeeds

### Edge Case: Symlink in path

**Input**: Parent directory is a symlink
**Expected Behavior**:
- Follows symlink
- Creates directories at target location

### Edge Case: Special characters in path

**Input**: Path contains spaces, dashes, or other special characters
**Expected Behavior**:
- Handles path correctly
- Creates directories with correct names

### Edge Case: Read-only filesystem

**Input**: Filesystem is read-only
**Expected Behavior**:
- Throws error with descriptive message
- Error message indicates filesystem is read-only
