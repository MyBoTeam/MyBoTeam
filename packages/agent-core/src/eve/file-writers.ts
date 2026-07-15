import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import type { AgentConfig } from '@myboteam/types';
import type { AgentProviderConfig, DelegationPolicy, ToolCatalogEntry } from './runtime-files.js';
import { DEFAULT_INFERENCE_PARAMS } from './runtime-files.js';

/**
 * Compute SHA-256 checksum of content
 */
export function computeChecksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Write tool-catalog.json
 * Contains the list of tools available to this agent, filtered by assigned skills
 */
export async function writeToolCatalog(
  outputPath: string,
  tools: ToolCatalogEntry[],
): Promise<string> {
  const content = JSON.stringify(tools, null, 2);
  await fs.writeFile(outputPath, content, 'utf8');
  return content;
}

/**
 * Write delegation-policy.json (omitted when agent has no delegation rules)
 */
export async function writeDelegationPolicy(
  outputPath: string,
  policy: DelegationPolicy,
): Promise<string> {
  const content = JSON.stringify(policy, null, 2);
  await fs.writeFile(outputPath, content, 'utf8');
  return content;
}

/**
 * Write provider-config.json
 * LLM provider and model configuration (API keys injected at runtime by BYOKInjector)
 */
export async function writeProviderConfig(
  outputPath: string,
  config: AgentProviderConfig,
): Promise<string> {
  const content = JSON.stringify(config, null, 2);
  await fs.writeFile(outputPath, content, 'utf8');
  return content;
}

/**
 * Write checksums.sha256
 * Manifest of all materialized files with SHA-256 hashes for integrity verification
 */
export async function writeChecksumManifest(
  outputPath: string,
  files: {
    toolCatalog: ToolCatalogEntry[];
    delegationPolicy: DelegationPolicy | null;
    providerConfig: AgentProviderConfig;
  },
  instructionsContent: string,
): Promise<string> {
  const checksums: Record<string, string> = {};

  // Instructions (provided as string)
  checksums['instructions.md'] = computeChecksum(instructionsContent);

  // Tool catalog
  checksums['tool-catalog.json'] = computeChecksum(JSON.stringify(files.toolCatalog, null, 2));

  // Delegation policy (if present)
  if (files.delegationPolicy) {
    checksums['delegation-policy.json'] = computeChecksum(
      JSON.stringify(files.delegationPolicy, null, 2),
    );
  }

  // Provider config
  checksums['provider-config.json'] = computeChecksum(
    JSON.stringify(files.providerConfig, null, 2),
  );

  const content = JSON.stringify(checksums, null, 2);
  await fs.writeFile(outputPath, content, 'utf8');
  return content;
}

/**
 * Build default provider config from agent config
 */
export function buildProviderConfig(
  provider: string,
  model: string,
  params?: Record<string, unknown>,
): AgentProviderConfig {
  return {
    provider,
    model,
    inferenceParams: { ...DEFAULT_INFERENCE_PARAMS, ...params },
  };
}

/**
 * Generate default instructions template
 * Creates a markdown template with agent profile metadata placeholders
 */
export function generateInstructionsTemplate(config: AgentConfig): string {
  const sections: string[] = [];

  sections.push(`# ${config.name}`);
  sections.push('');

  if (config.description) {
    sections.push(`## Role`);
    sections.push(config.description);
    sections.push('');
  }

  if (config.role) {
    sections.push(`## Purpose`);
    sections.push(config.role);
    sections.push('');
  }

  sections.push(`## Capabilities`);
  sections.push('');
  if (config.skills.length > 0) {
    sections.push(`This agent has access to the following skills:`);
    for (const skill of config.skills) {
      sections.push(`- ${skill}`);
    }
  } else {
    sections.push(`This agent has no specific skills assigned.`);
  }
  sections.push('');

  if (config.mcps.length > 0) {
    sections.push(`## MCP Servers`);
    sections.push('');
    sections.push(`This agent has access to the following MCP servers:`);
    for (const mcp of config.mcps) {
      sections.push(`- ${mcp}`);
    }
    sections.push('');
  }

  sections.push(`## Model`);
  sections.push('');
  sections.push(`Provider: ${config.provider}`);
  sections.push(`Model: ${config.model}`);
  sections.push('');

  return sections.join('\n');
}

/**
 * Write instructions.md with agent profile metadata injected
 * FR-002: Inject agent profile metadata (name, description, role) into instructions.md
 * SC-003: 100% of agent profile fields present in instructions.md
 */
export async function writeInstructions(outputPath: string, config: AgentConfig): Promise<string> {
  const content = generateInstructionsTemplate(config);
  await fs.writeFile(outputPath, content, 'utf8');
  return content;
}
