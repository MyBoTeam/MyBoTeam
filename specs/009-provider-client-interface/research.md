# Research: ProviderClient Interface

**Date**: 2026-07-02
**Feature**: M4-1 ProviderClient Interface

## Research Tasks

### 1. Source Reference Analysis: v0.2.0 conversation-provider.ts

**Decision**: Adopt v0.2.0 patterns for tool calling and streaming, modernize with TypeScript interfaces and Zod validation.

**Rationale**: The v0.2.0 implementation in `packages/daemon/src/conversation-provider.ts` demonstrates:
- Tool call support with `tools` parameter and tool call extraction (lines 22, 37-38, 54, 147-157)
- SSE streaming with chunk callback (lines 100-176)
- Model fallback strategy (lines 197-221) — appropriate for provider implementations, not the interface
- AbortSignal timeout pattern (line 62)

**Alternatives considered**:
- Starting from scratch: Rejected — would lose proven patterns and break continuity with v0.2.0
- Copying v0.2.0 directly: Rejected — v0.2.0 uses function-based API, not interface-based; lacks type safety

### 2. Runtime Validation Library Selection

**Decision**: Use Zod (already a project dependency).

**Rationale**: 
- Already imported in `packages/types/src/provider.ts`
- Used in schema migrations (per spec assumptions)
- Supports discriminated unions for error types
- TypeScript-first with excellent inference

**Alternatives considered**:
- TypeScript-only (no runtime validation): Rejected — spec requires runtime validation (FR-002, FR-005)
- Other validators (Valibot, Yup): Rejected — Zod is already established in the project

### 3. Streaming Pattern Design

**Decision**: Return `AsyncIterable<StreamingChunk>` from `streamChat` method.

**Rationale**:
- Caller controls iteration and can break early for cancellation
- Matches modern TypeScript async iteration patterns
- No need for AbortSignal parameter — breaking the loop is the cancellation mechanism
- Aligns with Web Streams API direction

**Alternatives considered**:
- Callback-based (like v0.2.0 `onChunk`): Rejected — less composable, harder to handle backpressure
- ReadableStream: Rejected — AsyncIterable is more widely supported and simpler

### 4. Error Type Architecture

**Decision**: Discriminated union with `category` field for error type narrowing.

**Rationale**:
- Enables TypeScript narrowing: `if (error.category === 'rate_limit') { error.retryAfter }`
- Covers 4 required categories: auth, rate_limit, network, provider
- Carries context for caller-side retry (retryAfter for rate limits, request context for network)

**Alternatives considered**:
- Separate error classes: Rejected — harder to serialize and validate with Zod
- Error codes only: Rejected — less type-safe, requires manual mapping

### 5. Tool Definition Schema

**Decision**: JSON Schema format for tool parameter definitions.

**Rationale**:
- Industry standard (OpenAI, Anthropic both use JSON Schema)
- Enables provider implementations to pass through directly
- Zod supports JSON Schema conversion

**Alternatives considered**:
- Zod-only schemas: Rejected — would require conversion for API calls
- Custom format: Rejected — reinventing the wheel

### 6. ModelInfo Capabilities

**Decision**: Optional `capabilities` object with boolean flags.

**Rationale**:
- Enables feature detection without breaking changes
- Flags: `tools` (supports tool calling), `vision` (supports image input)
- `contextWindow` as optional number for model selection logic

**Alternatives considered**
- String array of capabilities: Rejected — less type-safe, harder to validate
- Required fields: Rejected — not all providers expose this information

## Summary of Decisions

| Decision | Choice | Impact |
|----------|--------|--------|
| Validation library | Zod (existing) | No new dependencies |
| Streaming pattern | AsyncIterable | Caller controls lifecycle |
| Error architecture | Discriminated union | Type-safe error handling |
| Tool schema format | JSON Schema | Industry standard compatibility |
| Model capabilities | Optional boolean flags | Forward-compatible design |
