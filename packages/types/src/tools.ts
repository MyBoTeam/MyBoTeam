import { z } from 'zod';

export const ToolParameterTypeSchema = z.enum(['string', 'number', 'boolean', 'array', 'object']);

export type ToolParameterType = z.infer<typeof ToolParameterTypeSchema>;

export const ToolParameterSchema = z.object({
  type: ToolParameterTypeSchema,
  description: z.string().optional(),
  required: z.boolean().default(false),
  enum: z.array(z.string()).optional(),
});

export type ToolParameter = z.infer<typeof ToolParameterSchema>;

export const ToolDefinitionSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().min(1).max(1024),
  parameters: z.record(ToolParameterSchema).default({}),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

export const ToolCallSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  arguments: z.record(z.unknown()),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;
