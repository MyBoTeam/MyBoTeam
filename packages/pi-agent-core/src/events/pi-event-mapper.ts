import type { OpenCodeMessage } from '../adapter/task-runtime-types.js';
import type {
  PiAssistantMessage,
  PiAssistantMessageEvent,
  PiMappedAdapterEvent,
  PiToolCall,
} from './pi-event-types.js';

type StepFinishPayload = Extract<PiMappedAdapterEvent, { event: 'step-finish' }>['args'][0];

export interface PiEventMappingContext {
  messageId: string;
  sessionId: string;
  taskId?: string;
}

export function mapPiAssistantEvent(
  event: PiAssistantMessageEvent,
  context: PiEventMappingContext,
): PiMappedAdapterEvent[] {
  switch (event.type) {
    case 'text_delta':
      return [messageEvent(createTextMessage(event.delta, context, event.partial.timestamp))];
    case 'thinking_delta':
      return [{ event: 'reasoning', args: [event.delta] }];
    case 'toolcall_start':
    case 'toolcall_delta':
      return mapToolPartial(event.partial, event.contentIndex, context);
    case 'toolcall_end':
      return mapToolCallEnd(event, context);
    case 'done':
      return mapDoneEvent(event);
    case 'error':
      return mapErrorEvent(event);
    default:
      return [];
  }
}

function createTextMessage(
  text: string,
  context: PiEventMappingContext,
  timestamp?: number,
): OpenCodeMessage {
  return {
    type: 'text',
    timestamp,
    sessionID: context.sessionId,
    part: {
      id: `${context.messageId}-text`,
      sessionID: context.sessionId,
      messageID: context.messageId,
      type: 'text',
      text,
    },
  };
}

function messageEvent(message: OpenCodeMessage): PiMappedAdapterEvent {
  return { event: 'message', args: [message] };
}

function mapToolPartial(
  partial: PiAssistantMessage,
  contentIndex: number,
  context: PiEventMappingContext,
): PiMappedAdapterEvent[] {
  const content = partial.content[contentIndex];
  if (content?.type !== 'toolCall') {
    return [];
  }

  return [
    messageEvent(createToolUseMessage(content, context, partial.timestamp, 'running')),
    { event: 'tool-use', args: [content.name, content.arguments] },
  ];
}

function mapToolCallEnd(
  event: Extract<PiAssistantMessageEvent, { type: 'toolcall_end' }>,
  context: PiEventMappingContext,
): PiMappedAdapterEvent[] {
  return [
    messageEvent(
      createToolUseMessage(event.toolCall, context, event.partial.timestamp, 'completed'),
    ),
    { event: 'tool-use', args: [event.toolCall.name, event.toolCall.arguments] },
  ];
}

function createToolUseMessage(
  toolCall: PiToolCall,
  context: PiEventMappingContext,
  timestamp: number | undefined,
  status: 'running' | 'completed',
): OpenCodeMessage {
  return {
    type: 'tool_use',
    timestamp,
    sessionID: context.sessionId,
    part: {
      id: toolCall.id,
      sessionID: context.sessionId,
      messageID: context.messageId,
      type: 'tool',
      callID: toolCall.id,
      tool: toolCall.name,
      state: {
        status,
        input: toolCall.arguments,
      },
    },
  };
}

export function mapPiToolResult(
  toolName: string,
  input: unknown,
  output: string,
  options: { sessionId?: string; isError?: boolean } = {},
): PiMappedAdapterEvent[] {
  return [
    { event: 'tool-result', args: [output] },
    {
      event: 'tool-call-complete',
      args: [{ toolName, toolInput: input, toolOutput: output, sessionId: options.sessionId }],
    },
  ];
}

function mapDoneEvent(
  event: Extract<PiAssistantMessageEvent, { type: 'done' }>,
): PiMappedAdapterEvent[] {
  return [
    { event: 'step-finish', args: [createStepFinish(event.reason, event.message)] },
    { event: 'complete', args: [{ status: 'success' }] },
  ];
}

function mapErrorEvent(
  event: Extract<PiAssistantMessageEvent, { type: 'error' }>,
): PiMappedAdapterEvent[] {
  const message = event.error.errorMessage ?? `Pi runtime ended with ${event.reason}`;
  const error = new Error(message);

  return [
    { event: 'step-finish', args: [createStepFinish(event.reason, event.error)] },
    { event: 'error', args: [error] },
  ];
}

function createStepFinish(reason: string, message: PiAssistantMessage): StepFinishPayload {
  return {
    reason,
    model: message.responseModel ?? message.model,
    tokens: {
      input: message.usage.input,
      output: message.usage.output,
      reasoning: 0,
      cache: {
        read: message.usage.cacheRead,
        write: message.usage.cacheWrite,
      },
    },
    cost: message.usage.cost.total,
  };
}
