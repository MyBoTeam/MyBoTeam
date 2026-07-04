import { z } from 'zod';

export const LocalProviderTypeSchema = z.enum(['ollama', 'lmstudio']);

export type LocalProviderType = z.infer<typeof LocalProviderTypeSchema>;

export const LocalProviderConfigSchema = z.object({
  name: z.string().min(1).max(128),
  type: LocalProviderTypeSchema,
  endpoint: z.string().url(),
  apiKey: z.string().optional(),
  headers: z.record(z.string()).default({}),
  timeout: z.number().positive().default(120_000),
  enabled: z.boolean().default(true),
});

export type LocalProviderConfig = z.infer<typeof LocalProviderConfigSchema>;

export const DiscoveredProviderSchema = z.object({
  type: LocalProviderTypeSchema,
  port: z.number().int().positive(),
  available: z.boolean(),
  models: z.array(z.unknown()).default([]),
});

export type DiscoveredProvider = z.infer<typeof DiscoveredProviderSchema>;

export const ProviderCapabilitySchema = z.object({
  streaming: z.boolean().default(true),
  tools: z.boolean().default(false),
  vision: z.boolean().default(false),
  maxContextWindow: z.number().positive().optional(),
});

export type ProviderCapability = z.infer<typeof ProviderCapabilitySchema>;
