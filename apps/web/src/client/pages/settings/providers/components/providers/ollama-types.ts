import type { ToolSupportStatus } from '@myboteam/agent-core';

export interface OllamaModel {
  id: string;
  name: string;
  toolSupport?: ToolSupportStatus;
}
