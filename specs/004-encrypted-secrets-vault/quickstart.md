# Quickstart: Encrypted Secrets Vault (AES-256-GCM)

## Overview

The Encrypted Secrets Vault provides secure storage for API keys, OAuth tokens, and credentials using AES-256-GCM encryption. All secrets are encrypted at rest and decrypted only in memory when actively used.

## Prerequisites

- Node.js 18+ (for native crypto module)
- TypeScript 5.7+
- pnpm (package manager)

## Quick Start

### 1. Import the Vault Module

```typescript
import { VaultService, PlatformKeyProvider } from '@myboteam/agent-core';
```

### 2. Initialize the Vault

```typescript
const vault = new VaultService({
  dataDir: '.local-data',
  keyProvider: new PlatformKeyProvider()
});
```

### 3. Unlock the Vault

```typescript
await vault.unlock('your-master-password');
// Vault is now ready for use
```

### 4. Store a Secret

```typescript
await vault.store_entry(
  'github-api-key',
  'ghp_1234567890abcdef',
  'api_key',
  { service: 'github' }
);
```

### 5. Retrieve a Secret

```typescript
// Get encrypted entry (for inspection)
const entry = await vault.retrieve('github-api-key');
console.log(entry.encryptedValue); // Not readable

// Get decrypted value (for use)
const decrypted = await vault.decrypt(entry);
console.log(decrypted); // "ghp_1234567890abcdef"
```

### 6. Lock the Vault

```typescript
await vault.lock();
// Secrets cleared from memory
```

## Common Operations

### Store OAuth Token with Auto-Refresh

```typescript
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

// Later: refresh if expiring soon
const refreshed = await vault.refresh('google-oauth');
```

### List All Active Secrets

```typescript
const activeSecrets = await vault.list({ state: 'active' });
console.log(activeSecrets.length); // Number of active secrets
```

### Update a Secret

```typescript
await vault.update('github-api-key', {
  value: 'ghp_new-api-key',
  metadata: { rotatedAt: new Date().toISOString() }
});
```

### Delete a Secret

```typescript
await vault.delete('github-api-key');
// Secret is soft-deleted (state = 'deleted')
```

## Environment Variable Override

For testing or advanced use cases, override the encryption key:

```bash
export MYBOTEAM_VAULT_KEY="your-256-bit-key-here"
```

```typescript
import { EnvKeyProvider } from '@myboteam/agent-core';

const vault = new VaultService({
  keyProvider: new EnvKeyProvider()
});
```

## Error Handling

```typescript
import { VaultKeyNotFoundError, VaultLockedError } from '@myboteam/agent-core';

try {
  const secret = await vault.decrypt('nonexistent-key');
} catch (error) {
  if (error instanceof VaultKeyNotFoundError) {
    console.error('Key not found:', error.key);
  } else if (error instanceof VaultLockedError) {
    console.error('Vault is locked');
  }
}
```

## Testing

### Unit Tests

```bash
pnpm test -- --filter @myboteam/agent-core vault
```

### Integration Tests

```bash
pnpm test -- --filter @myboteam/agent-core vault-integration
```

### Contract Tests

```bash
pnpm test -- --filter @myboteam/agent-core vault-contract
```

## Security Notes

- **Never** log decrypted secrets
- **Never** pass decrypted secrets to renderer process
- **Always** use atomic writes (handled by vault implementation)
- **Always** lock vault when application exits
- **Rotate** encryption key if compromised (requires re-encryption of all secrets)

## Performance

- Key derivation: <5 seconds on standard hardware (PBKDF2 100k iterations)
- Encryption/decryption: <10ms per secret
- Concurrent reads: Unlimited (read-write lock)
- Concurrent writes: Serialized (single writer)

## Troubleshooting

### Vault Won't Unlock

- Check `MYBOTEAM_VAULT_KEY` environment variable if using EnvKeyProvider
- Verify vault file exists and is readable
- Check file permissions (should be 600 for owner only)

### Key Derivation Slow

- First unlock may take up to 5 seconds (PBKDF2 key derivation)
- Subsequent unlocks are faster (key cached in memory)
- Consider using EnvKeyProvider for faster startup in development

### Concurrent Access Issues

- Vault uses read-write locks for safety
- Writes block until all readers release
- Reads can happen simultaneously
- If experiencing deadlocks, check for nested vault operations

## Key Recovery and Rotation

### Key Recovery

Keys can be recovered using the same password and salt that were used during initial key derivation:

```typescript
const provider = new PlatformKeyProvider();
const salt = Buffer.from('hex-encoded-salt', 'hex');

// Recover key with same password and salt
const key = await provider.deriveKey('your-password', salt);
```

**Important**: If you lose the password or salt, you cannot recover the key and your secrets will be permanently inaccessible.

### Key Rotation

To rotate the encryption key:

1. Unlock the vault with the old password
2. Re-encrypt all secrets with the new key
3. Update the vault file

```typescript
import { reEncrypt } from '@myboteam/agent-core';

// Unlock with old password
await vault.unlock('old-password');

// Get all secrets
const secrets = await vault.list();

// Re-encrypt each secret with new key
for (const secret of secrets) {
  const decrypted = await vault.decrypt(secret);
  const newEncrypted = await reEncrypt(
    { encrypted: secret.encryptedValue, iv: secret.iv, salt: secret.salt, tag: secret.iv },
    oldKey,
    newKey
  );
  // Update secret in vault
  await vault.update(secret.key, decrypted);
}

// Lock vault
await vault.lock();
```

### Backup Recommendations

- Always backup the vault file (`.local-data/secure-storage.json`)
- Store the password securely (password manager recommended)
- Note the salt used for key derivation
- Test recovery procedure periodically
