import { z } from 'zod';

export const FinishReasonSchema = z.enum(['stop', 'tool_call', 'length', 'error']);

export type FinishReason = z.infer<typeof FinishReasonSchema>;

export const StreamingChunkSchema = z.object({
  content: z.string().optional(),
  toolCall: z
    .object({
      id: z.string(),
      name: z.string(),
      argumentsDelta: z.string(),
    })
    .optional(),
  finishReason: FinishReasonSchema.optional(),
  usage: z
    .object({
      promptTokens: z.number().nonnegative(),
      completionTokens: z.number().nonnegative(),
    })
    .optional(),
});

export type StreamingChunk = z.infer<typeof StreamingChunkSchema>;
