import type { RenderingPlugin, RenderingPluginRequest, RenderingPluginResult } from '@myboteam/agent-core/ipc/models/rendering-plugin.js';

export class PlainTextPlugin implements RenderingPlugin {
  readonly id = 'plain-text';
  readonly name = 'Plain Text Renderer';
  readonly supportedTypes = ['text'];

  async render(request: RenderingPluginRequest): Promise<RenderingPluginResult> {
    try {
      const { data, options } = request;

      // Extract text content
      let text: string;
      if (typeof data === 'string') {
        text = data;
      } else if (typeof data === 'object' && data !== null && 'content' in data) {
        text = String((data as { content: unknown }).content);
      } else {
        text = JSON.stringify(data, null, 2);
      }

      // Apply basic formatting options
      const maxLength = (options?.maxLength as number) ?? undefined;
      if (maxLength && text.length > maxLength) {
        text = text.slice(0, maxLength) + '...';
      }

      return {
        success: true,
        content: text,
        metadata: {
          length: text.length,
          format: 'plain-text',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Render failed',
      };
    }
  }

  async health() {
    return {
      status: 'healthy' as const,
      lastChecked: Date.now(),
    };
  }
}

export function createPlainTextPlugin(): PlainTextPlugin {
  return new PlainTextPlugin();
}
