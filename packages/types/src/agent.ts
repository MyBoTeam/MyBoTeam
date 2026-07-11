import { z } from 'zod';

// Import and re-export AgentStatus from agent-status.ts (ADR-002 aligned)
import {
  type AgentStatus,
  AgentStatusSchema,
  isValidStatus,
  isValidTransition,
  VALID_STATUSES,
  VALID_TRANSITIONS,
} from './agent-status.js';

export {
  type AgentStatus,
  AgentStatusSchema,
  isValidStatus,
  isValidTransition,
  VALID_STATUSES,
  VALID_TRANSITIONS,
};

export const AgentConfigLegacySchema = z
  .object({
    id: z.string().uuid(),
    slug: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens'),
    name: z.string().min(1).max(128),
    description: z.string().max(512).optional(),
    providerId: z.string().uuid(),
    model: z.string().min(1),
    fallbackProviderIds: z.array(z.string().uuid()).optional(),
    systemPrompt: z.string().min(1),
    maxTokens: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    mcpServerIds: z.array(z.string().uuid()).default([]),
    enabled: z.boolean().default(true),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .refine(
    (data) => {
      if (!data.fallbackProviderIds) return true;
      const ids = data.fallbackProviderIds;
      return new Set(ids).size === ids.length;
    },
    { message: 'fallbackProviderIds must not contain duplicates', path: ['fallbackProviderIds'] },
  )
  .refine(
    (data) => {
      if (!data.fallbackProviderIds) return true;
      return !data.fallbackProviderIds.includes(data.providerId);
    },
    {
      message: 'fallbackProviderIds must not contain the primary providerId',
      path: ['fallbackProviderIds'],
    },
  );

export type AgentConfigLegacy = z.infer<typeof AgentConfigLegacySchema>;

export const AgentProcessSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  status: AgentStatusSchema,
  taskId: z.string().uuid().optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  lastActivityAt: z.string().datetime(),
  continuationCount: z.number().int().min(0).default(0),
  error: z.string().optional(),
});

export type AgentProcess = z.infer<typeof AgentProcessSchema>;
