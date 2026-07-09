# Data Model: Custom Provider Configuration

**⚠️ Naming Note**: Upstream's `provider-config.ts` defines `ProviderConfig` (SDK configuration). This document defines `CustomProviderConfig` (validation state tracking) to avoid naming conflict.

## Entities

### CustomProvider

**Description**: Represents a custom LLM provider configuration with connection details and status.

**Fields**:
- `id`: string (UUID) - Primary key, auto-generated
- `name`: string - User-provided name for the provider
- `url`: string - Base URL of the OpenAI-compatible endpoint
- `apiKey`: string | null - Encrypted API key (stored encrypted in vault; null if no auth required)
- `modelName`: string - Default model name for this provider
- `status`: enum - Provider status (Active, Inactive, Error)
- `createdAt`: Date - Configuration creation timestamp
- `updatedAt`: Date - Last modification timestamp
- `lastTestedAt`: Date | null - Last connection test timestamp
- `testResult`: ConnectionTestResult | null - Last connection test result

**Validation Rules**:
- `name`: Required, 1-100 characters, unique per user
- `url`: Required, valid HTTP/HTTPS URL format
- `apiKey`: Optional (some endpoints may not require), max 1024 characters
- `modelName`: Required, 1-256 characters
- `status`: Required, one of: Active, Inactive, Error

**Relationships**:
- Belongs to a user (user association managed by vault)
- Has many ConnectionTestResult (historical test results)

**Uniqueness**:
- Combination of `url` + `name` must be unique per user

**Lifecycle States**:
- **Active**: Provider configured and ready for use
- **Inactive**: Provider temporarily disabled by user
- **Error**: Provider configuration invalid or connection failed

### ConnectionTestResult

**Description**: Records the result of a connection test to a custom provider.

**Fields**:
- `id`: string (UUID) - Primary key, auto-generated
- `providerId`: string - Reference to CustomProvider
- `testedAt`: Date - Test execution timestamp
- `success`: boolean - Whether connection was successful
- `error`: string | null - Error message if test failed
- `responseTime`: number | null - Response time in milliseconds
- `models`: string[] | null - List of available models if successful

**Validation Rules**:
- `providerId`: Required, must reference existing CustomProvider
- `testedAt`: Required, cannot be in the future
- `success`: Required boolean
- `error`: Required if success is false, null if success is true
- `responseTime`: Optional, must be positive if provided
- `models`: Optional, array of non-empty strings

**Relationships**:
- Belongs to CustomProvider

### CustomProviderConfig (renamed from ProviderConfig)

**Description**: Contains validation state for a custom provider configuration. **Note**: This is different from upstream's `ProviderConfig` (SDK configuration) in `provider-config.ts`.

**Fields**:
- `providerId`: string - Reference to CustomProvider
- `validationState`: enum - Current validation state (Valid, Invalid, Pending)
- `lastValidationAt`: Date | null - Last validation timestamp
- `validationErrors`: string[] - List of current validation errors
- `connectionTestResult`: ConnectionTestResult | null - Latest test result

**Validation Rules**:
- `providerId`: Required, must reference existing CustomProvider
- `validationState`: Required, one of: Valid, Invalid, Pending
- `lastValidationAt`: Optional
- `validationErrors`: Required array, empty if validationState is Valid

**Relationships**:
- Belongs to CustomProvider
- Has one ConnectionTestResult (latest)

## State Transitions

**Note**: `CustomProvider.status` and `CustomProviderConfig.validationState` are separate concepts. `status` tracks the provider's operational state (Active/Inactive/Error). `validationState` tracks whether the configuration has been validated (Valid/Invalid/Pending). A provider can be Active but have a Pending validation state, or be Inactive with a Valid validation state.

### CustomProvider Status

```
[Created] → Active
Active ↔ Inactive
Active → Error
Error → Active (after successful re-test)
Error → Inactive (user disables)
```

### Validation State

```
[New] → Pending (during validation)
Pending → Valid (validation passed)
Pending → Invalid (validation failed)
Valid → Pending (re-validation triggered)
Invalid → Pending (re-validation triggered)
```

## Data Volume Assumptions

- **Maximum providers per user**: 50 (from clarification)
- **Maximum API key length**: 1024 characters
- **Maximum URL length**: 2048 characters
- **Maximum model name length**: 256 characters
- **Test result history**: Keep last 10 test results per provider

## Storage Strategy

- **Primary storage**: Vault service (encrypted)
- **API key encryption**: Uses vault's existing encryption infrastructure
- **Configuration JSON**: Stored as structured JSON in vault
- **Test results**: Stored with provider configuration, with cleanup of old results