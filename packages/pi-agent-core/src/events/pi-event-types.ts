import type { OpenCodeMessage, TaskResult } from '../adapter/task-runtime-types.js';

export interface PiTextContent {
  type: 'text';
  text: string;
}

export interface PiThinkingContent {
  type: 'thinking';
  thinking: string;
}

export interface PiToolCall {
  type: 'toolCall';
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface PiUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: { total: number };
}

export interface PiAssistantMessage {
  role: 'assistant';
  content: Array<PiTextContent | PiThinkingContent | PiToolCall>;
  model: string;
  responseModel?: string;
  usage: PiUsage;
  stopReason: string;
  errorMessage?: string;
  timestamp: number;
}

export type PiAssistantMessageEvent =
  | { type: 'start'; partial: PiAssistantMessage }
  | { type: 'text_start'; contentIndex: number; partial: PiAssistantMessage }
  | { type: 'text_delta'; contentIndex: number; delta: string; partial: PiAssistantMessage }
  | { type: 'text_end'; contentIndex: number; content: string; partial: PiAssistantMessage }
  | { type: 'thinking_start'; contentIndex: number; partial: PiAssistantMessage }
  | { type: 'thinking_delta'; contentIndex: number; delta: string; partial: PiAssistantMessage }
  | { type: 'thinking_end'; contentIndex: number; content: string; partial: PiAssistantMessage }
  | { type: 'toolcall_start'; contentIndex: number; partial: PiAssistantMessage }
  | { type: 'toolcall_delta'; contentIndex: number; delta: string; partial: PiAssistantMessage }
  | {
      type: 'toolcall_end';
      contentIndex: number;
      toolCall: PiToolCall;
      partial: PiAssistantMessage;
    }
  | { type: 'done'; reason: 'stop' | 'length' | 'toolUse'; message: PiAssistantMessage }
  | { type: 'error'; reason: 'aborted' | 'error'; error: PiAssistantMessage };

export type PiMappedAdapterEvent =
  | { event: 'message'; args: [OpenCodeMessage] }
  | { event: 'tool-use'; args: [string, unknown] }
  | { event: 'tool-result'; args: [string] }
  | {
      event: 'tool-call-complete';
      args: [
        {
          toolName: string;
          toolInput: unknown;
          toolOutput: string;
          sessionId?: string;
        },
      ];
    }
  | {
      event: 'step-finish';
      args: [
        {
          reason: string;
          model?: string;
          tokens?: {
            input: number;
            output: number;
            reasoning: number;
            cache?: { read: number; write: number };
          };
          cost?: number;
        },
      ];
    }
  | { event: 'complete'; args: [TaskResult] }
  | { event: 'error'; args: [Error] }
  | { event: 'reasoning'; args: [string] };
