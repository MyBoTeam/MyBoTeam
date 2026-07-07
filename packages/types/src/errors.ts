import { z } from 'zod';

export const ErrorCategorySchema = z.enum(['auth', 'rate_limit', 'network', 'provider']);

export type ErrorCategory = z.infer<typeof ErrorCategorySchema>;

export const ProviderErrorSchema = z.object({
  category: ErrorCategorySchema,
  code: z.string().min(1),
  message: z.string().min(1),
  statusCode: z.number().int().optional(),
  retryable: z.boolean().default(false),
  provider: z.string().optional(),
  providerMessage: z.string().optional(),
  details: z.unknown().optional(),
});

export type ProviderError = z.infer<typeof ProviderErrorSchema>;
