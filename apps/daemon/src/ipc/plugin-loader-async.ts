import type { RenderingPlugin, PluginHealth } from '@myboteam/agent-core/ipc/models/rendering-plugin.js';
import { PluginRegistry } from './plugin-registry.js';
import { createChildLogger } from './logger.js';

const log = createChildLogger('plugin-loader-async');

export class PluginLoaderAsync {
  private registry: PluginRegistry;

  constructor(registry: PluginRegistry) {
    this.registry = registry;
  }

  async loadPlugin(plugin: RenderingPlugin): Promise<{ success: boolean; error?: string }> {
    try {
      const registered = this.registry.register(plugin);
      if (!registered) {
        return { success: false, error: `Plugin ${plugin.id} already registered` };
      }

      // Run health check if available
      if (plugin.health) {
        const health = await plugin.health();
        if (health.status === 'unhealthy') {
          log.warn(`Plugin ${plugin.id} is unhealthy`, { message: health.message });
        }
      }

      log.info(`Plugin loaded: ${plugin.id}`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Failed to load plugin: ${plugin.id}`, { error: message });
      return { success: false, error: message };
    }
  }

  async unloadPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      return false;
    }

    // Call cleanup if available
    if ('cleanup' in plugin && typeof plugin.cleanup === 'function') {
      try {
        await (plugin as { cleanup: () => Promise<void> }).cleanup();
      } catch (error) {
        log.error(`Error cleaning up plugin: ${pluginId}`, { error: String(error) });
      }
    }

    return this.registry.unregister(pluginId);
  }

  async reloadPlugin(plugin: RenderingPlugin): Promise<{ success: boolean; error?: string }> {
    await this.unloadPlugin(plugin.id);
    return this.loadPlugin(plugin);
  }

  async loadPlugins(plugins: RenderingPlugin[]): Promise<Array<{ id: string; success: boolean; error?: string }>> {
    const results = await Promise.allSettled(
      plugins.map(async (plugin) => {
        const result = await this.loadPlugin(plugin);
        return { id: plugin.id, ...result };
      }),
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return { id: 'unknown', success: false, error: result.reason?.message ?? 'Unknown error' };
    });
  }
}

export function createPluginLoaderAsync(registry: PluginRegistry): PluginLoaderAsync {
  return new PluginLoaderAsync(registry);
}
