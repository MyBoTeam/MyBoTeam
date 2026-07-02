import { z } from 'zod';

export const ModelCapabilitiesSchema = z.object({
  tools: z.boolean().default(false),
  vision: z.boolean().default(false),
  streaming: z.boolean().default(true),
});

export type ModelCapabilities = z.infer<typeof ModelCapabilitiesSchema>;

export const ModelInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  contextWindow: z.number().positive().optional(),
  capabilities: ModelCapabilitiesSchema.default({}),
});

export type ModelInfo = z.infer<typeof ModelInfoSchema>;
