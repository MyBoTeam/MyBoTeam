import { z } from "zod";

export const ProviderTypeSchema = z.enum([
  "anthropic",
  "openai",
  "ollama",
  "custom",
]);

export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const ProviderConfigSchema = z.record(z.string(), z.unknown());

export const ProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128),
  type: ProviderTypeSchema,
  baseUrl: z.string().url().optional(),
  config: ProviderConfigSchema.default({}),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Provider = z.infer<typeof ProviderSchema>;
