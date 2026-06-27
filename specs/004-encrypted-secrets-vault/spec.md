# Feature Specification: Encrypted Secrets Vault (AES-256-GCM)

**Feature Branch**: `004-encrypted-secrets-vault`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-144/m2-3-encrypted-secrets-vault-aes-256-gcm"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Store API Keys Securely (Priority: P1)

As a user, I want my API keys and credentials to be stored encrypted at rest so that my sensitive information is protected even if the storage files are compromised.

**Why this priority**: This is the core security requirement. Without encrypted storage, sensitive credentials would be exposed in plaintext, creating a critical security vulnerability.

**Independent Test**: Can be fully tested by storing an API key and verifying it is not readable in the storage file, while still being retrievable through the application.

**Acceptance Scenarios**:

1. **Given** I have an API key for a service, **When** I store it in the vault, **Then** the key is encrypted before being written to disk
2. **Given** an API key is stored in the vault, **When** I examine the storage file, **Then** the key value is not readable in plaintext
3. **Given** I need to use the stored API key, **When** I retrieve it from the vault, **Then** the key is decrypted and returned in its original form

---

### User Story 2 - Retrieve and Use Secrets (Priority: P1)

As a user, I want to retrieve my stored secrets when needed so that I can use them to authenticate with external services.

**Why this priority**: This is essential for the vault to be useful. Without retrieval capability, storing secrets would serve no purpose.

**Independent Test**: Can be fully tested by storing a secret, retrieving it, and verifying it matches the original value.

**Acceptance Scenarios**:

1. **Given** I have stored a secret in the vault, **When** I request it by name, **Then** the decrypted secret is returned
2. **Given** I request a secret that doesn't exist, **When** I attempt retrieval, **Then** an appropriate error is returned
3. **Given** the vault is locked or inaccessible, **When** I attempt to retrieve a secret, **Then** a clear error message is provided

---

### User Story 3 - Recover from Key Loss (Priority: P2)

As a user, I want a recovery mechanism if I lose access to my encryption key so that I don't permanently lose my stored secrets.

**Why this priority**: Key loss is a realistic scenario that could result in permanent data loss. Recovery capability is important for user confidence and data availability.

**Independent Test**: Can be tested by simulating key loss and verifying the recovery process works.

**Acceptance Scenarios**:

1. **Given** I have lost access to my encryption key, **When** I initiate the recovery process, **Then** I can regain access to my secrets
2. **Given** I am recovering from key loss, **When** I complete the recovery flow, **Then** my existing secrets remain intact and accessible

---

### User Story 4 - Automatic Token Refresh (Priority: P2)

As a user, I want my OAuth tokens to be automatically refreshed so that I don't have to manually re-authenticate with services.

**Why this priority**: Automatic refresh improves user experience and prevents service interruptions due to expired tokens.

**Independent Test**: Can be tested by storing an OAuth token with refresh capabilities and verifying it is automatically updated when nearing expiration.

**Acceptance Scenarios**:

1. **Given** I have an OAuth token stored in the vault, **When** the token approaches expiration, **Then** the system automatically refreshes it
2. **Given** a token refresh fails, **When** the failure occurs, **Then** the user is notified and can take manual action

---

### Edge Cases

- What happens when the vault file is corrupted?
- How does the system handle concurrent access to the vault from multiple processes?
- What happens if the encryption key changes between sessions?
- How does the system behave when the vault is full or storage is unavailable?
- What happens if a secret is deleted while another process is reading it?
- How does the system handle write lock contention under high read load?
- What happens when a secret transitions to Expired state while being actively used?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST encrypt all stored secrets using AES-256-GCM encryption
- **FR-002**: System MUST derive encryption keys using PBKDF2 with 100,000 iterations
- **FR-003**: System MUST store secrets in a file that is not readable in plaintext
- **FR-004**: System MUST decrypt secrets only in memory when needed for use
- **FR-005**: System MUST never expose decrypted secrets in logs, traces, or error messages
- **FR-006**: System MUST support atomic writes to prevent data corruption during updates
- **FR-007**: System MUST provide a recovery mechanism for key loss scenarios
- **FR-008**: System MUST support automatic OAuth token refresh via centralized refresh service when tokens approach expiration
- **FR-011**: System MUST use read-write locks to protect concurrent vault access (multiple readers, single writer)
- **FR-012**: System MUST identify secrets by unique string names (e.g., "github-api-key")
- **FR-013**: System MUST track secret lifecycle states: Active, Expired, Deleted
- **FR-014**: System MUST support only local-first, single-user vault operation (no cross-device sync or multi-user support in v1)
- **FR-009**: System MUST expose only the last 4 characters of keys in the UI for identification *(v2 scope - requires UI component)*
- **FR-010**: System MUST prevent decrypted secrets from entering the renderer process *(v2 scope - requires renderer boundary implementation)*

### Key Entities

- **Secret**: A named credential stored in the vault, identified by a unique string name, with lifecycle states (Active, Expired, Deleted)
- **Vault**: The encrypted storage container that holds all secrets, protected by read-write locks for concurrent access
- **Encryption Key**: The key material used to encrypt/decrypt secrets, derived via PBKDF2
- **Key Provider**: The mechanism for obtaining the encryption key (environment variable, keychain, etc.)
- **Refresh Service**: Centralized service managing OAuth token refresh for all providers
- **EncryptedData**: The encrypted representation of a secret, containing the ciphertext, initialization vector (IV), and GCM authentication tag

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can store and retrieve secrets without seeing plaintext in storage files
- **SC-002**: Secrets are decrypted only when actively being used by the application
- **SC-003**: Key derivation completes within acceptable time limits (under 5 seconds on standard hardware)
- **SC-004**: Recovery flow allows users to regain access to secrets after key loss
- **SC-005**: OAuth tokens are automatically refreshed before expiration without user intervention
- **SC-006**: System supports concurrent access without data corruption or loss

## Clarifications

### Session 2026-06-26

- Q: What features are explicitly OUT OF SCOPE for this vault implementation in v1? → A: Cross-device sync and multi-user support are out of scope for v1
- Q: How are secrets uniquely identified in the vault? → A: String names (e.g., "github-api-key")
- Q: What lifecycle states can a secret have? → A: Active, Expired, Deleted
- Q: How should OAuth token refresh be implemented? → A: Centralized refresh service
- Q: How should concurrent access to the vault be handled? → A: Read-write locks (multiple readers, single writer)

## Assumptions

- Users are running on standard desktop hardware (macOS, Windows, Linux)
- The application has access to the filesystem for storing the vault file
- Users have a stable computing environment (not expecting cross-device sync in v1)
- The vault is intended for single-user, local-first usage
- Existing authentication patterns in the codebase will be followed for integration
- The encryption key is derived from platform-specific stable identifiers (homedir, username)
- **v1 Scope**: No cross-device sync, no multi-user support, no secret versioning
- **Secret Identification**: Secrets identified by unique string names (not paths or UUIDs)
- **Lifecycle States**: Secrets have Active, Expired, or Deleted states
- **OAuth Refresh**: Centralized refresh service manages all OAuth token refreshes
- **Concurrency**: Read-write locks protect vault access (multiple readers, single writer)
