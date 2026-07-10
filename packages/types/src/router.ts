import { z } from 'zod';
import type { RoutingError, RoutingErrorCode } from './errors.js';
import { RoutingErrorCodeSchema, RoutingErrorSchema } from './errors.js';

export type { RoutingError, RoutingErrorCode };
export { RoutingErrorCodeSchema, RoutingErrorSchema };

// --- Fallback Chain ---

export const FallbackProviderEntrySchema = z.object({
  providerId: z.string().min(1),
  priority: z.number().int().min(0),
  source: z.enum(['agent', 'global']),
});

export type FallbackProviderEntry = z.infer<typeof FallbackProviderEntrySchema>;

export const FallbackChainResultSchema = z.object({
  chain: z.array(FallbackProviderEntrySchema),
  requestedProviderId: z.string().min(1),
  resolvedAt: z.string().datetime(),
});

export type FallbackChainResult = z.infer<typeof FallbackChainResultSchema>;

// --- Per-Agent Fallback Config ---

export const FallbackProviderConfigSchema = z.object({
  fallbackProviderIds: z.array(z.string().min(1)).optional(),
});

export type FallbackProviderConfig = z.infer<typeof FallbackProviderConfigSchema>;

// --- Provider Health State ---

export const ProviderHealthStateSchema = z.enum(['healthy', 'degraded', 'cooldown']);

export type ProviderHealthState = z.infer<typeof ProviderHealthStateSchema>;

export const ProviderHealthStateInfoSchema = z.object({
  state: ProviderHealthStateSchema,
  failureCount: z.number().int().min(0),
  cooldownExpiresAt: z.string().datetime().optional(),
  lastFailureAt: z.string().datetime().optional(),
  lastSuccessAt: z.string().datetime().optional(),
  cooldownStartedAt: z.string().datetime().optional(),
});

export type ProviderHealthStateInfo = z.infer<typeof ProviderHealthStateInfoSchema>;

// --- Routing Decision (Debug Logging) ---

export const RoutingDecisionSchema = z.object({
  providerId: z.string().min(1),
  providerName: z.string(),
  model: z.string(),
  fallbackPosition: z.number().int().min(0),
  totalProviders: z.number().int().min(1),
  reason: z.string(),
  attemptTimestamp: z.string().datetime(),
});

export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;

// --- Provider Health Status Response ---

export const ProviderHealthStatusSchema = z.object({
  providerId: z.string().min(1),
  providerName: z.string(),
  state: ProviderHealthStateSchema,
  consecutiveFailures: z.number().int().min(0),
  cooldownExpiresAt: z.string().datetime().optional(),
  lastFailureReason: z.string().optional(),
  lastSuccessAt: z.string().datetime().optional(),
});

export type ProviderHealthStatus = z.infer<typeof ProviderHealthStatusSchema>;
