import { z } from 'zod';

/**
 * InferenceParamsSchema - LLM inference tuning parameters
 * Aligned with ADR-006 (LLM Provider Model)
 */
export const InferenceParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  extras: z.record(z.string(), z.unknown()).optional(),
});

export type InferenceParams = z.infer<typeof InferenceParamsSchema>;

/**
 * AgentConfigSchema - Agent configuration with Zod validation
 * Aligned with v0.2.0 reference implementation patterns
 */
export const AgentConfigSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[a-zA-Z0-9 _-]+$/, 'Name must be alphanumeric with hyphens, underscores, spaces'),
    description: z.string().max(512).optional(),
    role: z.string().max(256).optional(),
    model: z.string().min(1),
    provider: z.string().min(1),
    params: InferenceParamsSchema.optional(),
    secrets: z.array(z.string().min(1)).max(50).optional().default([]),
    skills: z.array(z.string().min(1)).max(50).optional().default([]),
    mcps: z.array(z.string().min(1)).max(10).optional().default([]),
  })
  .strict();

export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type AgentConfigPartial = Partial<AgentConfig>;
