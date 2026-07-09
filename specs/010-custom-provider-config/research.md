# Research: Custom Provider Configuration

## Decision 0: Upstream Infrastructure Reuse (Post-Merge Update)

**Decision**: Reuse upstream's provider infrastructure from main branch instead of porting v0.3.0 `custom.ts`. Port only `utils/url.ts` and `utils/sanitize.ts` from v0.3.0.

**Rationale**:
- Upstream added comprehensive provider infrastructure (base classes, error handling, tools)
- Upstream's `provider-errors.ts` has battle-tested error codes (AUTHENTICATION_ERROR, RATE_LIMIT_ERROR, TIMEOUT_ERROR, CONNECTION_ERROR)
- Upstream's `tools/rate-limit-parser.ts` handles HTTP 429 + Retry-After parsing
- Upstream's `openai-provider.ts` provides better reference pattern than v0.3.0's `custom.ts`
- Avoids naming conflict: upstream's `ProviderConfig` (SDK config) vs our `CustomProviderConfig` (validation state)

**Alternatives considered**:
- **Port v0.3.0 custom.ts**: Rejected — upstream patterns are more comprehensive and follow current architecture
- **Create all utilities from scratch**: Rejected — contradicts Principle III (Simplicity)
- **Keep ProviderConfig naming**: Rejected — would cause confusion with upstream's `ProviderConfig`

**Impact on tasks**:
- Removed T000c (custom.ts port)
- Updated T001 to rename ProviderConfig → CustomProviderConfig
- Updated T020 to reference upstream error codes
- Updated T037 to reuse upstream rate-limit-parser.ts

## Decision 1: Configuration Storage Pattern

**Decision**: Store custom provider configurations as JSON objects in the vault, with API keys encrypted using vault's existing encryption infrastructure when provided. API keys are optional (some endpoints may not require authentication).

**Rationale**: 
- Leverages existing vault infrastructure (Principle III - Simplicity)
- API keys encrypted at rest when provided (Principle V - Security)
- Consistent with existing provider configuration patterns
- Supports CRUD operations for provider management
- Some custom endpoints (e.g., local models) may not require authentication

**Alternatives considered**:
- **Separate encrypted file per provider**: Rejected due to file management complexity and inconsistency with existing patterns
- **Database storage**: Rejected as vault is already the designated secure storage mechanism
- **Environment variables**: Rejected due to security concerns and lack of encryption

## Decision 2: Validation Strategy

**Decision**: Multi-layer validation with immediate feedback:
1. Format validation (URL format, API key format) - synchronous
2. Connectivity validation (test endpoint) - asynchronous with timeout
3. Authentication validation (test API key) - part of connectivity test

**Rationale**:
- Provides immediate feedback for format errors (FR-002)
- Tests connectivity during configuration (FR-003)
- Follows existing validation patterns in custom.ts
- Supports clear error messages (FR-006)

**Alternatives considered**:
- **Deferred validation**: Rejected due to poor user experience
- **Only format validation**: Rejected as it doesn't meet FR-003 requirement
- **Separate validation steps**: Rejected due to unnecessary complexity

## Decision 3: Provider Identification Strategy

**Decision**: Unique identification using combination of URL + user-provided name, with auto-generated UUID as primary key.

**Rationale**:
- Meets clarification requirement: URL + Name uniqueness
- UUID provides stable internal reference
- User-provided name allows friendly identification
- URL ensures endpoint uniqueness

**Alternatives considered**:
- **URL-only uniqueness**: Rejected per clarification (user chose URL + Name)
- **Name-only uniqueness**: Rejected per clarification (user chose URL + Name)
- **Auto-generated ID only**: Rejected as it lacks user-friendly identification

## Decision 4: State Management

**Decision**: Three-state lifecycle: Active, Inactive, Error

**Rationale**:
- Meets clarification requirement
- Active: Provider configured and ready for use
- Inactive: Provider temporarily disabled by user
- Error: Provider configuration invalid or connection failed

**Alternatives considered**:
- **Draft state**: Rejected per clarification (user chose Active/Inactive/Error only)
- **More complex state machine**: Rejected due to unnecessary complexity

## Decision 5: Response Format Handling

**Decision**: Auto-detect and transform common response format variations from OpenAI-compatible providers.

**Rationale**:
- Meets clarification requirement
- Supports OpenAI-compatible API format (FR-005)
- Handles common variations without manual configuration
- Graceful degradation for non-standard formats

**Alternatives considered**:
- **Strict OpenAI-only**: Rejected per clarification (user chose auto-detect/transform)
- **Manual format configuration**: Rejected due to poor user experience
- **Passthrough raw responses**: Rejected as it doesn't meet transformation requirement

## Decision 6: Error Handling Patterns

**Decision**: Comprehensive error handling with:
1. Network errors: Timeout, connection refused, DNS resolution
2. Authentication errors: 401, 403 status codes
3. Validation errors: Invalid URL, missing required fields
4. Rate limiting: Detection and user notification

**Rationale**:
- Meets edge case requirements from spec
- Follows existing error handling patterns in custom.ts
- Provides clear, actionable error messages
- Supports graceful degradation

**Alternatives considered**:
- **Generic error messages**: Rejected due to poor user experience
- **No error handling**: Rejected as it would lead to poor reliability
- **Only critical errors**: Rejected as it doesn't meet spec requirements

## Decision 7: Testing Strategy

**Decision**: Three-layer testing approach:
1. Unit tests: Validation logic, configuration management
2. Contract tests: Provider interface compliance
3. Integration tests: Vault storage, connection tests

**Rationale**:
- Meets test requirements from spec
- Follows Principle II (Test-First Quality)
- Provides comprehensive coverage
- Supports independent testability per user stories

**Alternatives considered**:
- **Only unit tests**: Rejected as it doesn't meet contract/integration test requirements
- **Only integration tests**: Rejected due to slow feedback and lack of isolation
- **Manual testing only**: Rejected as it doesn't meet automation requirements