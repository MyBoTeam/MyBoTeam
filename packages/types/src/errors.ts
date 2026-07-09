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

// --- Routing Error Codes ---

export const RoutingErrorCodeSchema = z.enum([
  'PROVIDER_UNAVAILABLE',
  'ALL_PROVIDERS_FAILED',
  'FALLBACK_EXHAUSTED',
  'COOLDOWN_ACTIVE',
  'VAULT_LOCKED',
  'NO_PROVIDER_CONFIGURED',
]);

export type RoutingErrorCode = z.infer<typeof RoutingErrorCodeSchema>;

export const RoutingErrorSchema = z.object({
  code: RoutingErrorCodeSchema,
  message: z.string().min(1),
  provider: z.string().optional(),
  cooldownExpiresAt: z.string().datetime().optional(),
  details: z.unknown().optional(),
});

export type RoutingError = z.infer<typeof RoutingErrorSchema>;
