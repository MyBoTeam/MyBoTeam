# Feature Specification: OpenAI + Anthropic Providers

**Feature Branch**: `MAO-153`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-153/m4-2-openai-anthropic-providers"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - OpenAI Provider Implementation (Priority: P1)

As a developer using the MyBoteam daemon, I need an OpenAI provider implementation that satisfies the ProviderClient interface so that I can send chat requests to OpenAI models (GPT-4o, GPT-4, etc.) and receive responses with proper streaming support.

**Why this priority**: OpenAI is the most widely used LLM provider. Implementing it first delivers immediate value and validates the ProviderClient interface design from MAO-152.

**Independent Test**: Can be fully tested by calling chatCompletion and streamChat methods with mocked OpenAI API responses, verifying correct request formatting and response parsing.

**Acceptance Scenarios**:

1. **Given** a configured OpenAI provider with valid API key, **When** chatCompletion is called with a ChatRequest, **Then** it returns a ChatResponse with the assistant's message content
2. **Given** a configured OpenAI provider, **When** streamChat is called, **Then** it returns an AsyncIterable that yields StreamingChunk objects with incremental text content
3. **Given** a configured OpenAI provider, **When** chatCompletion is called with tool definitions, **Then** it correctly extracts tool calls from the response
4. **Given** an invalid API key, **When** any method is called, **Then** it returns a ProviderError with category 'auth'

---

### User Story 2 - Anthropic Provider Implementation (Priority: P1)

As a developer using the MyBoteam daemon, I need an Anthropic provider implementation that satisfies the ProviderClient interface so that I can send chat requests to Claude models and receive responses with proper streaming support.

**Why this priority**: Anthropic/Claude is the second major LLM provider. Both providers are required for the LLM layer milestone (M4).

**Independent Test**: Can be fully tested by calling chatCompletion and streamChat methods with mocked Anthropic API responses, verifying correct request formatting and response parsing.

**Acceptance Scenarios**:

1. **Given** a configured Anthropic provider with valid API key, **When** chatCompletion is called with a ChatRequest, **Then** it returns a ChatResponse with the assistant's message content
2. **Given** a configured Anthropic provider, **When** streamChat is called, **Then** it returns an AsyncIterable that yields StreamingChunk objects with incremental text content
3. **Given** a configured Anthropic provider, **When** chatCompletion is called with tool definitions, **Then** it correctly extracts tool calls from the response
4. **Given** an invalid API key, **When** any method is called, **Then** it returns a ProviderError with category 'auth'

---

### User Story 3 - Model Listing (Priority: P2)

As a developer building UI features, I need to list available models from both OpenAI and Anthropic providers so that users can see and select appropriate models for their conversations.

**Why this priority**: Model discovery is needed for settings UI and model selection features, but is secondary to core chat functionality.

**Independent Test**: Can be tested by calling listModels on mock providers and verifying the returned ModelInfo array format.

**Acceptance Scenarios**:

1. **Given** a configured OpenAI provider, **When** listModels is called, **Then** it returns an array of ModelInfo objects with id, name, and provider fields
2. **Given** a configured Anthropic provider, **When** listModels is called, **Then** it returns an array of ModelInfo objects with id, name, and provider fields
3. **Given** a provider with no accessible models, **When** listModels is called, **Then** it returns an empty array without throwing

---

### User Story 4 - Error Handling with Retries (Priority: P2)

As a developer, I need proper error handling that distinguishes between different failure modes so that I can implement appropriate retry strategies and display meaningful error messages to users.

**Why this priority**: Robust error handling improves user experience and system reliability, but is secondary to core functionality.

**Independent Test**: Can be tested by simulating various API errors and verifying correct ProviderError categories and retryable flags.

**Acceptance Scenarios**:

1. **Given** a rate-limited request (HTTP 429), **When** the provider returns a rate limit error, **Then** the system returns a ProviderError with category 'rate_limit' and retryable flag set to true
2. **Given** a network timeout, **When** the request exceeds the configured timeout, **Then** the system returns a ProviderError with category 'network'
3. **Given** a provider returning HTTP 500, **When** the request fails, **Then** the system returns a ProviderError with category 'provider' and retryable flag set to true
4. **Given** a retryable error, **When** the caller implements retry logic, **Then** the request can be successfully retried

---

### User Story 5 - Provider Health Checks and Metrics (Priority: P2)

As a developer monitoring system health, I need provider health check capabilities and basic metrics so that I can verify provider connectivity and track usage patterns.

**Why this priority**: Health checks and metrics enable operational visibility and proactive issue detection.

**Independent Test**: Can be tested by calling healthCheck method and verifying metrics emission.

**Acceptance Scenarios**:

1. **Given** a configured provider, **When** healthCheck is called, **Then** it returns a ProviderHealth object with healthy status, latency, and timestamp
2. **Given** a provider making requests, **When** requests complete, **Then** basic metrics are emitted (duration, tokens, errors)

---

### Edge Cases

- **Given** the LLM provider returns a response that doesn't match the expected schema, **When** the response is parsed, **Then** the system returns a ProviderError with category 'provider' and the raw response in error details
- **Given** a streaming response contains partial JSON in tool call arguments, **When** the stream completes, **Then** the system aggregates all chunks into a complete ToolCall object
- **Given** a provider is temporarily unavailable during a streaming response, **When** the connection drops, **Then** the system yields a final StreamingChunk with an error and terminates the stream gracefully
- **Given** concurrent streaming requests to the same provider, **When** maxConcurrent limit is reached, **Then** new requests queue and respect the concurrency limit
- **Given** a valid API key but non-existent model ID, **When** a request is made, **Then** the system returns a ProviderError with category 'not_found' and attempts model fallback if enabled

## Out of Scope

The following capabilities are explicitly excluded from this feature:
- Load balancing across multiple API keys or providers
- Response caching
- Prompt templates or prompt management
- Multi-provider failover (automatic switching between OpenAI and Anthropic)
- Cost tracking or token usage optimization

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement `OpenAIProvider` class satisfying the ProviderClient interface
- **FR-002**: System MUST implement `AnthropicProvider` class satisfying the ProviderClient interface
- **FR-003**: System MUST use official SDK packages (`openai` and `@anthropic-ai/sdk`) for API communication
- **FR-004**: System MUST support SSE streaming for both providers via streamChat method
- **FR-005**: System MUST extract and aggregate tool calls from SSE streaming response chunks into complete ToolCall objects (note: FR-004 covers the SSE transport itself; this requirement covers parsing tool call data from the streamed chunks)
- **FR-006**: System MUST implement model fallback pattern from v0.2.0: try requested model → try without date suffix → try fallback model
- **FR-007**: System MUST accept configurable timeout per request with default of 120000ms
- **FR-008**: System MUST return typed ProviderError with appropriate category for all failure modes
- **FR-009**: System MUST implement listModels returning ModelInfo array from provider API
- **FR-010**: System MUST provide unit tests with mocked API responses for both providers
- **FR-011**: System MUST provide contract tests validating ProviderClient interface compliance
- **FR-012**: System MUST implement provider health check method returning connectivity status
- **FR-013**: System MUST emit basic metrics for request duration, token usage, and error rates
- **FR-014**: System MUST enforce max 10 concurrent requests per provider, configurable via ProviderConfig

### Key Entities

- **OpenAIProvider**: ProviderClient implementation for OpenAI API. Uses `openai` npm package.
- **AnthropicProvider**: ProviderClient implementation for Anthropic API. Uses `@anthropic-ai/sdk` npm package.
- **ProviderConfig**: Configuration for provider initialization including:
  - `apiKey`: API key for authentication (required)
  - `baseUrl`: Custom API endpoint URL (optional, provider default used if omitted)
  - `defaultModel`: Default model ID for requests (optional, can be overridden per request)
  - `organizationId`: Organization ID for OpenAI (optional)
  - `customHeaders`: Additional HTTP headers to include in requests (optional)
  - `proxy`: Proxy configuration for network requests (optional)
  - `retry`: Retry configuration including max attempts, delay, and backoff strategy (optional)
  - `maxConcurrent`: Maximum concurrent requests per provider (optional, default: 10, min: 1, max: 50)
  - `timeout`: Request timeout in milliseconds (optional, default: 120000)
- **ModelFallback**: Strategy pattern for trying alternative models on failure. Fallback models:
  - OpenAI: `gpt-4o`
  - Anthropic: `claude-sonnet-4-20250514`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: OpenAI provider implements all ProviderClient methods (chatCompletion, streamChat, listModels)
- **SC-002**: Anthropic provider implements all ProviderClient methods (chatCompletion, streamChat, listModels)
- **SC-003**: Unit test coverage >= 90% for both provider implementations
- **SC-004**: Contract tests pass for both providers against ProviderClient interface
- **SC-005**: All lint checks pass without configuration modifications
- **SC-006**: Both providers handle streaming with < 100ms time-to-first-chunk (TTFC) measured from when the request is sent to the provider API until the first StreamingChunk is yielded by the generator
- **SC-007**: Health check method returns accurate connectivity status within 5 seconds including network round-trip to provider API endpoint
- **SC-008**: Basic metrics emitted for 100% of completed requests

## Assumptions

- ProviderClient interface from MAO-152 is stable and complete
- Official SDK packages (`openai`, `@anthropic-ai/sdk`) are available as project dependencies
- API keys are stored in the encrypted vault (existing infrastructure)
- The daemon process has network access to api.openai.com and api.anthropic.com
- Model IDs follow provider conventions (e.g., "gpt-4o", "claude-sonnet-4-20250514")
- Contract tests will use the existing test framework consistent with project infrastructure
- SDK packages (`openai`, `@anthropic-ai/sdk`) manage API version negotiation internally

## Clarifications

### Session 2026-07-02

- Q: What should be explicitly declared as out of scope for this feature? → A: Core + retry + health checks + basic metrics. No: load balancing, caching, prompt templates
- Q: What configuration options should ProviderConfig include beyond API key and base URL? → A: API key + base URL + default model + org ID + custom headers + proxy + retry config
- Q: What are the concurrency limits for provider requests? → A: Max 10 concurrent requests per provider, configurable
- Q: Which API versions should be targeted for OpenAI and Anthropic? → A: Latest stable versions. SDK packages manage API version negotiation
- Q: What should the default fallback models be when the requested model fails? → A: OpenAI: gpt-4o, Anthropic: claude-sonnet-4-20250514
