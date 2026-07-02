# Data Model: ProviderClient Interface

**Date**: 2026-07-02
**Feature**: M4-1 ProviderClient Interface

## Entities

### ProviderClient (Interface)

Core interface that all LLM provider implementations must satisfy.

```typescript
interface ProviderClient {
  chatCompletion(request: ChatRequest): Promise<ChatResponse>;
  streamChat(request: ChatRequest): AsyncIterable<StreamingChunk>;
  listModels(): Promise<ModelInfo[]>;
}
```

### ChatRequest

Input type for chatCompletion and streamChat methods.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| messages | ChatMessage[] | Yes | Conversation history |
| model | string | Yes | Model identifier (e.g., "gpt-4o", "claude-sonnet-4-20250514") |
| tools | ToolDefinition[] | No | Available tools for function calling |
| timeout | number | No | Request timeout in milliseconds (default: 120000) |

### ChatMessage

A single message in the conversation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| role | "system" \| "user" \| "assistant" | Yes | Message role |
| content | string | Yes | Text content |
| toolCalls | ToolCall[] | No | Tool invocations (assistant messages only) |
| toolCallId | string | No | ID of tool call being responded to (tool messages only) |

### ChatResponse

Output type for chatCompletion.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | Yes | Assistant's response text |
| toolCalls | ToolCall[] | No | Tool invocations requested by model |
| finishReason | "stop" \| "tool_calls" \| "length" | Yes | Why generation stopped |
| usage | UsageInfo | No | Token usage information |

### UsageInfo

Token usage statistics.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| promptTokens | number | Yes | Tokens in the prompt |
| completionTokens | number | Yes | Tokens generated |
| totalTokens | number | Yes | Total tokens used |

### StreamingChunk

Incremental piece of a streaming response.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| textDelta | string | No | Text delta to append |
| toolCallDelta | ToolCallDelta | No | Partial tool call data |
| finishReason | "stop" \| "tool_calls" \| "length" | No | Present on final chunk |

### ToolCallDelta

Partial tool call data for streaming.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| index | number | Yes | Tool call index (for multiple concurrent calls) |
| name | string | No | Tool name (first chunk only) |
| argumentsDelta | string | No | Partial JSON arguments |

### ToolDefinition

Description of an available tool.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Tool name (must be unique per request) |
| description | string | Yes | Human-readable description |
| parameters | JSON Schema | Yes | Parameter schema in JSON Schema format |

### ToolCall

A tool invocation returned by the model.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier for this tool call |
| name | string | Yes | Tool name matching a ToolDefinition |
| arguments | Record<string, unknown> | Yes | Parsed arguments object |

### ModelInfo

Metadata about an available model.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Model identifier (e.g., "gpt-4o") |
| displayName | string | Yes | Human-readable name (e.g., "GPT-4o") |
| contextWindow | number | No | Maximum context length in tokens |
| capabilities | ModelCapabilities | No | Supported features |

### ModelCapabilities

Feature flags for a model.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tools | boolean | No | Supports tool/function calling |
| vision | boolean | No | Supports image input |

### ProviderError (Discriminated Union)

Error types with category-specific fields.

| Category | Additional Fields | Description |
|----------|-------------------|-------------|
| `auth` | `message: string` | Authentication failure (invalid API key) |
| `rate_limit` | `retryAfter?: number` | Rate limited, retry after milliseconds |
| `network` | `message: string`, `cause?: Error` | Network/timeout error |
| `provider` | `message: string`, `statusCode: number`, `providerError?: unknown` | Provider-specific error |

## Relationships

```
ProviderClient
├── chatCompletion(ChatRequest) → ChatResponse
├── streamChat(ChatRequest) → AsyncIterable<StreamingChunk>
└── listModels() → ModelInfo[]

ChatRequest
├── messages: ChatMessage[]
└── tools: ToolDefinition[]

ChatResponse
└── toolCalls: ToolCall[]

ChatMessage
└── toolCalls: ToolCall[] (assistant messages)

StreamingChunk
└── toolCallDelta: ToolCallDelta

ModelInfo
└── capabilities: ModelCapabilities
```

## Validation Rules

1. **ChatRequest.messages**: Must be non-empty array
2. **ChatRequest.model**: Must be non-empty string
3. **ChatRequest.timeout**: Must be positive number if provided
4. **ChatMessage.role**: Must be one of "system", "user", "assistant"
5. **ToolDefinition.parameters**: Must be valid JSON Schema object
6. **ToolCall.arguments**: Must be parseable object
7. **ModelInfo.id**: Must be non-empty string
8. **ProviderError**: Exactly one category field present (discriminated union)
