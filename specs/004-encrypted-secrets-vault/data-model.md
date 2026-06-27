# Data Model: Encrypted Secrets Vault (AES-256-GCM)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Vault                                 │
├─────────────────────────────────────────────────────────────┤
│ - path: string (file path to secure-storage.json)          │
│ - encryptionKey: Buffer (derived via PBKDF2)               │
│ - readWriteLock: ReadWriteLock (concurrent access control)  │
│ - isUnlocked: boolean                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ contains
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      VaultEntry                              │
├─────────────────────────────────────────────────────────────┤
│ - id: string (UUID)                                         │
│ - key: string (unique name, e.g., "github-api-key")        │
│ - type: VaultEntryType (api_key | oauth_token | credential) │
│ - encryptedValue: string (base64-encoded ciphertext)       │
│ - iv: string (base64-encoded initialization vector)        │
│ - salt: string (base64-encoded PBKDF2 salt)                │
│ - tag: string (base64-encoded GCM authentication tag)      │
│ - state: SecretState (active | expired | deleted)          │
│ - expiresAt?: Date                                          │
│ - metadata: Record<string, unknown>                        │
│ - createdAt: Date                                           │
│ - updatedAt: Date                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ may reference
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     OAuthToken                               │
├─────────────────────────────────────────────────────────────┤
│ - entryId: string (FK → VaultEntry.id)                     │
│ - accessToken: string (encrypted)                          │
│ - refreshToken?: string (encrypted)                        │
│ - tokenType: string ("Bearer")                             │
│ - expiresAt: Date                                           │
│ - scope: string[]                                           │
│ - provider: string (e.g., "google", "github")              │
└─────────────────────────────────────────────────────────────┘
```

## Entity Definitions

### Vault

**Purpose**: Encrypted storage container for all secrets.

**Attributes**:
- `path`: File path to the encrypted vault file (`.local-data/secure-storage.json`)
- `encryptionKey`: 256-bit key derived via PBKDF2 from platform identifiers
- `readWriteLock`: Manages concurrent access (multiple readers, single writer)
- `isUnlocked`: Whether the vault is currently accessible

**Constraints**:
- Single vault per application instance (local-first, single-user)
- Vault file must be writable by the application process
- Key derivation completes within 5 seconds on standard hardware

### VaultEntry

**Purpose**: Individual secret stored in the vault.

**Attributes**:
- `id`: Unique identifier (UUID v4)
- `key`: Human-readable unique name (e.g., "github-api-key")
- `type`: Category of secret (api_key, oauth_token, credential)
- `encryptedValue`: AES-256-GCM encrypted secret value (base64)
- `iv`: Initialization vector for encryption (base64)
- `salt`: PBKDF2 salt for key derivation (base64)
- `tag`: GCM authentication tag for integrity verification (base64)
- `state`: Lifecycle state (active, expired, deleted)
- `expiresAt`: Optional expiration timestamp
- `metadata`: Arbitrary key-value pairs for additional context
- `createdAt`: Creation timestamp
- `updatedAt`: Last modification timestamp

**Constraints**:
- `key` must be unique across all entries in the vault
- `encryptedValue` must not be readable without decryption
- `state` transitions: active → expired → deleted (no reverse)

### OAuthToken

**Purpose**: OAuth-specific metadata for token refresh.

**Attributes**:
- `entryId`: Foreign key to VaultEntry
- `accessToken`: Encrypted access token
- `refreshToken`: Encrypted refresh token (optional)
- `tokenType`: Token type (typically "Bearer")
- `expiresAt`: Token expiration timestamp
- `scope`: Array of granted permissions
- `provider`: OAuth provider identifier

**Constraints**:
- `refreshToken` required for automatic refresh capability
- `expiresAt` must be in the future for active tokens
- `provider` must match a registered TokenProvider adapter

## State Transitions

```
                    ┌──────────────┐
                    │   Created    │
                    └──────┬───────┘
                           │ store()
                           ▼
                    ┌──────────────┐
          ┌────────│    Active    │────────┐
          │        └──────┬───────┘        │
          │               │                │
  refresh()│        expire()         delete()
          │               │                │
          ▼               ▼                ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │   Active   │  │   Expired  │  │   Deleted  │
   │ (renewed)  │  │            │  │            │
   └────────────┘  └────────────┘  └────────────┘
```

**Rules**:
- `Active` → `Expired`: Automatic when `expiresAt` passes
- `Active` → `Deleted`: Manual deletion by user
- `Expired` → `Active`: Automatic via token refresh (if refresh token available)
- `Expired` → `Deleted`: Manual deletion or cleanup
- `Deleted` entries are retained for audit trail (not physically removed)

## Validation Rules

### VaultEntry

| Field | Validation | Error Message |
|-------|------------|---------------|
| `key` | Required, 1-256 chars, unique | "Key must be 1-256 characters and unique" |
| `type` | Required, valid VaultEntryType | "Type must be api_key, oauth_token, or credential" |
| `encryptedValue` | Required, non-empty string | "Encrypted value required" |
| `iv` | Required, non-empty string | "Initialization vector required" |
| `salt` | Required, non-empty string | "Salt required" |
| `tag` | Required, non-empty string | "GCM authentication tag required" |
| `state` | Required, valid SecretState | "State must be active, expired, or deleted" |
| `expiresAt` | Optional, ISO 8601 datetime | "Invalid expiration date" |
| `createdAt` | Required, ISO 8601 datetime | "Creation date required" |
| `updatedAt` | Required, ISO 8601 datetime | "Update date required" |

### OAuthToken

| Field | Validation | Error Message |
|-------|------------|---------------|
| `entryId` | Required, valid UUID | "Entry ID required" |
| `accessToken` | Required, non-empty string | "Access token required" |
| `refreshToken` | Optional, non-empty string | "Invalid refresh token" |
| `expiresAt` | Required, ISO 8601 datetime | "Expiration date required" |
| `scope` | Required, array of strings | "Scope must be array of strings" |
| `provider` | Required, non-empty string | "Provider required" |

## Indexes

**Primary Key**: `VaultEntry.id` (UUID)

**Unique Index**: `VaultEntry.key` (human-readable name)

**Composite Index**: `VaultEntry.state` + `VaultEntry.expiresAt` (for expiry queries)

## Serialization Format

**File**: `.local-data/secure-storage.json`

```json
{
  "version": "1.0",
  "salt": "base64-encoded-pbkdf2-salt",
  "entries": [
    {
      "id": "uuid",
      "key": "github-api-key",
      "type": "api_key",
      "encryptedValue": "base64-encoded-ciphertext",
      "iv": "base64-encoded-iv",
      "salt": "base64-encoded-entry-salt",
      "tag": "base64-encoded-gcm-tag",
      "state": "active",
      "expiresAt": "2026-12-31T23:59:59.000Z",
      "metadata": {},
      "createdAt": "2026-06-26T12:00:00.000Z",
      "updatedAt": "2026-06-26T12:00:00.000Z"
    }
  ]
}
```
