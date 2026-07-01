import type {
  PluginRegistration,
  RenderingPlugin,
} from '@myboteam/agent-core/ipc/models/rendering-plugin.js';
import { createPluginRegistration } from '@myboteam/agent-core/ipc/models/rendering-plugin.js';
import { createChildLogger } from './logger.js';

const log = createChildLogger('plugin-registry');

export class PluginRegistry {
  private plugins = new Map<string, PluginRegistration>();

  register(plugin: RenderingPlugin): boolean {
    if (this.plugins.has(plugin.id)) {
      log.warn(`Plugin ${plugin.id} already registered`);
      return false;
    }

    const registration = createPluginRegistration(plugin);
    this.plugins.set(plugin.id, registration);
    log.info(`Plugin registered: ${plugin.id}`);
    return true;
  }

  unregister(pluginId: string): boolean {
    const existed = this.plugins.delete(pluginId);
    if (existed) {
      log.info(`Plugin unregistered: ${pluginId}`);
    }
    return existed;
  }

  get(pluginId: string): RenderingPlugin | undefined {
    return this.plugins.get(pluginId)?.plugin;
  }

  getForType(type: string): RenderingPlugin | undefined {
    for (const registration of this.plugins.values()) {
      if (registration.enabled && registration.plugin.supportedTypes.includes(type)) {
        return registration.plugin;
      }
    }
    return undefined;
  }

  list(): Array<{ id: string; name: string; supportedTypes: string[]; enabled: boolean }> {
    return Array.from(this.plugins.values()).map((reg) => ({
      id: reg.plugin.id,
      name: reg.plugin.name,
      supportedTypes: reg.plugin.supportedTypes,
      enabled: reg.enabled,
    }));
  }

  enable(pluginId: string): boolean {
    const registration = this.plugins.get(pluginId);
    if (!registration) return false;
    registration.enabled = true;
    return true;
  }

  disable(pluginId: string): boolean {
    const registration = this.plugins.get(pluginId);
    if (!registration) return false;
    registration.enabled = false;
    return true;
  }

  async healthCheck(): Promise<Record<string, { status: string; message?: string }>> {
    const results: Record<string, { status: string; message?: string }> = {};

    for (const [id, registration] of this.plugins) {
      if (!registration.plugin.health) {
        results[id] = { status: 'no-health-check' };
        continue;
      }

      try {
        const health = await registration.plugin.health();
        results[id] = { status: health.status, message: health.message };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Health check failed';
        results[id] = { status: 'unhealthy', message };
      }
    }

    return results;
  }
}

export function createPluginRegistry(): PluginRegistry {
  return new PluginRegistry();
}
