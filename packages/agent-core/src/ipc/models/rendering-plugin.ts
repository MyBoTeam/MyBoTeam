export interface RenderingPlugin {
  id: string;
  name: string;
  supportedTypes: string[];
  render(request: RenderingPluginRequest): Promise<RenderingPluginResult>;
  health?(): Promise<PluginHealth>;
}

export interface RenderingPluginRequest {
  type: string;
  data: unknown;
  options?: Record<string, unknown>;
}

export interface RenderingPluginResult {
  success: boolean;
  content?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface PluginHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastChecked: number;
}

export interface PluginRegistration {
  plugin: RenderingPlugin;
  registeredAt: number;
  enabled: boolean;
}

export function createPluginRegistration(plugin: RenderingPlugin): PluginRegistration {
  return {
    plugin,
    registeredAt: Date.now(),
    enabled: true,
  };
}
