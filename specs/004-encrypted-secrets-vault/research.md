# Research: Encrypted Secrets Vault (AES-256-GCM)

## Phase 0: Technical Research

### 1. AES-256-GCM Implementation in Node.js

**Decision**: Use Node.js built-in `crypto` module for AES-256-GCM encryption.

**Rationale**:
- Native implementation, no external dependencies
- Battle-tested cryptographic primitives
- AES-256-GCM provides authenticated encryption (confidentiality + integrity)
- GCM mode is efficient and suitable for file-based storage

**Alternatives Considered**:
- **crypto-js**: External library, but Node.js crypto is sufficient and more secure (no third-party dependency)
- **libsodium**: More features than needed, adds complexity

**Implementation Pattern**:
```typescript
// Generate random IV for each encryption
const iv = crypto.randomBytes(12); // 96 bits for GCM
// Encrypt with AES-256-GCM
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
// Authentication tag for integrity verification
const authTag = cipher.getAuthTag();
```

### 2. PBKDF2 Key Derivation

**Decision**: Use Node.js built-in `crypto.pbkdf2Sync` with 100,000 iterations and SHA-512.

**Rationale**:
- 100,000 iterations provides strong protection against brute-force attacks
- SHA-512 provides sufficient entropy for derived keys
- Synchronous implementation matches vault's synchronous architecture (ADR-004)
- Derived key cached in memory for performance (avoids repeated derivation)

**Implementation Pattern**:
```typescript
const derivedKey = crypto.pbkdf2Sync(
  password,      // Platform-derived key material
  salt,          // Random salt per vault
  100000,        // Iterations
  32,            // Key length (256 bits for AES-256)
  'sha512'       // Hash algorithm
);
```

### 3. Key Provider Architecture

**Decision**: Implement two key providers:
1. **PlatformKeyProvider**: Derives key from platform identifiers (homedir, username, app ID)
2. **EnvKeyProvider**: Uses `MYBOTEAM_VAULT_KEY` environment variable override

**Rationale**:
- Platform key provides seamless user experience (no manual key entry)
- Environment variable override enables testing and advanced use cases
- Key derivation from stable platform identifiers ensures recovery across sessions

**Alternatives Considered**:
- **OS Keychain**: More secure but adds platform-specific complexity (macOS Keychain, Windows Credential Manager)
- **User-provided password**: More secure but requires user interaction on every session

### 4. File Storage with Atomic Writes

**Decision**: Write to temporary file, then rename for atomic operation.

**Rationale**:
- Atomic rename is guaranteed on most filesystems (POSIX compliance)
- Prevents corruption if process crashes during write
- Follows ADR-004 pattern for secure storage

**Implementation Pattern**:
```typescript
const tempPath = `${vaultPath}.tmp`;
await fs.writeFile(tempPath, encryptedData);
await fs.rename(tempPath, vaultPath); // Atomic operation
```

### 5. Read-Write Lock Implementation

**Decision**: Implement read-write locks using a simple semaphore pattern.

**Rationale**:
- Multiple readers can access simultaneously (common case)
- Single writer ensures data consistency
- Prevents corruption from concurrent modifications
- Simple implementation sufficient for single-process vault

**Implementation Pattern**:
```typescript
class ReadWriteLock {
  private readers = 0;
  private writer = false;
  private waitingWriters = 0;
  
  async acquireRead(): Promise<void> { ... }
  async releaseRead(): Promise<void> { ... }
  async acquireWrite(): Promise<void> { ... }
  async releaseWrite(): Promise<void> { ... }
}
```

### 6. OAuth Token Refresh Service

**Decision**: Implement centralized refresh service with provider-specific adapters.

**Rationale**:
- Centralized logic avoids duplication across providers
- Provider-specific adapters handle OAuth flow differences
- Automatic refresh before expiration prevents service interruptions
- User notification on refresh failure enables manual intervention

**Implementation Pattern**:
```typescript
interface TokenProvider {
  refresh(token: OAuthToken): Promise<OAuthToken>;
  isExpiringSoon(token: OAuthToken): boolean;
}

class RefreshService {
  private providers: Map<string, TokenProvider>;
  
  async refreshIfNeeded(token: OAuthToken): Promise<OAuthToken> {
    if (this.isExpiringSoon(token)) {
      return this.refreshToken(token);
    }
    return token;
  }
}
```

### 7. Secret Lifecycle Management

**Decision**: Track secrets through Active → Expired → Deleted states.

**Rationale**:
- Active: Secret is valid and can be used
- Expired: Secret has exceeded TTL, needs refresh or replacement
- Deleted: Secret is removed but audit trail maintained
- State transitions enable automatic refresh and cleanup

**Implementation Pattern**:
```typescript
enum SecretState {
  Active = 'active',
  Expired = 'expired',
  Deleted = 'deleted'
}

interface VaultEntry {
  key: string;
  state: SecretState;
  expiresAt?: Date;
  // ... other fields
}
```

## Research Summary

All technical unknowns have been resolved using Node.js built-in modules and established patterns from ADR-004. No external cryptographic dependencies required. Implementation follows existing codebase conventions for security, testing, and code structure.

**Next Steps**: Proceed to Phase 1 — Design & Contracts
