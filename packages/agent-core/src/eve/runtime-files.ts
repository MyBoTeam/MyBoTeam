import type { InferenceParams } from '@myboteam/types';

/**
 * Tool catalog entry - represents a tool available to an agent
 * Aligned with ADR-002 (Eve Agent Harness)
 */
export interface ToolCatalogEntry {
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
  readonly required: boolean;
}

/**
 * Delegation policy rule
 * Controls which agents this agent can delegate tasks to
 */
export interface DelegationRule {
  readonly targetAgent: string;
  readonly condition: string;
  readonly maxDepth: number;
}

/**
 * Delegation policy configuration
 */
export interface DelegationPolicy {
  readonly enabled: boolean;
  readonly rules: DelegationRule[];
  readonly defaultBehavior: 'allow' | 'deny';
}

/**
 * Agent-specific provider configuration for LLM inference
 * API keys are NOT stored here - injected at runtime by BYOKInjector
 * Aligned with ADR-006 (LLM Provider Model)
 */
export interface AgentProviderConfig {
  readonly provider: string;
  readonly model: string;
  readonly inferenceParams: InferenceParams;
  readonly timeout?: number;
  readonly maxRetries?: number;
}

/**
 * Materialized agent runtime files structure
 */
export interface MaterializedFiles {
  readonly instructions: string;
  readonly toolCatalog: ToolCatalogEntry[];
  readonly delegationPolicy: DelegationPolicy | null;
  readonly providerConfig: AgentProviderConfig;
  readonly checksums: Record<string, string>;
}

/**
 * Materialization options
 */
export interface MaterializeOptions {
  readonly baseDir: string;
  readonly availableTools: ToolCatalogEntry[];
}

/**
 * Result of a materialization operation
 */
export interface MaterializeResult {
  readonly agentId: string;
  readonly agentName: string;
  readonly outputDir: string;
  readonly filesGenerated: string[];
  readonly checksum: string;
  readonly durationMs: number;
}

/**
 * Default inference parameters for an agent
 */
export const DEFAULT_INFERENCE_PARAMS: InferenceParams = {
  temperature: 0.7,
  maxTokens: 4096,
};
