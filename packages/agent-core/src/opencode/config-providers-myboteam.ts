import { createConsoleLogger } from '../utils/logging.js';
import type { ProviderBuildContext, ProviderBuildResult } from './config-provider-context.js';

const log = createConsoleLogger({ prefix: 'MyboteamAiConfigBuilder' });

export async function buildMyboteamAiConfig(
  ctx: ProviderBuildContext,
): Promise<ProviderBuildResult> {
  if (!ctx.myboteamRuntime?.isAvailable()) {
    return { configs: [], enableToAdd: [] };
  }
  const provider = ctx.providerSettings.connectedProviders['myboteam-ai'];
  if (provider?.connectionStatus !== 'connected') {
    return { configs: [], enableToAdd: [] };
  }
  if (!ctx.myboteamStorageDeps) {
    log.warn('MyBoTeam AI connected but storage deps not available — skipping');
    return { configs: [], enableToAdd: [] };
  }
  try {
    return await ctx.myboteamRuntime.buildProviderConfig(ctx.myboteamStorageDeps);
  } catch (err) {
    log.error('Failed to start MyBoTeam AI proxy', {
      error: err instanceof Error ? err.message : String(err),
    });
    return { configs: [], enableToAdd: [] };
  }
}
