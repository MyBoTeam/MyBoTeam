import type {
  RenderingPluginRequest,
  RenderingPluginResult,
} from '@myboteam/agent-core/ipc/models/rendering-plugin.js';
import { createChildLogger } from '../logger.js';
import { recordRequest } from '../metrics.js';
import type { PluginLoader } from '../plugin-loader.js';

const log = createChildLogger('render-handler');

const MAX_REQUEST_SIZE = 1 * 1024 * 1024; // 1MB

export async function handleRender(
  params: unknown,
  clientId: string,
  pluginLoader: PluginLoader,
): Promise<RenderingPluginResult> {
  const startTime = Date.now();

  const { type, data, options } = params as {
    type?: string;
    data?: unknown;
    options?: Record<string, unknown>;
  };

  if (!type || typeof type !== 'string') {
    throw new Error('Missing required param: type');
  }

  if (data === undefined || data === null) {
    throw new Error('Missing required param: data');
  }

  // FR-008: Enforce request size limits
  const requestSize = JSON.stringify(data).length;
  if (requestSize > MAX_REQUEST_SIZE) {
    throw new Error(`Request too large: ${requestSize} bytes (max: ${MAX_REQUEST_SIZE})`);
  }

  const plugin = pluginLoader.getPluginForType(type);
  if (!plugin) {
    throw new Error(`No plugin found for type: ${type}`);
  }

  log.info('Rendering request', { clientId, type, requestId: `req_${Date.now()}` });

  try {
    const request: RenderingPluginRequest = { type, data, options };
    const result = await plugin.render(request);

    const durationMs = Date.now() - startTime;
    recordRequest(durationMs, result.success);

    log.info('Render completed', {
      clientId,
      type,
      success: result.success,
      durationMs,
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    recordRequest(durationMs, false);

    const message = error instanceof Error ? error.message : 'Render failed';
    log.error('Render failed', { clientId, type, error: message });

    return {
      success: false,
      error: message,
    };
  }
}
