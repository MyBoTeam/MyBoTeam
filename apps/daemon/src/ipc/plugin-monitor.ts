import { PluginRegistry } from './plugin-registry.js';
import { createChildLogger } from './logger.js';

const log = createChildLogger('plugin-monitor');

export interface PluginHealthStatus {
  pluginId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked: number;
  message?: string;
}

export class PluginMonitor {
  private registry: PluginRegistry;
  private healthStatuses = new Map<string, PluginHealthStatus>();
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(registry: PluginRegistry) {
    this.registry = registry;
  }

  start(intervalMs = 30000): void {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(() => {
      void this.checkAllPlugins();
    }, intervalMs);

    log.info('Plugin monitor started', { intervalMs });
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkPlugin(pluginId: string): Promise<PluginHealthStatus> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      const status: PluginHealthStatus = {
        pluginId,
        status: 'unknown',
        lastChecked: Date.now(),
        message: 'Plugin not found',
      };
      this.healthStatuses.set(pluginId, status);
      return status;
    }

    if (!plugin.health) {
      const status: PluginHealthStatus = {
        pluginId,
        status: 'healthy',
        lastChecked: Date.now(),
        message: 'No health check available',
      };
      this.healthStatuses.set(pluginId, status);
      return status;
    }

    try {
      const health = await plugin.health();
      const status: PluginHealthStatus = {
        pluginId,
        status: health.status,
        lastChecked: Date.now(),
        message: health.message,
      };
      this.healthStatuses.set(pluginId, status);
      return status;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Health check failed';
      const status: PluginHealthStatus = {
        pluginId,
        status: 'unhealthy',
        lastChecked: Date.now(),
        message,
      };
      this.healthStatuses.set(pluginId, status);
      return status;
    }
  }

  async checkAllPlugins(): Promise<PluginHealthStatus[]> {
    const plugins = this.registry.list();
    const statuses = await Promise.all(
      plugins.map((p) => this.checkPlugin(p.id)),
    );

    // Log unhealthy plugins
    for (const status of statuses) {
      if (status.status === 'unhealthy') {
        log.warn(`Plugin unhealthy: ${status.pluginId}`, { message: status.message });
      }
    }

    return statuses;
  }

  getHealthStatus(pluginId: string): PluginHealthStatus | undefined {
    return this.healthStatuses.get(pluginId);
  }

  getAllHealthStatuses(): PluginHealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }
}

export function createPluginMonitor(registry: PluginRegistry): PluginMonitor {
  return new PluginMonitor(registry);
}
