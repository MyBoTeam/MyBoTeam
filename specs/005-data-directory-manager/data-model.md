# Data Model: Data Directory Manager

## Entities

### DataDirectory

The root directory where all MyBoteam data is stored.

**Attributes**:
- `path`: string - The resolved path to the data directory
- `exists`: boolean - Whether the directory exists
- `created`: Date - When the directory was created (if exists)

**Relationships**:
- Contains multiple Subdirectories

**Validation Rules**:
- Path must be valid for the current platform
- Path must be writable by the current user
- Path cannot be empty

### Subdirectory

Standard directories within the data directory.

**Attributes**:
- `name`: string - The name of the subdirectory (data, logs, vault)
- `path`: string - The resolved path to the subdirectory
- `exists`: boolean - Whether the subdirectory exists
- `created`: Date - When the subdirectory was created (if exists)

**Relationships**:
- Belongs to a DataDirectory

**Validation Rules**:
- Name must be one of: data, logs, vault
- Path must be valid for the current platform
- Path must be writable by the current user

### PathResolver

Resolves paths for the data directory and its subdirectories.

**Attributes**:
- `dataDir`: string - The resolved data directory path
- `socketPath`: string - The resolved socket path
- `skillsDir`: string - The resolved skills directory path
- `pidFilePath`: string - The resolved PID file path

**Relationships**:
- Uses DataDirectory for path resolution

**Validation Rules**:
- Data directory path must be valid
- Socket path must be valid for the current platform
- Skills directory path must be valid
- PID file path must be valid

## State Transitions

### DataDirectory State

```
[Not Created] → [Creating] → [Created]
                    ↓
               [Error] → [Not Created]
```

**Transitions**:
- `Not Created` → `Creating`: When `create()` is called
- `Creating` → `Created`: When directory and subdirectories are successfully created
- `Creating` → `Error`: When directory creation fails
- `Error` → `Not Created`: When error is handled and user retries

### Subdirectory State

```
[Not Created] → [Creating] → [Created]
                    ↓
               [Error] → [Not Created]
```

**Transitions**:
- `Not Created` → `Creating`: When `ensureSubdirectory()` is called
- `Creating` → `Created`: When subdirectory is successfully created
- `Creating` → `Error`: When subdirectory creation fails
- `Error` → `Not Created`: When error is handled

## Data Volume / Scale Assumptions

- Single user per installation
- Local file system only (no network storage)
- Small directory structure (3 subdirectories)
- Low concurrent access (single daemon process)
- No large file operations in this feature

## Identity & Uniqueness Rules

- Data directory path is unique per installation
- Subdirectory names are unique within a data directory
- Socket path is unique per daemon instance (hash-based on Windows)

## Lifecycle / State Transitions

### Initialization Lifecycle

1. **Path Resolution**: Resolve data directory path from env or default
2. **Directory Check**: Check if data directory exists
3. **Directory Creation**: Create data directory if it doesn't exist
4. **Subdirectory Creation**: Create subdirectories (data, logs, vault)
5. **Verification**: Verify all directories were created correctly

### Clean Lifecycle

1. **Path Resolution**: Resolve data directory path from env or default
2. **Directory Check**: Check if data directory exists
3. **Directory Removal**: Remove entire data directory recursively
4. **Verification**: Verify directory was removed
