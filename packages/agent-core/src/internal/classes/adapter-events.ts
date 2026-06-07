import type {
  AssistantMessage,
  Event as OpenCodeSdkEvent,
  Message as OpenCodeSdkMessage,
  Part as OpenCodeSdkPart,
  PermissionRequest as OpenCodeSdkPermissionRequest,
  QuestionRequest as OpenCodeSdkQuestionRequest,
  ToolPart,
} from '@opencode-ai/sdk/v2';
import type { TodoItem } from '../../common/types/todo.js';
import { CompletionFlowState } from '../../opencode/completion/index.js';
import {
  checkForConnectorAuthMarker,
  handlePermissionAsked,
  handleQuestionAsked,
} from './adapter-permissions.js';
import { markTaskComplete } from './adapter-session.js';
import type { AdapterState } from './adapter-state.js';
import { handleToolPart } from './adapter-tools.js';
import { partToOpenCodeMessage as toMessage } from './adapter-utils.js';

export function handleSdkEvent(state: AdapterState, event: OpenCodeSdkEvent): void {
  state.watchdogActivityCounter += 1;
  switch (event.type) {
    case 'message.updated': {
      const info = (event.properties as { info: OpenCodeSdkMessage }).info;
      handleMessageUpdated(state, info);
      return;
    }
    case 'message.part.updated': {
      const part = (event.properties as { part: OpenCodeSdkPart }).part;
      handlePartUpdated(state, part);
      return;
    }
    case 'message.part.delta': {
      state.sawAssistantProgress = true;
      return;
    }
    case 'permission.asked': {
      const sdkReq = event.properties as OpenCodeSdkPermissionRequest;
      handlePermissionAsked(state, sdkReq);
      return;
    }
    case 'question.asked': {
      const sdkReq = event.properties as OpenCodeSdkQuestionRequest;
      handleQuestionAsked(state, sdkReq);
      return;
    }
    case 'session.error': {
      const props = event.properties as Record<string, unknown>;
      const err = (props.error ?? props) as
        | { message?: string; name?: string; [k: string]: unknown }
        | undefined;
      const msg = err?.message ?? 'Session error';
      const modelCtx = state.currentModelId
        ? ` (provider=${state.currentProviderId ?? 'unknown'}, model=${state.currentModelId})`
        : '';
      const fullMsg = `${msg}${modelCtx}`;
      state.emit('error', new Error(fullMsg));
      markTaskComplete(state, 'error', fullMsg);
      return;
    }
    case 'session.idle': {
      if (state.hasCompleted) return;
      if (!state.awaitingIdle || !state.sawAssistantProgress) return;
      state.awaitingIdle = false;
      const enforcerState = state.completionEnforcer?.getState();
      if (enforcerState === CompletionFlowState.BLOCKED) {
        markTaskComplete(state, 'error', 'Task blocked');
      } else {
        markTaskComplete(state, 'success');
      }
      return;
    }
    case 'todo.updated': {
      const sdkTodos = (event.properties as { todos: Array<Record<string, unknown>> }).todos;
      const todos: TodoItem[] = (sdkTodos ?? []).map((t, idx) => {
        const rawStatus = t.status;
        const status: TodoItem['status'] =
          rawStatus === 'completed' || rawStatus === 'in_progress' || rawStatus === 'cancelled'
            ? rawStatus
            : 'pending';
        const rawPriority = t.priority;
        const priority: TodoItem['priority'] =
          rawPriority === 'high' || rawPriority === 'low' ? rawPriority : 'medium';
        return {
          id: `todo_${idx}_${String(t.content ?? '').slice(0, 32)}`,
          content: String(t.content ?? ''),
          status,
          priority,
        };
      });
      state.emit('todo:update', todos);
      state.completionEnforcer?.updateTodos(todos);
      return;
    }
    default:
      return;
  }
}

export function handleMessageUpdated(state: AdapterState, info: OpenCodeSdkMessage): void {
  const id = (info as { id?: string }).id;
  const role = (info as { role?: string }).role;
  if (id && role) {
    state.messageRoles.set(id, role);
    const orphans = state.pendingTextParts.get(id);
    if (orphans && orphans.length > 0) {
      state.pendingTextParts.delete(id);
      if (role === 'assistant') {
        for (const part of orphans) {
          const synthetic = toMessage(part);
          if (synthetic) state.emit('message', synthetic);
        }
      }
    }
  }
  if (info.role === 'assistant') {
    const assistant = info as AssistantMessage;
    if (assistant.modelID && !state.currentModelId) {
      state.currentModelId = assistant.modelID;
    }
    if (assistant.providerID && !state.currentProviderId) {
      state.currentProviderId = assistant.providerID;
    }
    state.sawAssistantProgress = true;
  }
}

export function handlePartUpdated(state: AdapterState, part: OpenCodeSdkPart): void {
  if (part.type === 'reasoning') {
    const text = (part as { text?: string }).text;
    if (text) state.emit('reasoning', text);
    return;
  }

  if (part.type === 'text') {
    const messageId = (part as { messageID?: string }).messageID;
    const role = messageId ? state.messageRoles.get(messageId) : undefined;
    if (role === undefined) {
      if (messageId) {
        const bucket = state.pendingTextParts.get(messageId) ?? [];
        bucket.push(part);
        state.pendingTextParts.set(messageId, bucket);
      }
      checkForConnectorAuthMarker(state, (part as { text?: string }).text ?? '');
      return;
    }
    if (role !== 'assistant') {
      checkForConnectorAuthMarker(state, (part as { text?: string }).text ?? '');
      return;
    }
    const synthetic = toMessage(part);
    if (synthetic) {
      state.emit('message', synthetic);
    }
    checkForConnectorAuthMarker(state, (part as { text?: string }).text ?? '');
    return;
  }

  if (part.type === 'tool') {
    handleToolPart(state, part as ToolPart, (text: string) =>
      checkForConnectorAuthMarker(state, text),
    );
    return;
  }

  if (part.type === 'step-finish') {
    const sp = part as {
      reason?: string;
      tokens?: {
        input?: number;
        output?: number;
        reasoning?: number;
        cache?: { read?: number; write?: number };
      };
      cost?: number;
    };
    state.emit('step-finish', {
      reason: sp.reason ?? 'unknown',
      model: state.currentModelId ?? undefined,
      tokens: sp.tokens
        ? {
            input: sp.tokens.input ?? 0,
            output: sp.tokens.output ?? 0,
            reasoning: sp.tokens.reasoning ?? 0,
            ...(sp.tokens.cache
              ? {
                  cache: {
                    read: sp.tokens.cache.read ?? 0,
                    write: sp.tokens.cache.write ?? 0,
                  },
                }
              : {}),
          }
        : undefined,
      cost: sp.cost,
    });
  }
}
