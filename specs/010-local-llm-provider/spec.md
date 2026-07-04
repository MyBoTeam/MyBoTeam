# Feature Specification: Local LLM Provider (Ollama/LMStudio)

**Feature Branch**: `010-local-llm-provider`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-154/m4-3-local-llm-provider-ollamalmstudio"

## Mission Brief

**Goal**: Enable MyBot to use local LLM providers (Ollama and LMStudio) as alternatives to cloud-based APIs for offline development and cost reduction.

**Success Criteria**:
- Ollama and LMStudio providers pass all ProviderClient contract tests
- Chat completion requests to local providers return valid responses within 30 seconds
- Streaming responses deliver first token within 5 seconds of request initiation

**Constraints**:
- Local providers must expose OpenAI-compatible API endpoints at /v1/chat/completions
- Model downloads are out of scope (providers have models pre-loaded)
- Auto-discovery scans only localhost ports (11434 for Ollama, 1234 for LMStudio)

## Clarifications

### Session 2026-07-02

- Q: How should local providers be uniquely identified in the system? → A: User-assigned name + endpoint URL
- Q: What observability (logging/metrics) should local provider implementations include? → A: Full observability with structured logs + metrics (latency histograms, token counters)
- Q: Should the providers support specific OpenAI API versions, or be tolerant of variations? → A: Auto-detect provider capabilities at connect time
- Q: How should local providers handle rate limiting (if the provider imposes limits)? → A: Respect provider's rate limit headers if present
- Q: Should local providers support authentication (e.g., API keys for secured local instances)? → A: Support API key + custom headers for authentication

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Ollama Provider (Priority: P1)

As a developer running Ollama locally, I want to configure MyBot to use my local Ollama instance as an LLM provider so that I can run AI-powered tasks without relying on cloud APIs.

**Why this priority**: Ollama is the most common local LLM runtime. Supporting it first enables developers to work offline and avoid API costs during development.

**Independent Test**: Can be fully tested by configuring an Ollama provider endpoint, listing available models, and completing a chat request against a local Ollama instance.

**Acceptance Scenarios**:

1. **Given** Ollama is running locally on default port 11434, **When** the user configures the Ollama provider with the endpoint URL, **Then** the system connects and lists available models
2. **Given** the Ollama provider is configured, **When** the user sends a chat completion request, **Then** the system returns a valid response from the local model
3. **Given** the Ollama provider is configured, **When** the user streams a chat response, **Then** tokens are received incrementally as they are generated

---

### User Story 2 - Configure LMStudio Provider (Priority: P2)

As a developer using LMStudio, I want to configure MyBot to use my local LMStudio server as an LLM provider so that I can leverage LMStudio's model management and UI features.

**Why this priority**: LMStudio is a popular alternative with a user-friendly interface for model management. Supporting it broadens the local LLM ecosystem.

**Independent Test**: Can be fully tested by configuring an LMStudio provider endpoint and completing a chat request against a running LMStudio server.

**Acceptance Scenarios**:

1. **Given** LMStudio is running on default port 1234, **When** the user configures the LMStudio provider with the endpoint URL, **Then** the system connects and lists available models
2. **Given** the LMStudio provider is configured, **When** the user sends a chat completion request, **Then** the system returns a valid response from the loaded model

---

### User Story 3 - Auto-Detect Local Provider (Priority: P3)

As a developer, I want MyBot to automatically detect running local LLM providers so that I don't have to manually configure endpoints for common setups.

**Why this priority**: Auto-detection improves user experience by reducing configuration overhead, but manual configuration is sufficient for the MVP.

**Independent Test**: Can be tested by starting a local Ollama or LMStudio instance and verifying the system discovers it without manual configuration.

**Acceptance Scenarios**:

1. **Given** Ollama is running on localhost:11434, **When** the user opens provider settings, **Then** the system shows Ollama as a discovered provider
2. **Given** no local providers are running, **When** the user opens provider settings, **Then** the system shows manual configuration options

---

### Edge Cases

- What happens when the local provider is not running when a request is made?
- How does the system handle models that are still downloading/loading in Ollama?
- What happens when the local provider has insufficient memory for the requested model?
- How does the system handle connection timeouts when the local provider is slow to respond?
- What happens when the local provider returns an OpenAI-compatible response format that differs slightly from the expected schema?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement the ProviderClient interface (from spec 009) for Ollama provider
- **FR-002**: System MUST implement the ProviderClient interface (from spec 009) for LMStudio provider
- **FR-003**: System MUST support configuring local provider endpoints (host, port, protocol)
- **FR-004**: System MUST discover available models from local providers via their API endpoints
- **FR-005**: System MUST support chat completion requests against local providers
- **FR-006**: System MUST support streaming responses from local providers
- **FR-007**: System MUST handle connection errors when local providers are unreachable
- **FR-008**: System MUST map local provider error responses to ProviderError types (from spec 009)
- **FR-009**: System MUST support OpenAI-compatible API endpoints at /v1/chat/completions for all local providers (Ollama, LMStudio, and future providers)
- **FR-010**: System MUST validate that local provider responses conform to expected schemas, returning ValidationError on mismatch
- **FR-011**: System MUST provide contract tests for both Ollama and LMStudio provider implementations
- **FR-012**: System MUST support optional auto-discovery of local providers on localhost via TCP port scanning (Ollama: 11434, LMStudio: 1234) with health check validation
- **FR-013**: System MUST auto-detect provider capabilities at connect time by probing /v1/models endpoint and testing streaming support, detecting streaming, tools, vision, and maxContextWindow within 2 seconds of initial connection
- **FR-014**: System MUST NOT include retry logic in provider implementations — error types carry sufficient context for callers to implement their own retry strategy (consistent with spec 009)
- **FR-015**: System MUST include structured JSON logging at debug level with request metadata (model, duration_ms, tokens_used, provider_name, success)
- **FR-016**: System MUST emit metrics including request latency histogram (provider_request_duration_ms) and token counter (provider_tokens_total) using existing project metrics infrastructure
- **FR-017**: System MUST respect provider's rate limit headers (X-RateLimit-Remaining, X-RateLimit-Reset) when present, including them in RateLimitError responses; no enforcement when headers absent
- **FR-018**: System MUST support optional authentication via API key (transmitted via Authorization header) and custom headers (transmitted as-is) for secured local instances, stored in application settings system

### Key Entities

- **OllamaProvider**: ProviderClient implementation for Ollama local LLM runtime, communicating via OpenAI-compatible API endpoints
- **LMStudioProvider**: ProviderClient implementation for LMStudio local LLM runtime, communicating via OpenAI-compatible API endpoints
- **LocalProviderConfig**: Configuration type for local providers, including unique name (user-assigned identifier), endpoint URL, optional API key, custom headers for authentication, and timeout settings. Provider identity is the combination of name + endpoint URL.
- **ProviderDiscovery**: Service that scans common local ports to detect running LLM providers

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ollama provider passes all ProviderClient contract tests
- **SC-002**: LMStudio provider passes all ProviderClient contract tests
- **SC-003**: Chat completion requests to local providers return valid responses within 30 seconds for prompts under 1000 tokens with single-turn conversation
- **SC-004**: Streaming responses deliver first token within 5 seconds from HTTP request sent to first SSE token received
- **SC-005**: Connection errors are caught and returned as typed ProviderError with category "network"
- **SC-006**: Model listing returns available models within 2 seconds
- **SC-007**: Auto-discovery detects running providers within 5 seconds
- **SC-008**: All lint checks pass without configuration modifications

## Assumptions

- Both Ollama and LMStudio expose OpenAI-compatible API endpoints at /v1/chat/completions
- Local providers are running on the same machine or accessible via localhost network
- Local providers have models already downloaded and loaded (model download is out of scope)
- The ProviderClient interface from spec 009 is available and stable
- Local providers may have slight variations in OpenAI-compatible API responses that need tolerance
- Auto-discovery scans common ports (11434 for Ollama, 1234 for LMStudio) on localhost
- Configuration will be stored in the application's settings system (existing infrastructure)
