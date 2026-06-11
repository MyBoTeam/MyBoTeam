# Contract: Task Harness Runtime

## Purpose

Define the runtime contract that both the current OpenCode harness and the new Pi harness must satisfy for MyBoTeam task execution.

## Runtime Interface

The concrete implementation may keep existing class names, but task-manager routing must depend on a harness-neutral adapter contract equivalent to:

```typescript
export interface TaskRuntimeAdapter {
  startTask(config: TaskConfig): Promise<Task>;
  resumeSession?(sessionId: string, prompt: string): Promise<Task>;
  sendResponse(response: PermissionResponse): Promise<void>;
  cancelTask(): Promise<void>;
  interruptTask(): Promise<void>;
  getSessionId(): string | null;
  getTaskId(): string | null;
  getModelContext?(): { modelId?: string; providerId?: string };
  readonly running: boolean;
  dispose(): void;
}
```

## Event Contract

The adapter must emit or forward behavior compatible with existing task callbacks:

```typescript
type TaskRuntimeEvent =
  | { type: 'message'; message: OpenCodeCompatibleMessageOrMappedTaskMessage }
  | { type: 'progress'; progress: { stage: string; message?: string; modelName?: string } }
  | { type: 'permission-request'; request: PermissionRequest }
  | { type: 'complete'; result: TaskResult }
  | { type: 'error'; error: Error }
  | { type: 'debug'; log: { type: string; message: string; data?: unknown } }
  | { type: 'todo:update'; todos: TodoItem[] }
  | { type: 'auth-error'; error: { providerId: string; message: string } }
  | { type: 'browser-frame'; frame: BrowserFramePayload }
  | { type: 'reasoning'; text: string }
  | { type: 'tool-use'; toolName: string; toolInput: unknown }
  | { type: 'tool-call-complete'; data: ToolCallComplete }
  | { type: 'step-finish'; data: StepFinish };
```

## Pi Event Mapping

| Pi Event | MyBoTeam Output |
|----------|-----------------|
| `agent_start` | `progress` stage `starting` or `thinking` after setup |
| `turn_start` | `progress` stage `thinking` |
| `message_start` user | no duplicate if initial user message already stored |
| `message_update` text delta | assistant task message/batched message |
| `message_update` thinking delta | `reasoning` callback |
| `tool_execution_start` | `tool-use` callback and running tool task message |
| `tool_execution_update` | updated tool task message where meaningful |
| `tool_execution_end` | `tool-call-complete` and completed/error tool task message |
| `turn_end` | `step-finish` with model/tokens/cost when available |
| `agent_end` | `complete` result unless already failed/interrupted/cancelled |

## Permission Contract

- High-risk tool actions must call the existing permission request flow before execution.
- Pi `beforeToolCall` must block denied actions with `{ block: true, reason }`.
- Low-risk safe actions may execute directly only when current policy permits.
- WhatsApp/background sources without approval surface must auto-deny exactly as current behavior requires.

## Failure Contract

- Pi startup/pre-result failure after Pi routing is active produces a clear failed task.
- No automatic fallback to OpenCode is allowed.
- Cancelled tasks reach `cancelled`; interrupted tasks reach `interrupted`; model/runtime errors reach `failed`.
- Current harness remains runnable for diagnostics but is not a normal fallback.

## Secret Safety Contract

- Adapter logs must redact provider secrets, connector tokens, credential material, prompt-private sensitive data, and raw tool outputs where they could contain secrets.
- Validation evidence may link to sanitized log excerpts only.

## Validation Contract

- Unit tests must cover Pi event mapping and failure states.
- Integration tests must cover task start, completion, error, cancel, interrupt, permission request, and tool execution.
- Live regression must cover all current providers/models, tools, MCP capabilities, connectors, and task sources, except maintainer-approved exclusions or gaps.
