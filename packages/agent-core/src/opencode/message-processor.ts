import { createMessageId } from '../common/index.js';
import type { OpenCodeMessage, OpenCodeToolUseMessage } from '../common/types/opencode.js';
import type { TaskMessage } from '../common/types/task.js';
import { extractScreenshots } from './message-attachments.js';
import {
  getToolDisplayName,
  sanitizeAssistantTextForDisplay,
  sanitizeToolOutput,
} from './message-sanitization.js';

export type { MessageAttachment } from './message-attachments.js';
export { extractScreenshots } from './message-attachments.js';
export type { MessageBatcher } from './message-batcher.js';
export {
  createMessageBatcher,
  flushAndCleanupBatcher,
  MESSAGE_BATCH_DELAY_MS,
  queueMessage,
} from './message-batcher.js';
export {
  getToolDisplayName,
  sanitizeAssistantTextForDisplay,
  sanitizeToolOutput,
} from './message-sanitization.js';

const MAX_TOOL_OUTPUT_LENGTH = 200_000;

export interface ModelContext {
  modelId?: string;
  providerId?: string;
}

function getStableTextMessageId(message: OpenCodeMessage & { type: 'text' }): string {
  return `${message.part.sessionID}:${message.part.messageID}`;
}

function getStableToolUseMessageId(message: OpenCodeToolUseMessage): string {
  return `${message.part.sessionID}:${message.part.id}`;
}

export { mergeTaskMessage } from '../common/utils/task-message-merge.js';

function getTaskMessageTimestamp(message: OpenCodeMessage): string {
  return new Date(message.timestamp ?? Date.now()).toISOString();
}

export function toTaskMessage(
  message: OpenCodeMessage,
  modelContext?: ModelContext,
): TaskMessage | null {
  if (message.type === 'text') {
    const sanitized = sanitizeAssistantTextForDisplay(message.part.text || '');
    if (sanitized) {
      return {
        id: getStableTextMessageId(message),
        type: 'assistant',
        content: sanitized,
        timestamp: getTaskMessageTimestamp(message),
        ...(modelContext?.modelId && { modelId: modelContext.modelId }),
        ...(modelContext?.providerId && { providerId: modelContext.providerId }),
      };
    }
    return null;
  }

  if (message.type === 'tool_call') {
    const displayName = getToolDisplayName(message.part.tool);
    if (displayName === null) {
      return null;
    }
    return {
      id: createMessageId(),
      type: 'tool',
      content: `Using tool: ${displayName}`,
      toolName: message.part.tool,
      toolInput: message.part.input,
      timestamp: getTaskMessageTimestamp(message),
      ...(modelContext?.modelId && { modelId: modelContext.modelId }),
      ...(modelContext?.providerId && { providerId: modelContext.providerId }),
    };
  }

  if (message.type === 'tool_use') {
    const toolUseMsg = message as OpenCodeToolUseMessage;
    const toolName = toolUseMsg.part.tool || 'unknown';
    const displayName = getToolDisplayName(toolName);
    if (displayName === null) {
      return null;
    }
    const toolInput = toolUseMsg.part.state?.input;
    const toolOutput = toolUseMsg.part.state?.output || '';
    const status = toolUseMsg.part.state?.status;

    if (status === 'running' || status === 'completed' || status === 'error') {
      const wasTruncated = toolOutput.length > MAX_TOOL_OUTPUT_LENGTH;
      const stableOutput = wasTruncated
        ? `${toolOutput.slice(0, MAX_TOOL_OUTPUT_LENGTH)}\n[Tool output truncated]`
        : toolOutput;

      const { cleanedText, attachments } =
        status === 'running'
          ? { cleanedText: '', attachments: [] as never[] }
          : extractScreenshots(stableOutput);
      const isError = status === 'error';
      const sanitizedText = sanitizeToolOutput(cleanedText, isError);
      const displayText =
        sanitizedText.length > 500 ? `${sanitizedText.substring(0, 500)}...` : sanitizedText;

      return {
        id: getStableToolUseMessageId(toolUseMsg),
        type: 'tool',
        content: displayText || `Tool ${toolName} ${status}`,
        toolName,
        toolStatus: status,
        toolInput,
        timestamp: getTaskMessageTimestamp(message),
        attachments: !wasTruncated && attachments.length > 0 ? attachments : undefined,
        ...(modelContext?.modelId && { modelId: modelContext.modelId }),
        ...(modelContext?.providerId && { providerId: modelContext.providerId }),
      };
    }
    return null;
  }

  return null;
}
