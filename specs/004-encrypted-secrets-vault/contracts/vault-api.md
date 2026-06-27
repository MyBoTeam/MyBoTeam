# Vault API Contract

## Overview

This document defines the public API for the Encrypted Secrets Vault. The vault provides a secure interface for storing, retrieving, and managing secrets with AES-256-GCM encryption.

## Interface: VaultService

### Constructor

```typescript
constructor(options: VaultOptions)
```

**Parameters**:
- `options.path`: File path to vault storage (default: `.local-data/secure-storage.json`)
- `options.keyProvider`: Key provider instance (PlatformKeyProvider or EnvKeyProvider)

**Behavior**:
- Initializes vault with encryption key from key provider
- Creates vault file if it doesn't exist
- Loads existing entries if vault file exists

### Methods

#### `unlock(): Promise<void>`

**Purpose**: Unlock the vault for access.

**Behavior**:
- Derives encryption key from key provider
- Reads and decrypts vault file
- Acquires read-write lock
- Sets `isUnlocked = true`

**Throws**:
- `VaultError`: If key derivation fails
- `VaultError`: If vault file is corrupted

---

#### `lock(): Promise<void>`

**Purpose**: Lock the vault and release resources.

**Behavior**:
- Releases read-write lock
- Clears decrypted data from memory
- Sets `isUnlocked = false`

**Throws**:
- `VaultError`: If vault is already locked

---

#### `store(entry: StoreEntry): Promise<VaultEntry>`

**Purpose**: Store a new secret in the vault.

**Parameters**:
- `entry.key`: Unique name for the secret
- `entry.type`: Category (api_key, oauth_token, credential)
- `entry.value`: Plaintext value to encrypt
- `entry.metadata`: Optional metadata
- `entry.expiresAt`: Optional expiration

**Returns**: Created VaultEntry with encrypted value

**Behavior**:
- Validates entry (unique key, valid type)
- Generates random IV and salt
- Encrypts value with AES-256-GCM
- Writes to vault file atomically
- Returns entry with encrypted value (not plaintext)

**Throws**:
- `VaultError`: If key already exists
- `VaultError`: If vault is locked
- `ValidationError`: If entry is invalid

---

#### `retrieve(key: string): Promise<VaultEntry>`

**Purpose**: Retrieve a secret by key (returns encrypted value).

**Parameters**:
- `key`: Unique name of the secret

**Returns**: VaultEntry with encrypted value

**Behavior**:
- Validates vault is unlocked
- Looks up entry by key
- Returns entry (encrypted, not decrypted)

**Throws**:
- `VaultKeyNotFoundError`: If key doesn't exist
- `VaultError`: If vault is locked

---

#### `decrypt(key: string): Promise<string>`

**Purpose**: Retrieve and decrypt a secret value.

**Parameters**:
- `key`: Unique name of the secret

**Returns**: Decrypted plaintext value

**Behavior**:
- Validates vault is unlocked
- Retrieves encrypted entry
- Decrypts value with AES-256-GCM
- Returns plaintext (never stored in logs/traces)

**Throws**:
- `VaultKeyNotFoundError`: If key doesn't exist
- `VaultError`: If vault is locked
- `VaultError`: If decryption fails

---

#### `update(key: string, updates: UpdateEntry): Promise<VaultEntry>`

**Purpose**: Update an existing secret.

**Parameters**:
- `key`: Unique name of the secret
- `updates.value`: New plaintext value (optional)
- `updates.metadata`: New metadata (optional)
- `updates.expiresAt`: New expiration (optional)
- `updates.state`: New state (optional)

**Returns**: Updated VaultEntry

**Behavior**:
- Validates entry exists and vault is unlocked
- Applies updates
- Re-encrypts value if changed
- Writes to vault file atomically
- Returns updated entry

**Throws**:
- `VaultKeyNotFoundError`: If key doesn't exist
- `VaultError`: If vault is locked
- `ValidationError`: If updates are invalid

---

#### `delete(key: string): Promise<void>`

**Purpose**: Soft-delete a secret (sets state to deleted).

**Parameters**:
- `key`: Unique name of the secret

**Behavior**:
- Validates entry exists and vault is unlocked
- Sets `state = 'deleted'`
- Writes to vault file atomically
- Entry retained for audit trail

**Throws**:
- `VaultKeyNotFoundError`: If key doesn't exist
- `VaultError`: If vault is locked

---

#### `list(options?: ListOptions): Promise<VaultEntry[]>`

**Purpose**: List all secrets in the vault.

**Parameters**:
- `options.state`: Filter by state (active, expired, deleted)
- `options.type`: Filter by type (api_key, oauth_token, credential)

**Returns**: Array of VaultEntry objects

**Behavior**:
- Validates vault is unlocked
- Returns filtered entries
- Excludes deleted entries by default

**Throws**:
- `VaultError`: If vault is locked

---

#### `refresh(key: string): Promise<VaultEntry>`

**Purpose**: Refresh an OAuth token if expiring soon.

**Parameters**:
- `key`: Unique name of the OAuth token

**Returns**: Updated VaultEntry with refreshed token

**Behavior**:
- Validates entry is OAuth token type
- Checks if token is expiring soon
- Calls provider-specific refresh logic
- Updates vault with new token
- Returns updated entry

**Throws**:
- `VaultKeyNotFoundError`: If key doesn't exist
- `VaultError`: If not an OAuth token
- `VaultError`: If refresh fails
- `VaultError`: If vault is locked

---

### Event: `onRefreshFailure`

**Purpose**: Notify when token refresh fails.

**Payload**:
- `key`: Secret key that failed to refresh
- `error`: Error message
- `token`: Last valid token (encrypted)

**Behavior**:
- Emitted when automatic refresh fails
- Enables user notification and manual intervention

## Error Hierarchy

```typescript
class VaultError extends Error {
  code: string;
  constructor(message: string, code: string);
}

class VaultKeyNotFoundError extends VaultError {
  constructor(key: string);
}

class VaultLockedError extends VaultError {
  constructor();
}

class VaultCorruptedError extends VaultError {
  constructor();
}

class ValidationError extends VaultError {
  constructor(message: string, field: string);
}
```

## Usage Examples

### Basic Storage and Retrieval

```typescript
const vault = new VaultService({
  path: '.local-data/secure-storage.json',
  keyProvider: new PlatformKeyProvider()
});

await vault.unlock();

// Store a secret
await vault.store({
  key: 'github-api-key',
  type: 'api_key',
  value: 'ghp_1234567890abcdef'
});

// Retrieve (encrypted)
const entry = await vault.retrieve('github-api-key');
console.log(entry.encryptedValue); // "base64-encoded-ciphertext"

// Decrypt
const plaintext = await vault.decrypt('github-api-key');
console.log(plaintext); // "ghp_1234567890abcdef"
```

### OAuth Token with Auto-Refresh

```typescript
// Store OAuth token
await vault.store({
  key: 'google-oauth',
  type: 'oauth_token',
  value: 'ya29.access-token',
  metadata: {
    refreshToken: '1//refresh-token',
    provider: 'google',
    scope: ['email', 'profile']
  },
  expiresAt: new Date(Date.now() + 3600000) // 1 hour
});

// Auto-refresh if expiring soon
const refreshed = await vault.refresh('google-oauth');
```

### Concurrent Access

```typescript
// Multiple reads can happen simultaneously
const [entry1, entry2] = await Promise.all([
  vault.retrieve('key1'),
  vault.retrieve('key2')
]);

// Write blocks until all readers release
await vault.store({ key: 'key3', type: 'api_key', value: 'value' });
```
