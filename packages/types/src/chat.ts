import { z } from 'zod';
import { ToolCallSchema, ToolDefinitionSchema } from './tools.js';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  timestamp: z.string().datetime().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  model: z.string().min(1),
  messages: z.array(ChatMessageSchema).min(1),
  tools: z.array(ToolDefinitionSchema).optional(),
  timeout: z.number().positive().default(120_000),
  options: z.record(z.unknown()).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  message: z.object({
    role: z.literal('assistant'),
    content: z.string(),
    timestamp: z.string().datetime(),
  }),
  toolCalls: z.array(ToolCallSchema).optional(),
  usage: z
    .object({
      promptTokens: z.number().nonnegative(),
      completionTokens: z.number().nonnegative(),
      totalTokens: z.number().nonnegative(),
    })
    .optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
