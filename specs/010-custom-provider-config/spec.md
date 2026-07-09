# Feature Specification: Custom Provider Configuration

**Feature Branch**: `010-custom-provider-config`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-155/m4-4-custom-provider-url-key-model"

## Mission Brief

**Goal**: Implement custom LLM provider configuration with URL, API key, and model name, supporting OpenAI-compatible endpoints with secure credential storage.

**Success Criteria**:
- Users can configure custom providers with URL, API key, and model name
- Configuration validation catches malformed URLs and invalid API keys
- API keys are encrypted at rest and never exposed in plaintext

**Constraints**:
- Must be OpenAI-compatible (uses `/v1/models` endpoint for validation)
- Must use existing vault infrastructure for secure storage
- Builds upon existing provider infrastructure from v0.3.0

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Custom LLM Provider (Priority: P1)

As a developer, I want to configure a custom LLM provider with a specific URL, API key, and model name so that I can connect to any OpenAI-compatible endpoint.

**Why this priority**: This is the core functionality that enables integration with custom LLM providers, which is essential for the M4 LLM Layer milestone.

**Independent Test**: Can be fully tested by configuring a custom provider with valid credentials and verifying successful connection to the endpoint.

**Acceptance Scenarios**:

1. **Given** I have a valid OpenAI-compatible endpoint URL, API key, and model name, **When** I configure the custom provider with these details, **Then** the system stores the configuration securely and validates the connection.
2. **Given** I have configured a custom provider, **When** I test the connection, **Then** the system successfully connects to the endpoint and returns available models.
3. **Given** I have configured a custom provider, **When** I send a prompt to the provider, **Then** the system forwards the request to the custom endpoint and returns the response.

---

### User Story 2 - Validate Custom Provider Configuration (Priority: P2)

As a developer, I want the system to validate my custom provider configuration so that I receive clear feedback on any issues before attempting to use the provider.

**Why this priority**: Proper validation prevents runtime errors and improves user experience when configuring custom providers.

**Independent Test**: Can be tested by entering invalid configurations (malformed URL, invalid API key, unreachable endpoint) and verifying appropriate error messages.

**Acceptance Scenarios**:

1. **Given** I enter a malformed URL, **When** I attempt to save the configuration, **Then** the system displays a clear error message indicating the URL format is invalid.
2. **Given** I enter an invalid API key, **When** I test the connection, **Then** the system returns an authentication error.
3. **Given** I enter an unreachable endpoint URL, **When** I test the connection, **Then** the system returns a connection timeout error with appropriate messaging.

---

### User Story 3 - Secure Storage of Provider Credentials (Priority: P3)

As a developer, I want my custom provider credentials (API key) to be stored securely in the vault so that they are encrypted and protected.

**Why this priority**: Security is critical for API keys and credentials; they must not be stored in plaintext.

**Independent Test**: Can be tested by verifying that API keys are encrypted in storage and not exposed in logs or configuration files.

**Acceptance Scenarios**:

1. **Given** I have configured a custom provider with an API key, **When** I view the stored configuration, **Then** the API key is masked/encrypted and not displayed in plaintext.
2. **Given** I have stored a custom provider configuration, **When** I export or backup the configuration, **Then** the API key remains encrypted in the export.
3. **Given** I have stored a custom provider configuration, **When** another user accesses the system, **Then** they cannot see my API key without proper authorization.

---

### Edge Cases

- What happens when the custom provider endpoint is temporarily unavailable?
- How does the system handle rate limiting from the custom provider?
- What happens if the API key is revoked after configuration?
- How does the system handle different response formats from OpenAI-compatible endpoints?
- What happens when the model name specified doesn't exist on the endpoint?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to configure a custom LLM provider with URL, API key, and model name.
- **FR-002**: System MUST validate the URL format before saving configuration.
- **FR-003**: System MUST test connectivity to the custom endpoint when saving configuration (automatic) and allow manual re-test after configuration (user-initiated). Both paths use the same connection test logic.
- **FR-004**: System MUST store the API key encrypted in the vault when provided. API keys are optional (some endpoints may not require authentication).
- **FR-005**: System MUST support OpenAI-compatible API format for custom providers (uses `/v1/models` endpoint for validation, `/v1/chat/completions` for inference).
- **FR-006**: System MUST provide error messages in format `[ERROR_CODE] Human-readable description`. Error codes are defined in `contracts/custom-provider-api.md`.
- **FR-007**: System MUST auto-detect and transform common response format variations from OpenAI-compatible providers. Supported variations: `choices[0].message.content` (OpenAI standard), `generations[0].text` (Anthropic-compatible), `results[0].output` (generic). Unrecognized formats are passed through unchanged with a warning.
- **FR-008**: System MUST mask the API key in user interface and logs (display as `****` + last 4 characters).
- **FR-009**: System MUST limit users to a maximum of 50 custom providers.
- **FR-010**: System MUST provide rate limit detection and notify users when the custom provider returns HTTP 429 with `Retry-After` header.

### Key Entities

- **CustomProvider**: Represents a custom LLM provider configuration with URL, API key, model name, and connection status. **Uniqueness**: Combination of URL and user-provided name. **Lifecycle States**: Active, Inactive, Error.
- **CustomProviderConfig** (renamed from ProviderConfig to avoid upstream naming conflict): Contains the validation state for a custom provider configuration including validation state and last connection test result.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System processing for provider configuration and connection test completes within 5 seconds; total time including network round-trip within 2 minutes under normal conditions.
- **SC-002**: Configuration validation catches all common malformed URLs (missing protocol, invalid characters, non-HTTP schemes) and invalid API keys (empty, wrong format) before saving.
- **SC-003**: API keys are encrypted at rest and never exposed in plaintext in logs or UI.
- **SC-004**: Connection tests return clear feedback (success/failure with error code) within 10 seconds for unreachable endpoints (timeout enforced at 10s).

## Clarifications

### Session 2026-07-02
- Q: What functionality is explicitly out of scope for this custom provider feature? → A: No out of scope (all functionality is in scope)
- Q: How should custom providers be uniquely identified? → A: URL + Name (combination of URL and user-provided name)
- Q: What states can a custom provider configuration be in? → A: Active/Inactive/Error (three states: active, inactive, error)
- Q: What is the maximum number of custom providers a user can configure? → A: 50 providers (up to 50 providers per user)
- Q: How should the system handle provider-specific response format differences? → A: Auto-detect/transform (auto-detect and transform common patterns)

### Session 2026-07-09
- Q: How should the rate limit counter behave when a non-rate-limit failure occurs? → A: Reset counter on any non-rate-limit result (success or failure). This is conservative behavior that prevents accumulating stale rate limit counts from unrelated failures.

## Assumptions

- The custom provider endpoint is OpenAI-compatible (uses `/v1/models` endpoint for validation).
- Users have valid API keys for their custom providers.
- The system has network access to the custom provider endpoints.
- Existing vault infrastructure is available for secure credential storage.
- This feature builds upon the existing provider infrastructure from v0.3.0.
- **Scope**: No explicit out-of-scope restrictions; all related functionality is in scope.

## Source Reference Analysis

**Source**: v0.3.0 (packages/agent-core/src/providers/custom.ts) + upstream main (packages/agent-core/src/providers/)

**Verification Status** (verified 2026-07-09, updated after implementation):
- `packages/types/src/custom-provider.ts` — NEW: All custom provider types (CustomProvider, ConnectionTestResult, etc.)
- `packages/agent-core/src/providers/custom-config.ts` — NEW: CustomProviderService (CRUD, connection test, status management)
- `packages/agent-core/src/providers/custom-provider.ts` — NEW: Barrel export for custom provider APIs
- `packages/agent-core/src/providers/tools/custom-metadata.ts` — NEW: ProviderVaultMetadata, buildVaultKey, createProviderFromVault
- `packages/agent-core/src/providers/tools/custom-utils.ts` — NEW: classifyNetworkError, detectAndTransformResponse, maskApiKey
- `packages/agent-core/src/providers/tools/custom-validation.ts` — NEW: URL, API key, model validation
- `packages/agent-core/src/providers/tools/custom-validation-utils.ts` — NEW: validateApiFormat, validateModelInList, checkUniqueness
- `packages/agent-core/src/utils/url.ts` (`validateHttpUrl`) — EXISTS in v0.3.0, PORTED to current codebase
- `packages/agent-core/src/utils/sanitize.ts` (`sanitizeString`) — EXISTS in v0.3.0, PORTED to current codebase
- `packages/agent-core/src/vault/vault-service.ts` — EXISTS in both v0.3.0 and current codebase
- `packages/agent-core/src/providers/provider-errors.ts` — EXISTS in upstream main (REUSE error codes)
- `packages/agent-core/src/providers/tools/rate-limit-parser.ts` — EXISTS in upstream main (REUSE for rate limit detection)
- `packages/agent-core/src/providers/openai-provider.ts` — EXISTS in upstream main (REFERENCE pattern)
- `packages/agent-core/src/providers/cloud-provider-base.ts` — EXISTS in upstream main (REFERENCE pattern)

**Key Patterns to Adopt**:
- Connection validation using `/v1/models` endpoint
- Graceful handling of HTTP status codes (401, 403, 404)
- Timeout configuration for network requests
- User-configurable base URL, API key, and model name
- Error handling from upstream `provider-errors.ts`
- Rate limit parsing from upstream `tools/rate-limit-parser.ts`

**Patterns to Avoid**:
- Storing API keys in plaintext configuration files
- Blocking main thread during connection tests
- Lacking proper error handling for network failures
- Naming our entity `ProviderConfig` (conflicts with upstream)