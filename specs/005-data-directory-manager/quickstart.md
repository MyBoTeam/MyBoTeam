# Quickstart: Data Directory Manager

## Overview

This document provides a quick reference for implementing the Data Directory Manager feature.

## Key Files

### Source Files

- `apps/daemon/src/path-resolver.ts` - Extended PathResolver with directory creation
- `apps/daemon/src/data-directory.ts` - DataDirectoryManager class

### Test Files

- `apps/daemon/tests/path-resolver.test.ts` - Unit tests for PathResolver
- `apps/daemon/tests/data-directory.test.ts` - Unit tests for DataDirectoryManager
- `apps/daemon/tests/integration/directory-creation.test.ts` - Integration tests for directory creation
- `apps/daemon/tests/integration/custom-path.test.ts` - Integration tests for custom path
- `apps/daemon/tests/integration/cross-platform.test.ts` - Integration tests for cross-platform
- `apps/daemon/tests/integration/clean.test.ts` - Integration tests for clean operation

### Configuration Files

- `apps/daemon/package.json` - Dependencies and scripts
- `apps/daemon/vitest.config.ts` - Vitest configuration

## Implementation Steps

### Step 1: Extend PathResolver

Add directory creation methods to existing PathResolver:

```typescript
// Add to path-resolver.ts
ensureDirectories(): void {
  const dataDir = this.getDataDir();
  const subdirs = ['data', 'logs', 'vault'];
  
  // Create data directory
  fs.mkdirSync(dataDir, { recursive: true });
  
  // Create subdirectories
  for (const subdir of subdirs) {
    fs.mkdirSync(path.join(dataDir, subdir), { recursive: true });
  }
}
```

### Step 2: Create DataDirectoryManager

Create new module for directory management:

```typescript
// data-directory.ts
import { PathResolver } from './path-resolver';

export class DataDirectoryManager {
  private pathResolver: PathResolver;
  
  constructor(pathResolver: PathResolver) {
    this.pathResolver = pathResolver;
  }
  
  ensureDirectories(): void {
    this.pathResolver.ensureDirectories();
  }
  
  clean(): void {
    const dataDir = this.pathResolver.getDataDir();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
  
  exists(): boolean {
    const dataDir = this.pathResolver.getDataDir();
    return fs.existsSync(dataDir);
  }
  
  getDataDir(): string {
    return this.pathResolver.getDataDir();
  }
}
```

### Step 3: Add File Locking

Add file locking for concurrent access:

```typescript
// Add to data-directory.ts
import lockfile from 'proper-lockfile';

async ensureDirectoriesWithLock(): Promise<void> {
  const dataDir = this.pathResolver.getDataDir();
  const lockPath = path.join(dataDir, '.lock');
  
  // Ensure parent directory exists for lock file
  fs.mkdirSync(path.dirname(dataDir), { recursive: true });
  
  // Acquire lock
  const release = await lockfile.lock(lockPath, {
    retries: {
      retries: 5,
      factor: 2,
      minTimeout: 100,
      maxTimeout: 1000
    }
  });
  
  try {
    this.ensureDirectories();
  } finally {
    await release();
  }
}
```

### Step 4: Add Logging

Add logging for directory operations:

```typescript
// Add to data-directory.ts
ensureDirectories(): void {
  const dataDir = this.pathResolver.getDataDir();
  console.log(`Ensuring data directory exists at: ${dataDir}`);
  
  // ... directory creation logic ...
  
  console.log(`Data directory structure created successfully`);
}
```

### Step 5: Write Unit Tests

Create comprehensive unit tests:

```typescript
// path-resolver.test.ts
import { describe, it, expect } from 'vitest';
import { PathResolver } from '../src/path-resolver';

describe('PathResolver', () => {
  it('should return default data directory', () => {
    const resolver = new PathResolver();
    const dataDir = resolver.getDataDir();
    expect(dataDir).toContain('.myboteam');
  });
  
  it('should respect MYBOTEAM_DATA_DIR', () => {
    process.env.MYBOTEAM_DATA_DIR = '/custom/path';
    const resolver = new PathResolver();
    const dataDir = resolver.getDataDir();
    expect(dataDir).toBe('/custom/path');
    delete process.env.MYBOTEAM_DATA_DIR;
  });
});
```

```typescript
// data-directory.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataDirectoryManager } from '../src/data-directory';
import { PathResolver } from '../src/path-resolver';
import fs from 'fs';
import path from 'path';

describe('DataDirectoryManager', () => {
  let manager: DataDirectoryManager;
  let tempDir: string;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myboteam-test-'));
    process.env.MYBOTEAM_DATA_DIR = tempDir;
    const resolver = new PathResolver();
    manager = new DataDirectoryManager(resolver);
  });
  
  afterEach(() => {
    delete process.env.MYBOTEAM_DATA_DIR;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  
  it('should create directory structure', () => {
    manager.ensureDirectories();
    
    expect(fs.existsSync(path.join(tempDir, 'data'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'logs'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'vault'))).toBe(true);
  });
  
  it('should be idempotent', () => {
    manager.ensureDirectories();
    expect(() => manager.ensureDirectories()).not.toThrow();
  });
  
  it('should clean directory', () => {
    manager.ensureDirectories();
    manager.clean();
    expect(fs.existsSync(tempDir)).toBe(false);
  });
});
```

### Step 6: Update Package Scripts

Add clean command to package.json:

```json
{
  "scripts": {
    "dev:clean": "node -e \"require('./src/data-directory').clean()\""
  }
}
```

## Testing Checklist

- [ ] Unit tests for PathResolver.getDataDir()
- [ ] Unit tests for PathResolver.getSocketPath()
- [ ] Unit tests for DataDirectoryManager.ensureDirectories()
- [ ] Unit tests for DataDirectoryManager.clean()
- [ ] Unit tests for DataDirectoryManager.exists()
- [ ] Integration tests for directory creation
- [ ] Integration tests for concurrent access
- [ ] Cross-platform testing (Windows, macOS, Linux)
- [ ] Edge case testing (symlinks, special characters, permissions)

## Common Issues

### Issue: Permission denied

**Cause**: No write permission to parent directory
**Solution**: Check permissions and provide descriptive error message

### Issue: Directory already exists

**Cause**: Multiple instances or previous run
**Solution**: Use idempotent operations (recursive: true)

### Issue: Concurrent access

**Cause**: Multiple instances starting simultaneously
**Solution**: Use file locks with proper-lockfile

### Issue: Path too long (Windows)

**Cause**: Windows path length limits
**Solution**: Use short paths or named pipes for sockets

## Performance Considerations

- Directory creation should complete within 1 second
- Clean command should complete within 2 seconds
- File locking should not cause significant overhead
- Logging should not impact performance significantly

## Security Considerations

- Vault directory security is handled by MAO-144
- File locks prevent concurrent modifications
- Error messages should not expose sensitive information
- Permissions should be appropriate for the platform
