import { mkdir, readdir, rm } from 'node:fs/promises';
import * as path from 'node:path';
import type { AgentConfig } from '@myboteam/types';
import { AgentConfigSchema } from '@myboteam/types';
import { Logger } from '../daemon/lifecycle/logger.js';
import {
  buildProviderConfig,
  computeChecksum,
  writeChecksumManifest,
  writeDelegationPolicy,
  writeInstructions,
  writeProviderConfig,
  writeToolCatalog,
} from './file-writers.js';
import type { MaterializeOptions, MaterializeResult } from './runtime-files.js';

const logger = new Logger('EveMaterializer');

/**
 * Resolve agent directory and validate it is a strict descendant of baseDir
 * Prevents path traversal attacks via agentId (e.g., "../../target")
 */
function resolveAgentDirectory(baseDir: string, agentId: string): string {
  const resolvedBase = path.resolve(baseDir);
  const outputDir = path.resolve(resolvedBase, agentId);
  const relative = path.relative(resolvedBase, outputDir);

  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Invalid agent identifier: ${agentId}`);
  }

  return outputDir;
}

/**
 * Materialize agent configuration into deterministic runtime files
 *
 * Generates five individual runtime files from agent configuration:
 * - instructions.md (generated separately by writeInstructions)
 * - tool-catalog.json
 * - delegation-policy.json (omitted when no rules)
 * - provider-config.json
 * - checksums.sha256
 *
 * @param config - Agent configuration to materialize
 * @param options - Materialization options (base directory, available tools)
 * @returns Materialization result with file paths and checksums
 * @throws Error if agent config is invalid
 */
export async function materialize(
  config: AgentConfig,
  options: MaterializeOptions,
): Promise<MaterializeResult> {
  const startTime = Date.now();

  // Validate agent config
  const result = AgentConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Invalid agent config: ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  const validConfig = result.data;
  const agentId = validConfig.id ?? validConfig.name;
  const outputDir = resolveAgentDirectory(options.baseDir, agentId);

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Filter tool catalog based on assigned skills
  const filteredTools = options.availableTools.filter(
    (tool) => validConfig.skills.length === 0 || validConfig.skills.includes(tool.name),
  );

  // Build provider config (API keys NOT included - injected at runtime)
  const providerConfig = buildProviderConfig(
    validConfig.provider,
    validConfig.model,
    validConfig.params,
  );

  const allTargets = [
    'tool-catalog.json',
    'provider-config.json',
    'instructions.md',
    'checksums.sha256',
  ];

  const writtenFiles: string[] = [];

  try {
    // Write tool catalog
    await writeToolCatalog(path.join(outputDir, 'tool-catalog.json'), filteredTools);
    writtenFiles.push('tool-catalog.json');

    // Write provider config
    await writeProviderConfig(path.join(outputDir, 'provider-config.json'), providerConfig);
    writtenFiles.push('provider-config.json');

    // Write delegation policy only if rules exist
    const delegationPolicy = options.delegationPolicy ?? null;
    if (delegationPolicy) {
      allTargets.push('delegation-policy.json');
      await writeDelegationPolicy(path.join(outputDir, 'delegation-policy.json'), delegationPolicy);
      writtenFiles.push('delegation-policy.json');
    }

    // Write instructions.md with profile metadata injected
    const instructionsContent = await writeInstructions(
      path.join(outputDir, 'instructions.md'),
      validConfig,
    );
    writtenFiles.push('instructions.md');

    // Compute checksums
    const checksumsContent = await writeChecksumManifest(
      path.join(outputDir, 'checksums.sha256'),
      {
        toolCatalog: filteredTools,
        delegationPolicy,
        providerConfig,
      },
      instructionsContent,
    );
    writtenFiles.push('checksums.sha256');

    const durationMs = Date.now() - startTime;
    const checksum = computeChecksum(checksumsContent);

    logger.info('Agent materialized', {
      agentId,
      agentName: validConfig.name,
      outputDir,
      durationMs,
      operation: 'materialize',
    });

    return {
      agentId,
      agentName: validConfig.name,
      outputDir,
      filesGenerated: writtenFiles,
      checksum,
      durationMs,
    };
  } catch (error) {
    // FR-009: Clean up partial output on failure
    logger.error('Materialization failed, cleaning up partial files', {
      agentId,
      outputDir,
      error: error instanceof Error ? error.message : String(error),
      operation: 'materialize',
    });

    // Remove any files we attempted to write
    for (const file of allTargets) {
      try {
        await rm(path.join(outputDir, file), { force: true });
      } catch {
        // Ignore cleanup errors for individual files
      }
    }

    // Remove the output directory if it was created by us and is now empty
    try {
      const remaining = await readdir(outputDir);
      if (remaining.length === 0) {
        await rm(outputDir, { recursive: true, force: true });
      }
    } catch {
      // Directory may not exist — ignore
    }

    throw error;
  }
}

/**
 * Dematerialize agent runtime files
 * Removes all materialized files for an agent
 */
export async function dematerialize(agentId: string, baseDir: string): Promise<void> {
  const outputDir = resolveAgentDirectory(baseDir, agentId);

  try {
    await rm(outputDir, { recursive: true, force: true });
    logger.info('Agent dematerialized', {
      agentId,
      outputDir,
      operation: 'dematerialize',
    });
  } catch (error) {
    logger.error('Failed to dematerialize agent', {
      agentId,
      outputDir,
      error: error instanceof Error ? error.message : String(error),
      operation: 'dematerialize',
    });
    throw error;
  }
}
