# Feature Specification: ProviderClient Interface

**Feature Branch**: `MAO-152`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-152/m4-1-providerclient-interface"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define ProviderClient Interface (Priority: P1)

As a developer building LLM integration features, I need a standardized interface for communicating with LLM providers so that all provider implementations follow a consistent contract and can be swapped without changing consuming code.

**Why this priority**: This is the foundational interface that all subsequent LLM features (M4-2 through M4-5) depend on. Without it, no provider-specific implementations can be built.

**Independent Test**: Can be fully tested by verifying the interface definition exists with correct method signatures and type constraints, and that contract tests pass against mock implementations.

**Acceptance Scenarios**:

1. **Given** a developer wants to create a new LLM provider implementation, **When** they implement the ProviderClient interface, **Then** they must provide implementations for chatCompletion, streamChat, and listModels methods
2. **Given** the interface is defined, **When** a consuming module imports ProviderClient, **Then** it receives complete type information for all methods and return types
3. **Given** the interface exists, **When** contract tests run against any implementation, **Then** all required methods are present and correctly typed

---

### User Story 2 - Type-Safe Request/Response Validation (Priority: P1)

As a developer, I need request and response types validated at runtime using schema definitions so that malformed data from LLM providers is caught early with clear error messages rather than causing silent failures downstream.

**Why this priority**: Type safety is a core acceptance criterion. Runtime validation prevents hard-to-debug issues when LLM APIs return unexpected formats.

**Independent Test**: Can be tested by passing valid and invalid data through validation schemas and verifying correct acceptance/rejection behavior.

**Acceptance Scenarios**:

1. **Given** a chat completion request, **When** the request is validated against the schema, **Then** invalid fields are rejected with descriptive error messages
2. **Given** an LLM provider response, **When** the response is parsed through the response schema, **Then** unexpected fields are stripped and missing required fields cause validation errors
3. **Given** a streaming response, **When** the caller breaks out of the iteration, **Then** the underlying connection is cleaned up without error

---

### User Story 3 - Provider Error Handling (Priority: P2)

As a developer, I need well-defined error types so that I can distinguish between different failure modes (auth errors, rate limits, model not found, network errors) and handle each appropriately in the UI.

**Why this priority**: Proper error handling improves user experience by enabling targeted error messages and retry strategies.

**Independent Test**: Can be tested by triggering each error type and verifying the correct error category is returned.

**Acceptance Scenarios**:

1. **Given** an invalid API key, **When** the provider returns a 401, **Then** the system returns an AuthenticationError with a clear message
2. **Given** a rate-limited request, **When** the provider returns a 429, **Then** the system returns a RateLimitError with retry-after information when available
3. **Given** a network timeout, **When** the request exceeds the configured timeout, **Then** the system returns a NetworkError with the original request context

---

### User Story 4 - Model Listing (Priority: P2)

As a developer, I need a method to list available models from a provider so that the UI can display model options and users can select appropriate models.

**Why this priority**: Model discovery is needed for the settings UI and model selection features.

**Independent Test**: Can be tested by calling listModels on a mock provider and verifying the returned model list format.

**Acceptance Scenarios**:

1. **Given** a configured provider, **When** listModels is called, **Then** it returns a list of model identifiers with display names
2. **Given** a provider with no models available, **When** listModels is called, **Then** it returns an empty array without error

---

### Edge Cases

- What happens when the LLM provider returns a response that doesn't match the expected schema?
- How does the system handle concurrent streaming requests to the same provider?
- What happens when a provider is temporarily unavailable during a streaming response?
- How does the system handle partial JSON in streaming responses?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define a ProviderClient interface with methods: chatCompletion, streamChat, listModels
- **FR-002**: System MUST define runtime validation schemas for all request and response types used by the interface
- **FR-003**: System MUST define error types covering authentication, rate limiting, network, and provider-specific errors. Implementation uses a discriminated union (ProviderError with category field) rather than separate error classes
- **FR-013**: System MUST NOT include retry logic in the interface — error types carry sufficient context (e.g., retry-after for rate limits) for callers to implement their own retry strategy
- **FR-004**: System MUST provide contract tests that any ProviderClient implementation must pass
- **FR-005**: System MUST enforce type safety at compile time and runtime validation for all interface boundaries
- **FR-006**: System MUST define a ChatMessage type supporting role (system, user, assistant) and content as text string. Tool calls are represented separately in ChatResponse.toolCalls, not within message content
- **FR-009**: System MUST define a ToolDefinition type for declaring available tools in chat requests
- **FR-010**: System MUST define a ToolCall type representing a tool invocation with name and parsed arguments
- **FR-011**: System MUST include tool definitions as an optional field in ChatRequest and tool calls as an optional field in ChatResponse
- **FR-007**: System MUST define a StreamingChunk type for incremental streaming responses, including text content, optional tool call deltas, finish reason, and optional usage stats
- **FR-012**: System MUST define streamChat to accept a ChatRequest and return an AsyncIterable of StreamingChunk, allowing callers to control iteration and break early for cancellation
- **FR-014**: System MUST accept an optional timeout parameter (in milliseconds) on chatCompletion and streamChat, with a default of 120000ms (120 seconds)
- **FR-008**: System MUST define a ModelInfo type for model listing responses, including id, displayName, and optional fields for contextWindow (number) and capabilities (object indicating supported features like tool use, vision)

### Key Entities

- **ProviderClient**: The core interface that all LLM provider implementations must satisfy. Defines the contract for chat completion, streaming, and model listing.
- **ChatRequest**: Input type for both chatCompletion and streamChat methods, containing messages, model selection, optional tool definitions, and optional timeout.
- **ChatResponse**: Output type for chatCompletion, containing the assistant's response text and optional tool call invocations.
- **StreamingChunk**: Incremental piece of a streaming response, containing optional text content, optional tool call delta, finish reason, and optional usage stats.
- **ModelInfo**: Metadata about an available model, including identifier and display name.
- **ProviderError**: Discriminated union of error types with category-specific fields.
- **ToolDefinition**: Description of an available tool including name, description, and parameter schema.
- **ToolCall**: A tool invocation returned by the model, containing the tool name and parsed arguments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ProviderClient interface is implemented with all three required methods (chatCompletion, streamChat, listModels)
- **SC-002**: All request/response types have corresponding runtime validation schemas with validation logic
- **SC-003**: Contract tests pass for a mock ProviderClient implementation
- **SC-004**: Error types cover at least 4 failure categories (auth, rate limit, network, provider)
- **SC-005**: Type checking succeeds with strict mode enabled
- **SC-006**: All lint checks pass without configuration modifications

## Assumptions

- The ProviderClient interface will be consumed by daemon-internal modules, not exposed as a public API
- LLM provider implementations (OpenAI, Anthropic) will be separate features (M4-2, M4-3)
- The interface is designed for single-provider-at-a-time usage, not multi-provider aggregation
- Streaming uses Server-Sent Events (SSE) format consistent with OpenAI and Anthropic APIs
- A runtime validation library is already available as a project dependency (used in schema migrations)
- Contract tests will use the existing test framework consistent with project infrastructure

## Clarifications

### Session 2026-07-02

- Q: Should the ProviderClient interface include explicit support for tool/function calling? → A: Include tool definitions in requests and tool call results in responses as core interface capabilities
- Q: How should the streaming method handle cancellation and backpressure? → A: Method returns an AsyncIterable; caller controls iteration and can break early
- Q: Should the interface define retry semantics for transient errors? → A: No retry in interface — return typed errors, callers decide retry strategy
- Q: What metadata should ModelInfo include beyond identifier and display name? → A: Include contextWindow (number) and capabilities (tool support, vision, etc.) as optional fields
- Q: Should the interface accept a configurable request timeout? → A: Optional timeout parameter per request with default (120s)
